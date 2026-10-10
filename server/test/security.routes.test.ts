import 'dotenv/config';
import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../app.js';
import { db } from '../db/knex.js';
import { signSession } from '../utils/jwt.js';
import { errorHandler } from '../middleware/errorHandler.js';

const app = createApp();
let userId: number;
before(async () => {
  [userId] = await db('users').insert({ username: `security-${process.pid}`, role: 'admin', password_hash: 'unused' });
});
after(async () => { await db('users').where({ id: userId }).delete(); await db.destroy(); });

async function cookie() {
  const user = await db('users').where({ id: userId }).first();
  return `session=${signSession({ userId, sessionVersion: user.session_version })}`;
}

test('a same-site, cross-origin logout cannot revoke the victim session', async () => {
  const session = await cookie();
  const response = await request(app).post('/api/auth/logout')
    .set('Cookie', session).set('Origin', 'http://localhost:3999').set('Sec-Fetch-Site', 'same-site');
  assert.equal(response.status, 403);
  assert.equal((await request(app).get('/api/auth/me').set('Cookie', session)).status, 200);
});

test('all API writes reject untrusted, null and malformed origins before side effects', async () => {
  for (const origin of ['http://localhost:3999', 'null', 'not-an-origin']) {
    for (const route of ['/api/auth/login', '/api/admin/posts', '/api/admin/images', '/api/subscribe', '/api/subscribe/unsubscribe']) {
      const response = await request(app).post(route).set('Origin', origin).send({});
      assert.equal(response.status, 403, route);
    }
  }
  const response = await request(app).post('/api/auth/logout')
    .set('Origin', 'http://localhost:3999').set('X-Forwarded-Host', 'localhost:3999');
  assert.equal(response.status, 403);
});

test('missing Origin cannot bypass cross-site Fetch Metadata or Referer checks', async () => {
  for (const site of ['same-site', 'cross-site']) {
    assert.equal((await request(app).post('/api/auth/logout').set('Sec-Fetch-Site', site)).status, 403);
  }
  assert.equal((await request(app).post('/api/auth/logout').set('Referer', 'http://localhost:3999/form')).status, 403);
});

test('trusted frontend requests and non-browser clients can still log out', async () => {
  assert.equal((await request(app).post('/api/auth/logout').set('Origin', process.env.ALLOWED_ORIGIN || 'http://localhost:3000')).status, 200);
  assert.equal((await request(app).post('/api/auth/logout')).status, 200);
});

test('logout reports database revocation failures and does not claim success', async t => {
  const session = await cookie();
  const original = db.client.query;
  t.mock.method(console, 'error', () => {});
  const mocked = t.mock.method(db.client, 'query', function (connection, query) {
    if (/^update `users`/i.test(query.sql)) throw new Error('Synthetic revocation failure');
    return original.call(db.client, connection, query);
  });
  const response = await request(app).post('/api/auth/logout').set('Cookie', session);
  mocked.mock.restore();
  assert.equal(response.status, 500);
  assert.equal(response.headers['set-cookie'], undefined, 'keep the cookie so logout can be retried');
  assert.equal((await request(app).get('/api/auth/me').set('Cookie', session)).status, 200);
});

test('error logs omit messages, SQL, bindings, stack traces and request secrets', async t => {
  const logged: unknown[][] = [];
  t.mock.method(console, 'error', (...args: unknown[]) => { logged.push(args); });
  const diagnostic = express();
  const privateMarker = 'synthetic-sensitive-value';
  diagnostic.get('/', () => { throw Object.assign(new Error(privateMarker), {
    code: 'ER_DUP_ENTRY', sql: privateMarker, bindings: [privateMarker],
  }); });
  diagnostic.use(errorHandler);
  const response = await request(diagnostic).get('/').set('Cookie', `session=${privateMarker}`);
  assert.equal(response.status, 500);
  assert.equal(logged.length, 1);
  assert.ok(!JSON.stringify(logged).includes(privateMarker), 'sensitive diagnostic fields must not reach logs');
  assert.ok(!response.text.includes(privateMarker));
});

test('private admin responses and failures forbid caching', async () => {
  const session = await cookie();
  for (const route of ['/api/admin/posts', '/api/admin/subscribers']) {
    assert.equal((await request(app).get(route).set('Cookie', session)).headers['cache-control'], 'no-store');
    assert.equal((await request(app).get(route)).headers['cache-control'], 'no-store');
  }
  assert.equal((await request(app).post('/api/admin/images')).headers['cache-control'], 'no-store');
});

test('unknown usernames still perform one password comparison', async t => {
  let comparisons = 0;
  t.mock.method(bcrypt, 'compare', async () => { comparisons++; return false; });
  const response = await request(app).post('/api/auth/login')
    .send({ username: `absent-audit-${process.pid}`, password: 'synthetic-wrong-password' });
  assert.equal(response.status, 401);
  assert.equal(comparisons, 1, 'unknown and known users must both incur the password hashing cost');
});
