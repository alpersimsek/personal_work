import 'dotenv/config';
import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';

import { db } from '../db/knex.js';
import { signSession } from '../utils/jwt.js';

const app = createApp();
before(async () => { await db('blog_posts').delete(); });
after(async () => { await db('blog_posts').delete(); await db.destroy(); });
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
    const token = signSession({ userId: id, username: 'posts-test-user', role: 'user' });
    assert.equal((await request(app).get('/api/admin/posts').set('Cookie', `session=${token}`)).status, 403);
  } finally { await db('users').where({ id }).delete(); }
});
