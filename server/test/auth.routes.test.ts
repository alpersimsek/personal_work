import 'dotenv/config';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';
import { db } from '../db/knex.js';
import { signSession } from '../utils/jwt.js';

const app = createApp();
const username = (process.env.ADMIN_USERNAME ?? '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? '';

after(async () => { await db.destroy(); });

test('login normalizes the username and issues a private session cookie', async () => {
  const response = await request(app).post('/api/auth/login')
    .send({ username: ` ${username.toUpperCase()} `, password });
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { username, role: 'admin' });
  const cookie = response.headers['set-cookie']?.[0];
  assert.match(cookie, /session=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Path=\//);
  assert.match(cookie, /Max-Age=43200/);
});

test('login rejects wrong passwords and unknown users', async () => {
  for (const credentials of [
    { username, password: 'definitely-wrong' },
    { username: 'missing-user', password },
  ]) {
    const response = await request(app).post('/api/auth/login').send(credentials);
    assert.equal(response.status, 401);
    assert.equal(typeof response.body.error, 'string');
    assert.equal(response.headers['set-cookie'], undefined);
  }
});

test('login rejects missing fields and whitespace-only usernames', async () => {
  for (const body of [{}, { username: '   ', password }]) {
    const response = await request(app).post('/api/auth/login').send(body);
    assert.equal(response.status, 400);
  }
});

test('session check rejects missing and tampered cookies', async () => {
  assert.equal((await request(app).get('/api/auth/me')).status, 401);
  const response = await request(app).get('/api/auth/me').set('Cookie', 'session=invalid');
  assert.equal(response.status, 401);
});

test('session check rejects a token for a user that does not exist', async () => {
  const token = signSession({ userId: 2147483647, username: 'deleted-user', role: 'admin' });
  const response = await request(app).get('/api/auth/me').set('Cookie', `session=${token}`);
  assert.equal(response.status, 401);
});

test('login, session check, and logout work through a cookie jar', async () => {
  const agent = request.agent(app);
  assert.equal((await agent.post('/api/auth/login').send({ username, password })).status, 200);
  const me = await agent.get('/api/auth/me');
  assert.equal(me.status, 200);
  assert.deepEqual(me.body, { username, role: 'admin' });
  const logout = await agent.post('/api/auth/logout');
  assert.equal(logout.status, 200);
  assert.deepEqual(logout.body, { success: true });
  assert.match(logout.headers['set-cookie'][0], /session=;/);
  assert.equal((await agent.get('/api/auth/me')).status, 401);
});

test('production session cookies are Secure and logout uses matching attributes', async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const response = await request(app).post('/api/auth/login').send({ username, password });
    assert.equal(response.status, 200);
    assert.match(response.headers['set-cookie'][0], /Secure/);
    const logout = await request(app).post('/api/auth/logout');
    assert.match(logout.headers['set-cookie'][0], /Secure/);
    assert.match(logout.headers['set-cookie'][0], /SameSite=Lax/);
  } finally {
    process.env.NODE_ENV = previous;
  }
});

test('login rate limit rejects requests beyond the ten-request allowance', async () => {
  let response;
  for (let attempt = 0; attempt < 11; attempt++) {
    response = await request(app).post('/api/auth/login').send({});
    if (response.status === 429) break;
  }
  assert.equal(response?.status, 429);
  assert.equal(typeof response?.body.error, 'string');
  assert.ok(response?.headers['retry-after']);
});
