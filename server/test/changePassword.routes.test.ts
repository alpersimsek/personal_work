import 'dotenv/config';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';
import { db } from '../db/knex.js';
import { hashPassword } from '../utils/password.js';
import { changePasswordRateLimit } from '../middleware/rateLimit.js';

// Own account and its own process (the login limiter is per process): changing a
// password signs the account out everywhere, which must not touch the seeded admin.
const app = createApp();
const username = 'password-test-admin';
const password = 'Yagmur-Sonrasi-Toprak-71';
const newPassword = 'Sabah-Sisi-Ustunde-Kus-38';

before(async () => {
  await db('users').where({ username }).delete();
  await db('users').insert({ username, role: 'admin', password_hash: await hashPassword(password) });
});

after(async () => {
  await db('users').where({ username }).delete();
  await db.destroy();
});

async function loginCookie(plain = password): Promise<string> {
  const response = await request(app).post('/api/auth/login').send({ username, password: plain });
  assert.equal(response.status, 200);
  return response.headers['set-cookie'][0].split(';')[0];
}

const change = (cookie: string | undefined, body: object) => {
  // The limiter is per address; these tests try more times than a person would.
  for (const address of ['::ffff:127.0.0.1', '::1', '127.0.0.1']) changePasswordRateLimit.resetKey(address);
  const req = request(app).post('/api/auth/change-password');
  return (cookie ? req.set('Cookie', cookie) : req).send(body);
};

test('changing the password requires a signed-in user', async () => {
  const response = await change(undefined, { currentPassword: password, newPassword, confirmPassword: newPassword });
  assert.equal(response.status, 401);
});

test('a wrong current password is refused and nothing changes', async () => {
  const cookie = await loginCookie();
  const response = await change(cookie, { currentPassword: 'not-the-password-1', newPassword, confirmPassword: newPassword });
  assert.equal(response.status, 400);
  assert.match(response.body.error, /mevcut şifre/i);
  assert.equal((await request(app).get('/api/auth/me').set('Cookie', cookie)).status, 200, 'the session must survive');
  await loginCookie(password);
});

test('the confirmation must match the new password', async () => {
  const cookie = await loginCookie();
  const response = await change(cookie, { currentPassword: password, newPassword, confirmPassword: `${newPassword}x` });
  assert.equal(response.status, 400);
  assert.match(response.body.error, /eşleşm/i);
});

test('a weak, short or reused new password is refused with the reason', async () => {
  const cookie = await loginCookie();
  const cases: Array<[string, RegExp]> = [
    ['Ab1!', /en az 12/],
    ['onlylettersandnothingelse', /rakam veya sembol/],
    ['UlkuTe2391!', /açığa çıktı/],
    [password, /farklı/],
    [`${username}-Sifre-2026`, /kullanıcı adı/],
    ['A1'.repeat(40), /en fazla/],
  ];
  for (const [candidate, expected] of cases) {
    const response = await change(cookie, { currentPassword: password, newPassword: candidate, confirmPassword: candidate });
    assert.equal(response.status, 400, candidate);
    assert.match(response.body.error, expected, candidate);
  }
});

test('missing fields are refused with a readable message', async () => {
  const cookie = await loginCookie();
  for (const body of [{}, { currentPassword: password }, { currentPassword: password, newPassword }]) {
    const response = await change(cookie, body);
    assert.equal(response.status, 400, JSON.stringify(body));
    assert.equal(typeof response.body.error, 'string');
  }
});

test('changing the password signs out every other session but keeps this one signed in', async () => {
  const oldCookie = await loginCookie();
  const otherDevice = await loginCookie();

  const response = await change(oldCookie, { currentPassword: password, newPassword, confirmPassword: newPassword });
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { success: true });
  assert.equal(response.headers['cache-control'], 'no-store');

  const freshCookie = response.headers['set-cookie'][0].split(';')[0];
  assert.match(response.headers['set-cookie'][0], /HttpOnly/);
  assert.equal((await request(app).get('/api/auth/me').set('Cookie', freshCookie)).status, 200, 'this device stays signed in');
  assert.equal((await request(app).get('/api/auth/me').set('Cookie', oldCookie)).status, 401, 'the old token is dead');
  assert.equal((await request(app).get('/api/auth/me').set('Cookie', otherDevice)).status, 401, 'other devices are signed out');
});

test('after a change only the new password works', async () => {
  const oldLogin = await request(app).post('/api/auth/login').send({ username, password });
  assert.equal(oldLogin.status, 401);
  const newLogin = await request(app).post('/api/auth/login').send({ username, password: newPassword });
  assert.equal(newLogin.status, 200);
});
