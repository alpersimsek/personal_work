import 'dotenv/config';
import { test, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';
import { db } from '../db/knex.js';
import { signSession } from '../utils/jwt.js';

const app = createApp();
let agent: ReturnType<typeof request.agent>;
const base = '/api/admin/blog-backup';

before(async () => {
  await db('blog_posts').delete();
  agent = request.agent(app);
  const login = await agent.post('/api/auth/login').send({ username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD });
  assert.equal(login.status, 200);
});
after(async () => { await db('blog_posts').delete(); await db.destroy(); });

async function create(title: string, published = true) {
  const response = await agent.post('/api/admin/posts').send({ title, published, summary: 'Summary', content: 'Full content',
    tags: ['Farkındalık', 'backup'], coverImage: 'data:image/png;base64,aGVsbG8=', featured: true });
  assert.equal(response.status, 201);
  return response.body;
}

async function backup() {
  const response = await agent.get(base);
  assert.equal(response.status, 200);
  return response.body;
}

test('backup, preview and restore require authentication before parsing JSON', async () => {
  assert.equal((await request(app).get(base)).status, 401);
  for (const action of ['preview', 'restore']) {
    assert.equal((await request(app).post(`${base}/${action}`).set('Content-Type', 'application/json').send('not JSON')).status, 401);
  }
});

test('user-role sessions cannot back up, preview or restore', async () => {
  const [id] = await db('users').insert({ username: 'backup-test-user', role: 'user', password_hash: 'unused' });
  try {
    const token = signSession({ userId: id, username: 'backup-test-user', role: 'user' });
    const cookie = `session=${token}`;
    assert.equal((await request(app).get(base).set('Cookie', cookie)).status, 403);
    for (const action of ['preview', 'restore']) {
      assert.equal((await request(app).post(`${base}/${action}`).set('Cookie', cookie).send({})).status, 403);
    }
  } finally { await db('users').where({ id }).delete(); }
});

test('backup downloads all published and draft content with metadata, images, counters and dates', async () => {
  const published = await create('Published backup');
  const draft = await create('Draft backup', false);
  await db('blog_posts').where({ id: published.id }).update({ likes: 7, views: 12 });
  const response = await agent.get(base);
  assert.match(response.headers['content-disposition'], /attachment;.*\.json/);
  assert.equal(response.headers['cache-control'], 'no-store');
  const data = response.body;
  assert.equal(data.format, 'tugba-blog-backup');
  assert.equal(data.version, 1);
  assert.equal(data.posts.length, 2);
  const post = data.posts.find((item: { slug: string }) => item.slug === published.slug);
  assert.equal(post.likes, 7); assert.equal(post.views, 12);
  assert.deepEqual(post.tags, ['Farkındalık', 'backup']);
  assert.equal(post.cover_image, published.cover_image);
  assert.equal(post.id, undefined);
  assert.ok(post.created_at.endsWith('Z'));
  assert.equal(data.posts.find((item: { slug: string }) => item.slug === draft.slug).published, false);
});

test('preview does not mutate and restore round trip preserves unrelated posts and stable existing IDs', async () => {
  const original = await backup();
  const matching = original.posts[0]; const removed = original.posts[1];
  const existing = await db('blog_posts').where({ slug: matching.slug }).first();
  await db('blog_posts').where({ slug: matching.slug }).update({ title: 'Changed', likes: 0, views: 0 });
  await db('blog_posts').where({ slug: removed.slug }).delete();
  const unrelated = await create('Unrelated post');
  const preview = await agent.post(`${base}/preview`).send(original);
  assert.equal(preview.status, 200);
  assert.deepEqual(preview.body, { total: 2, created: 1, updated: 1, published: 1, drafts: 1 });
  assert.equal((await db('blog_posts').where({ slug: matching.slug }).first()).title, 'Changed');
  const restored = await agent.post(`${base}/restore`).send(original);
  assert.equal(restored.status, 200);
  assert.deepEqual(restored.body, { total: 2, created: 1, updated: 1 });
  const result = await backup();
  assert.equal(result.posts.length, 3);
  for (const post of original.posts) assert.deepEqual(result.posts.find((item: { slug: string }) => item.slug === post.slug), post);
  assert.ok(result.posts.find((item: { slug: string }) => item.slug === unrelated.slug));
  assert.equal((await db('blog_posts').where({ slug: matching.slug }).first()).id, existing.id);
  assert.deepEqual((await agent.post(`${base}/restore`).send(original)).body, { total: 2, created: 0, updated: 2 });
});

test('invalid formats, fields, timestamps and duplicate slugs are rejected without writes', async () => {
  const valid = await backup();
  const original = valid.posts;
  for (const invalid of [
    {}, { ...valid, version: 2 }, { ...valid, posts: [{ ...original[0], title: '' }] },
    { ...valid, posts: [{ ...original[0], likes: -1 }] },
    { ...valid, posts: [{ ...original[0], created_at: 'invalid' }] },
    { ...valid, posts: [original[0], original[0]] },
    { ...valid, posts: [{ ...original[0], id: 1 }] },
  ]) {
    assert.equal((await agent.post(`${base}/preview`).send(invalid)).status, 400);
    assert.equal((await agent.post(`${base}/restore`).send(invalid)).status, 400);
  }
  assert.deepEqual((await backup()).posts, original);
});

test('legacy browser backups can be restored and retain slug, stats, dates and image', async () => {
  const createdAt = '2026-09-01T12:00:00.000Z';
  const legacy = [{ id: 'blog-legacy', slug: 'legacy-backup', title: 'Legacy import', summary: 'Old summary',
    content: '# Old content', category: 'Farkındalık', tags: ['legacy'], author: 'Coach', readTime: '3 dk okuma',
    coverImage: 'data:image/jpeg;base64,YQ==', published: false, featured: true, likes: 5, views: 9,
    createdAt, updatedAt: createdAt, date: '1 Eylül 2026' }];
  assert.equal((await agent.post(`${base}/restore`).send(legacy)).status, 200);
  const post = (await backup()).posts.find((item: { slug: string }) => item.slug === 'legacy-backup');
  assert.equal(post.created_at, createdAt); assert.equal(post.read_time, '3 dk okuma');
  assert.equal(post.cover_image, legacy[0].coverImage); assert.equal(post.likes, 5);
  assert.deepEqual(post.tags, ['legacy']); assert.equal(post.published, false);
});

test('empty backups leave all existing posts intact', async () => {
  const current = await backup();
  const response = await agent.post(`${base}/restore`).send({ ...current, posts: [] });
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { total: 0, created: 0, updated: 0 });
  assert.deepEqual((await backup()).posts, current.posts);
});

test('restore rolls back earlier updates if a later database insert fails', async () => {
  const valid = await backup();
  const post = { ...valid.posts[0], slug: 'aaa-rollback', title: 'Original rollback title' };
  assert.equal((await agent.post(`${base}/restore`).send({ ...valid, posts: [post] })).status, 200);
  await db.raw("CREATE TRIGGER backup_test_failure BEFORE INSERT ON blog_posts FOR EACH ROW BEGIN IF NEW.slug = 'zzz-failure' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Forced backup test failure'; END IF; END");
  const errorLog = mock.method(console, 'error', () => {});
  try {
    const response = await agent.post(`${base}/restore`).send({ ...valid, posts: [{ ...post, title: 'Must roll back' }, { ...post, slug: 'zzz-failure' }] });
    assert.equal(response.status, 500);
    assert.equal((await db('blog_posts').where({ slug: post.slug }).first()).title, post.title);
    assert.equal(await db('blog_posts').where({ slug: 'zzz-failure' }).first(), undefined);
  } finally { errorLog.mock.restore(); await db.raw('DROP TRIGGER backup_test_failure'); }
});

test('malformed JSON returns a JSON 400 instead of a server error', async () => {
  const response = await agent.post(`${base}/restore`).set('Content-Type', 'application/json').send('{');
  assert.equal(response.status, 400); assert.equal(typeof response.body.error, 'string');
});

test('backup parser accepts payloads above the usual 15 MB limit and rejects above 50 MB', async () => {
  const valid = await backup();
  const large = { ...valid, posts: [{ ...valid.posts[0], cover_image: 'x'.repeat(16 * 1024 * 1024) }] };
  assert.equal((await agent.post(`${base}/preview`).send(large)).status, 200);
  const tooLarge = await agent.post(`${base}/restore`).set('Content-Type', 'application/json').send(' '.repeat(50 * 1024 * 1024 + 1));
  assert.equal(tooLarge.status, 413); assert.equal(typeof tooLarge.body.error, 'string');
});
