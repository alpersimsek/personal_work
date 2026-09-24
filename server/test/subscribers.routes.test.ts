import 'dotenv/config';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';

import { db } from '../db/knex.js';
import { signSession } from '../utils/jwt.js';
import { CURRENT_CONSENT_VERSION } from '../config/consent.js';
import { subscribeRateLimit } from '../middleware/rateLimit.js';

const app = createApp();
const consentVersion = CURRENT_CONSENT_VERSION;
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
    .send({ name: 'Test Kullanıcı', email: 'not-an-email', consent: true, consentVersion });
  assert.equal(response.status, 400);
});

test('POST /api/subscribe stores a valid subscriber and rejects a duplicate', async () => {
  const payload = { name: 'Test Kullanıcı', email: 'unique-subscriber@example.com', consent: true, consentVersion };

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
    consentVersion,
    honeypot: 'filled-in-by-a-bot',
  });
  assert.equal(response.status, 201);

  const dupCheck = await request(app).post('/api/subscribe').send({
    name: 'Bot',
    email: 'bot-honeypot@example.com',
    consent: true,
    consentVersion,
  });
  assert.equal(dupCheck.status, 201, 'the honeypot request should not have actually created a row');
});

test('GET /api/admin/subscribers requires authentication', async () => {
  const response = await request(app).get('/api/admin/subscribers');
  assert.equal(response.status, 401);
});


test('admin listing exposes persisted consent, normalized email, and trimmed name', async () => {
  const response = await request(app).post('/api/subscribe').send({ name: ' Test Person ', email: 'Case@Example.com', consent: true, consentVersion });
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
  assert.equal(row.consent_version, CURRENT_CONSENT_VERSION);
  assert.equal(row.unsubscribed_at, null);
});

test('subscribers rejects whitespace names and false consent', async () => {
  for (const payload of [
    { name: '   ', email: 'white@example.com', consent: true, consentVersion },
    { name: 'Test', email: 'false@example.com', consent: false, consentVersion },
  ]) assert.equal((await request(app).post('/api/subscribe').send(payload)).status, 400);
});

test('user-role sessions cannot list subscribers', async () => {
  const [id] = await db('users').insert({ username: 'subscribers-test-user', role: 'user', password_hash: 'unused' });
  try {
    const token = signSession({ userId: id, sessionVersion: 0 });
    assert.equal((await request(app).get('/api/admin/subscribers').set('Cookie', `session=${token}`)).status, 403);
  } finally { await db('users').where({ id }).delete(); }
});

test('concurrent duplicate signups yield one success and one conflict', async () => {
  const payload = { name: 'Concurrent', email: 'concurrent@example.com', consent: true, consentVersion };
  const responses = await Promise.all([request(app).post('/api/subscribe').send(payload), request(app).post('/api/subscribe').send(payload)]);
  assert.deepEqual(responses.map(response => response.status).sort(), [201, 409]);
});

test('POST /api/subscribe rejects a missing, blank or outdated consent version', async () => {
  const base = { name: 'Test', email: 'version@example.com', consent: true };
  for (const extra of [{}, { consentVersion: '' }, { consentVersion: '1999-01-01' }]) {
    const response = await request(app).post('/api/subscribe').send({ ...base, ...extra });
    assert.equal(response.status, 400, JSON.stringify(extra));
  }
  assert.equal(await db('subscribers').where({ email: base.email }).first(), undefined);
});

test('the consent version on the server matches the wording on the site', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../../src/legal/kvkk.ts', import.meta.url), 'utf8');
  const siteVersion = source.match(/export const KVKK_VERSION = '([^']+)'/)?.[1];
  assert.equal(siteVersion, CURRENT_CONSENT_VERSION);
});

/** Sign-up is limited per address; these tests sign up more often than a person would. */
function resetSubscribeLimit() {
  for (const address of ['::ffff:127.0.0.1', '::1', '127.0.0.1']) subscribeRateLimit.resetKey(address);
}

async function subscribeAs(email: string, name = 'Test Kişi') {
  resetSubscribeLimit();
  return request(app).post('/api/subscribe').send({ name, email, consent: true, consentVersion });
}

test('POST /api/subscribe/unsubscribe marks the subscriber as unsubscribed', async () => {
  const email = 'leaving@example.com';
  assert.equal((await subscribeAs(email)).status, 201);

  const response = await request(app).post('/api/subscribe/unsubscribe').send({ email });
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { success: true });

  const row = await db('subscribers').where({ email }).first();
  assert.ok(row.unsubscribed_at);
});

test('unsubscribing normalizes the e-mail address and is safe to repeat', async () => {
  const email = 'repeat@example.com';
  await subscribeAs(email);

  assert.equal((await request(app).post('/api/subscribe/unsubscribe').send({ email: '  Repeat@Example.COM ' })).status, 200);
  const first = (await db('subscribers').where({ email }).first()).unsubscribed_at;
  assert.ok(first);

  assert.equal((await request(app).post('/api/subscribe/unsubscribe').send({ email })).status, 200);
  const second = (await db('subscribers').where({ email }).first()).unsubscribed_at;
  assert.equal(String(second), String(first), 'the original opt-out time must not be overwritten');
});

test('unsubscribing an unknown address looks the same as a known one', async () => {
  const unknown = await request(app).post('/api/subscribe/unsubscribe').send({ email: 'nobody-here@example.com' });
  assert.equal(unknown.status, 200);
  assert.deepEqual(unknown.body, { success: true });
});

test('unsubscribing rejects a missing or malformed e-mail with a readable message', async () => {
  for (const body of [{}, { email: '' }, { email: 'not-an-email' }, { email: 42 }]) {
    const response = await request(app).post('/api/subscribe/unsubscribe').send(body);
    assert.equal(response.status, 400, JSON.stringify(body));
    assert.match(response.body.error, /e-posta/i);
  }
});

test('someone who unsubscribed can sign up again with fresh consent', async () => {
  const email = 'comeback@example.com';
  await subscribeAs(email, 'Eski Ad');
  await request(app).post('/api/subscribe/unsubscribe').send({ email });
  await db('subscribers').where({ email }).update({ consent_version: 'old-version' });

  const again = await subscribeAs(email, 'Yeni Ad');
  assert.equal(again.status, 201);

  const row = await db('subscribers').where({ email }).first();
  assert.equal(row.unsubscribed_at, null);
  assert.equal(row.name, 'Yeni Ad');
  assert.equal(row.consent_version, CURRENT_CONSENT_VERSION);
  assert.equal((await subscribeAs(email)).status, 409, 'an active subscriber is still a duplicate');
});

test('a duplicate sign-up explains itself in plain language', async () => {
  const email = 'plain@example.com';
  await subscribeAs(email);
  const duplicate = await subscribeAs(email);
  assert.equal(duplicate.status, 409);
  assert.match(duplicate.body.error, /zaten/);
});
