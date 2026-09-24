import 'dotenv/config';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';
import { db } from '../db/knex.js';
import { hashPassword } from '../utils/password.js';

// Kept apart from auth.routes.test.ts: the login rate limit is per process, and
// these tests sign in several times. They use their own admin account because
// they revoke sessions, and test files run in parallel against one database:
// revoking the seeded admin's sessions would sign out other files' logins.
const app = createApp();
const username = 'session-test-admin';
const password = 'a-long-test-only-passphrase';

before(async () => {
  await db('users').where({ username }).delete();
  await db('users').insert({ username, role: 'admin', password_hash: await hashPassword(password) });
});

after(async () => {
  await db('users').where({ username }).delete();
  await db.destroy();
});

/** Logs in and returns the raw `name=value` session cookie. */
async function loginCookie(): Promise<string> {
  const response = await request(app).post('/api/auth/login').send({ username, password });
  assert.equal(response.status, 200);
  return response.headers['set-cookie'][0].split(';')[0];
}

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

test('logout revokes the token itself, so a copied cookie stops working', async () => {
  const cookie = await loginCookie();
  assert.equal((await request(app).get('/api/auth/me').set('Cookie', cookie)).status, 200);
  assert.equal((await request(app).post('/api/auth/logout').set('Cookie', cookie)).status, 200);
  assert.equal((await request(app).get('/api/auth/me').set('Cookie', cookie)).status, 401);
});

test('logout without a valid session still succeeds and clears the cookie', async () => {
  for (const cookie of [undefined, 'session=garbage']) {
    const req = request(app).post('/api/auth/logout');
    const response = await (cookie ? req.set('Cookie', cookie) : req);
    assert.equal(response.status, 200);
    assert.match(response.headers['set-cookie'][0], /session=;/);
  }
});

test('bumping the session version signs out every existing token', async () => {
  const cookie = await loginCookie();
  await db('users').where({ username }).increment('session_version', 1);
  assert.equal((await request(app).get('/api/auth/me').set('Cookie', cookie)).status, 401);
  assert.equal((await request(app).get('/api/admin/posts').set('Cookie', cookie)).status, 401);
});

test('a new login after logout works and gets a token for the new session version', async () => {
  const first = await loginCookie();
  await request(app).post('/api/auth/logout').set('Cookie', first);
  const second = await loginCookie();
  assert.equal((await request(app).get('/api/auth/me').set('Cookie', second)).status, 200);
  assert.equal((await request(app).get('/api/auth/me').set('Cookie', first)).status, 401);
});

test('session responses are never cached', async () => {
  const cookie = await loginCookie();
  const me = await request(app).get('/api/auth/me').set('Cookie', cookie);
  assert.equal(me.headers['cache-control'], 'no-store');
  assert.equal((await request(app).get('/api/auth/me')).headers['cache-control'], 'no-store');
});

test('production uses the __Host- cookie name and ignores a plain session cookie', async () => {
  const cookie = await loginCookie();
  const token = cookie.split('=')[1];
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const login = await request(app).post('/api/auth/login').send({ username, password });
    const hostCookie = login.headers['set-cookie'][0];
    assert.match(hostCookie, /^__Host-session=/);
    assert.match(hostCookie, /Path=\//);
    assert.doesNotMatch(hostCookie, /Domain=/);

    assert.equal((await request(app).get('/api/auth/me').set('Cookie', hostCookie.split(';')[0])).status, 200);
    assert.equal((await request(app).get('/api/auth/me').set('Cookie', `session=${token}`)).status, 401);
  } finally {
    process.env.NODE_ENV = previous;
  }
});
