import 'dotenv/config';
import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../app.js';
import { MAX_IMAGE_BYTES } from '../storage/blogImages.js';
import { migrateBlogImages } from '../storage/migrateBlogImages.js';

import { db } from '../db/knex.js';
import { signSession } from '../utils/jwt.js';

const app = createApp();
let uploadDir: string;
before(async () => {
  uploadDir = await mkdtemp(path.join(os.tmpdir(), 'blog-images-test-'));
  process.env.UPLOADS_DIR = uploadDir;
  await db('blog_posts').delete();
});
after(async () => {
  await db('blog_posts').delete(); await db.destroy();
  await rm(uploadDir, { recursive: true, force: true });
});
const adminUsername = (process.env.ADMIN_USERNAME ?? '').toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD ?? '';

async function loginAgent() {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ username: adminUsername, password: adminPassword });
  return agent;
}

test('admin can create a post and the public endpoint returns it with an incremented view count', async () => {
  const agent = await loginAgent();

  const createResponse = await agent.post('/api/admin/posts').send({
    title: 'Test Yazısı',
    summary: 'Test özeti',
    content: 'Test içerik',
    published: true,
  });
  assert.equal(createResponse.status, 201);
  const slug = createResponse.body.slug;

  const publicResponse = await request(app).get(`/api/posts/${slug}`);
  assert.equal(publicResponse.status, 200);
  assert.equal(publicResponse.body.title, 'Test Yazısı');
  assert.equal(publicResponse.body.views, 1);
});

test('POST /api/admin/posts rejects an unauthenticated request', async () => {
  const response = await request(app).post('/api/admin/posts').send({ title: 'x' });
  assert.equal(response.status, 401);
});

test('POST /api/admin/posts rejects an empty title', async () => {
  const agent = await loginAgent();
  const response = await agent.post('/api/admin/posts').send({ title: '' });
  assert.equal(response.status, 400);
});

test('DELETE /api/admin/posts/:id removes the post', async () => {
  const agent = await loginAgent();
  const createResponse = await agent.post('/api/admin/posts').send({ title: 'Silinecek Yazı' });
  const id = createResponse.body.id;

  const deleteResponse = await agent.delete(`/api/admin/posts/${id}`);
  assert.equal(deleteResponse.status, 200);

  const getResponse = await request(app).get(`/api/posts/${createResponse.body.slug}`);
  assert.equal(getResponse.status, 404);
});

test('PATCH /api/admin/posts/:id/publish toggles published state', async () => {
  const agent = await loginAgent();
  const createResponse = await agent.post('/api/admin/posts').send({ title: 'Taslak Yazı', published: true });
  const id = createResponse.body.id;

  const toggled = await agent.patch(`/api/admin/posts/${id}/publish`);
  assert.equal(toggled.status, 200);
  assert.equal(toggled.body.published, false);
});

test('POST /api/posts/:id/like increments and returns the new like count', async () => {
  const agent = await loginAgent();
  const createResponse = await agent.post('/api/admin/posts').send({ title: 'Beğenilecek Yazı' });
  const id = createResponse.body.id;

  const likeResponse = await request(app).post(`/api/posts/${id}/like`);
  assert.equal(likeResponse.status, 200);
  assert.equal(likeResponse.body.likes, 1);
});


test('drafts are hidden from public detail, lists, and likes', async () => {
  const agent = await loginAgent();
  const created = await agent.post('/api/admin/posts').send({ title: 'Hidden draft', published: false });
  assert.equal(created.status, 201);
  assert.equal((await request(app).get(`/api/posts/${created.body.slug}`)).status, 404);
  assert.equal((await request(app).post(`/api/posts/${created.body.id}/like`)).status, 404);
  const list = await request(app).get('/api/posts');
  assert.ok(!list.body.posts.some((post: { id: number }) => post.id === created.body.id));
});

test('admin updates persist tags and public filters/pagination work', async () => {
  const agent = await loginAgent();
  const created = await agent.post('/api/admin/posts').send({ title: 'Filter test', category: 'Special', tags: ['unique-tag'] });
  const updated = await agent.put(`/api/admin/posts/${created.body.id}`).send({ summary: 'Updated', featured: true });
  assert.equal(updated.status, 200);
  assert.deepEqual(updated.body.tags, ['unique-tag']);
  assert.equal(updated.body.featured, true);
  const list = await request(app).get('/api/posts').query({ category: 'Special', searchQuery: 'unique-tag', limit: 1 });
  assert.equal(list.status, 200);
  assert.equal(list.body.total, 1);
  assert.equal(list.body.posts[0].summary, 'Updated');
});

test('invalid pagination/IDs fail validation and missing likes return 404', async () => {
  for (const query of [{ page: -1 }, { limit: 101 }, { page: 1.5 }]) {
    assert.equal((await request(app).get('/api/posts').query(query)).status, 400);
  }
  assert.equal((await request(app).post('/api/posts/no-id/like')).status, 400);
  assert.equal((await request(app).post('/api/posts/2147483647/like')).status, 404);
});

test('a user-role session cannot access admin posts', async () => {
  const [id] = await db('users').insert({ username: 'posts-test-user', role: 'user', password_hash: 'unused' });
  try {
    const token = signSession({ userId: id, sessionVersion: 0 });
    assert.equal((await request(app).get('/api/admin/posts').set('Cookie', `session=${token}`)).status, 403);
  } finally { await db('users').where({ id }).delete(); }
});

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1sAAAAASUVORK5CYII=', 'base64');
const dataImage = `data:image/png;base64,${png.toString('base64')}`;

test('image upload requires authentication and current admin role before parsing bytes', async () => {
  assert.equal((await request(app).post('/api/admin/images').set('Content-Type', 'image/png').send(png)).status, 401);
  const [id] = await db('users').insert({ username: 'image-test-user', role: 'user', password_hash: 'unused' });
  try {
    const token = signSession({ userId: id, sessionVersion: 0 });
    assert.equal((await request(app).post('/api/admin/images').set('Cookie', `session=${token}`).set('Content-Type', 'image/png').send(png)).status, 403);
  } finally { await db('users').where({ id }).delete(); }
});

test('uploaded image persists on disk, database stores only URL, public images survive a new app instance', async () => {
  const agent = await loginAgent();
  const uploaded = await agent.post('/api/admin/images').set('Content-Type', 'image/png').send(png);
  assert.equal(uploaded.status, 201);
  const url = uploaded.body.url;
  assert.match(url, /^\/uploads\/blog\/[a-f0-9]{64}\.png$/);
  assert.deepEqual(await readFile(path.join(uploadDir, 'blog', path.basename(url))), png);
  const repeated = await agent.post('/api/admin/images').set('Content-Type', 'image/png').send(png);
  assert.equal(repeated.body.url, url);
  assert.equal((await readdir(path.join(uploadDir, 'blog'))).length, 1);
  const created = await agent.post('/api/admin/posts').send({ title: 'Disk image post', coverImage: url });
  assert.equal(created.status, 201);
  assert.equal((await db('blog_posts').where({ id: created.body.id }).first()).cover_image, url);
  assert.equal((await request(app).get(`/api/posts/${created.body.slug}`)).body.cover_image, url);
  const served = await request(createApp({ serveStatic: false })).get(url);
  assert.equal(served.status, 200);
  assert.match(served.headers['content-type'], /image\/png/);
  assert.equal(served.headers['x-content-type-options'], 'nosniff');
  assert.deepEqual(served.body, png);
  // Deleting a post must not remove an image reused by another post or pending editor.
  await agent.delete(`/api/admin/posts/${created.body.id}`).expect(200);
  await request(app).get(url).expect(200);
});

test('unsupported, spoofed, empty and oversized image uploads cannot write files', async () => {
  const agent = await loginAgent();
  const beforeFiles = await readdir(path.join(uploadDir, 'blog'));
  for (const [mime, data] of [['image/svg+xml', Buffer.from('<svg/>')], ['image/jpeg', png], ['image/png', Buffer.from('<script>alert(1)</script>')], ['image/png', Buffer.alloc(0)]] as const) {
    assert.equal((await agent.post('/api/admin/images').set('Content-Type', mime).send(data)).status, 400);
  }
  assert.equal((await agent.post('/api/admin/images').set('Content-Type', 'image/png').send(Buffer.alloc(MAX_IMAGE_BYTES + 1))).status, 413);
  assert.deepEqual(await readdir(path.join(uploadDir, 'blog')), beforeFiles);
});

test('new post writes reject embedded data images and unsafe URL schemes', async () => {
  const agent = await loginAgent();
  for (const coverImage of [dataImage, 'javascript:alert(1)', '/uploads/blog/../../.env', '/uploads/blog/arbitrary.html']) {
    assert.equal((await agent.post('/api/admin/posts').send({ title: 'Invalid image', coverImage })).status, 400);
  }
  const created = await agent.post('/api/admin/posts').send({ title: 'Remote image', coverImage: 'https://example.com/cover.jpg' });
  assert.equal(created.status, 201);
  assert.equal((await agent.put(`/api/admin/posts/${created.body.id}`).send({ coverImage: dataImage })).status, 400);
});

test('uploads cannot expose hidden files, traverse directories or fall through to the SPA', async () => {
  await writeFile(path.join(uploadDir, '.secret'), 'secret');
  const productionApp = createApp({ serveStatic: true, staticDir: uploadDir });
  for (const url of ['/uploads/.secret', '/uploads/blog', '/uploads/blog/..%2F.secret', `/uploads/blog/${'0'.repeat(64)}.png`, '/uploads/blog/arbitrary.svg']) {
    const response = await request(productionApp).get(url);
    assert.equal(response.status, 404);
    assert.match(response.headers['content-type'], /json/);
    assert.ok(!JSON.stringify(response.body).includes('secret'));
  }
});

test('legacy image migration preserves post metadata, leaves remote images and is idempotent', async () => {
  const [id] = await db('blog_posts').insert({ slug: 'legacy-image-test', title: 'Legacy image', cover_image: dataImage, likes: 12, views: 23, published: false, created_at: '2026-09-01 12:00:00', updated_at: '2026-09-02 12:00:00' });
  const old = await db('blog_posts').where({ id }).first();
  const [remoteId] = await db('blog_posts').insert({ slug: 'remote-migration-test', title: 'Remote cover', cover_image: 'https://example.com/cover.png' });
  const remoteBefore = await db('blog_posts').where({ id: remoteId }).first();
  assert.deepEqual(await migrateBlogImages(db), { migrated: 1, skipped: 0 });
  const migrated = await db('blog_posts').where({ id }).first();
  assert.match(migrated.cover_image, /^\/uploads\/blog\//);
  assert.deepEqual({ ...migrated, cover_image: old.cover_image }, old);
  assert.deepEqual(await db('blog_posts').where({ id: remoteBefore.id }).first(), remoteBefore);
  assert.deepEqual(await migrateBlogImages(db), { migrated: 0, skipped: 0 });
  assert.deepEqual((await request(app).get(migrated.cover_image)).body, png);
});

test('migration file-write failure preserves the original data image and supports a later retry', async () => {
  const [id] = await db('blog_posts').insert({ slug: 'failed-image-test', title: 'Migration retry', cover_image: dataImage });
  const blocked = path.join(uploadDir, 'blocked');
  await writeFile(blocked, 'not a directory');
  process.env.UPLOADS_DIR = blocked;
  try { await assert.rejects(migrateBlogImages(db)); }
  finally { process.env.UPLOADS_DIR = uploadDir; }
  assert.equal((await db('blog_posts').where({ id }).first()).cover_image, dataImage);
  assert.deepEqual(await migrateBlogImages(db), { migrated: 1, skipped: 0 });
});
