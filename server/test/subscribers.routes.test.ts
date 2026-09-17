import 'dotenv/config';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';

import { db } from '../db/knex.js';
import { signSession } from '../utils/jwt.js';

const app = createApp();
before(async () => { await db('subscribers').delete(); });
after(async () => { await db('subscribers').delete(); await db.destroy(); });

test('POST /api/subscribe rejects missing consent', async () => {
  const response = await request(app)
    .post('/api/subscribe')
    .send({ name: 'Test Kullanıcı', email: 'consent-missing@example.com' });
  assert.equal(response.status, 400);
});

test('POST /api/subscribe rejects an invalid email', async () => {
  const response = await request(app)
    .post('/api/subscribe')
    .send({ name: 'Test Kullanıcı', email: 'not-an-email', consent: true });
  assert.equal(response.status, 400);
});

test('POST /api/subscribe stores a valid subscriber and rejects a duplicate', async () => {
  const payload = { name: 'Test Kullanıcı', email: 'unique-subscriber@example.com', consent: true };

  const first = await request(app).post('/api/subscribe').send(payload);
  assert.equal(first.status, 201);

  const duplicate = await request(app).post('/api/subscribe').send(payload);
  assert.equal(duplicate.status, 409);
});

test('POST /api/subscribe silently no-ops when the honeypot field is filled', async () => {
  const response = await request(app).post('/api/subscribe').send({
    name: 'Bot',
    email: 'bot-honeypot@example.com',
    consent: true,
    honeypot: 'filled-in-by-a-bot',
  });
  assert.equal(response.status, 201);

  const dupCheck = await request(app).post('/api/subscribe').send({
    name: 'Bot',
    email: 'bot-honeypot@example.com',
    consent: true,
  });
  assert.equal(dupCheck.status, 201, 'the honeypot request should not have actually created a row');
});

test('GET /api/admin/subscribers requires authentication', async () => {
  const response = await request(app).get('/api/admin/subscribers');
  assert.equal(response.status, 401);
});


test('admin listing exposes persisted consent, normalized email, and trimmed name', async () => {
  const response = await request(app).post('/api/subscribe').send({ name: ' Test Person ', email: 'Case@Example.com', consent: true });
  assert.equal(response.status, 201);
  assert.equal(response.body.email, 'case@example.com');
  const agent = request.agent(app);
  assert.equal((await agent.post('/api/auth/login').send({ username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD })).status, 200);
  const list = await agent.get('/api/admin/subscribers');
  assert.equal(list.status, 200);
  const row = list.body.find((item: { id: number }) => item.id === response.body.id);
  assert.equal(row.name, 'Test Person');
  assert.equal(row.consent_given, true);
  assert.ok(row.consent_at);
  assert.equal(row.unsubscribed_at, null);
});

test('subscribers rejects whitespace names and false consent', async () => {
  for (const payload of [
    { name: '   ', email: 'white@example.com', consent: true },
    { name: 'Test', email: 'false@example.com', consent: false },
  ]) assert.equal((await request(app).post('/api/subscribe').send(payload)).status, 400);
});

test('user-role sessions cannot list subscribers', async () => {
  const [id] = await db('users').insert({ username: 'subscribers-test-user', role: 'user', password_hash: 'unused' });
  try {
    const token = signSession({ userId: id, username: 'subscribers-test-user', role: 'user' });
    assert.equal((await request(app).get('/api/admin/subscribers').set('Cookie', `session=${token}`)).status, 403);
  } finally { await db('users').where({ id }).delete(); }
});

test('concurrent duplicate signups yield one success and one conflict', async () => {
  const payload = { name: 'Concurrent', email: 'concurrent@example.com', consent: true };
  const responses = await Promise.all([request(app).post('/api/subscribe').send(payload), request(app).post('/api/subscribe').send(payload)]);
  assert.deepEqual(responses.map(response => response.status).sort(), [201, 409]);
});
