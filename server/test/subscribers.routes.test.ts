import 'dotenv/config';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';
import { db } from '../db/knex.js';
import { signSession } from '../utils/jwt.js';
import { CURRENT_CONSENT_VERSION } from '../config/consent.js';
import { assertNewsletterMailConfiguration, setNewsletterMailTransportForTests } from '../services/newsletterMail.js';
import { hashNewsletterToken } from '../services/newsletterTokens.js';

const app = createApp();
const prefix = `newsletter-${process.pid}`;
const email = `${prefix}@example.test`;
const mails: Array<{ to?: unknown; from?: unknown; text?: unknown; html?: unknown; attachments?: Array<{ cid?: string; contentType?: string }> }> = [];

before(async () => {
  process.env.PUBLIC_SITE_URL = 'http://localhost:3000';
  process.env.NEWSLETTER_FROM = 'Tuğba Şimşek Ergüner <newsletter@example.test>';
  setNewsletterMailTransportForTests({
    sendMail: async message => {
      mails.push(message);
      return { accepted: [message.to], rejected: [], envelopeTime: 0, messageTime: 0, messageSize: 0,
        response: 'test', envelope: { from: '', to: [] }, messageId: 'test' };
    },
  });
  await db('newsletter_verification_tokens').where('email', 'like', `${prefix}%`).delete();
  await db('subscribers').where('email', 'like', `${prefix}%`).delete();
});

after(async () => {
  setNewsletterMailTransportForTests(undefined);
  await db('newsletter_verification_tokens').where('email', 'like', `${prefix}%`).delete();
  await db('subscribers').where('email', 'like', `${prefix}%`).delete();
  await db.destroy();
});

function signupPayload(address = email) {
  return { name: ' Test Kişi ', email: address, consent: true, consentVersion: CURRENT_CONSENT_VERSION };
}

function tokenFromLastMail(): string {
  const text = String(mails.at(-1)?.text ?? '');
  const token = text.match(/[?&]token=([A-Za-z0-9_-]{43})/)?.[1];
  assert.ok(token, 'mail should contain an opaque token');
  return token;
}

test('Gmail configuration accepts only a server-side Google App Password', () => {
  const original = {
    user: process.env.NEWSLETTER_SMTP_USER,
    password: process.env.NEWSLETTER_SMTP_APP_PASSWORD,
    from: process.env.NEWSLETTER_FROM,
  };
  try {
    process.env.NEWSLETTER_SMTP_USER = 'newsletter@example.test';
    process.env.NEWSLETTER_FROM = 'Newsletter Test <newsletter@example.test>';
    process.env.NEWSLETTER_SMTP_APP_PASSWORD = 'abcd efgh ijkl mnop';
    assert.doesNotThrow(assertNewsletterMailConfiguration);
    process.env.NEWSLETTER_SMTP_APP_PASSWORD = 'ordinary-account-password';
    assert.throws(assertNewsletterMailConfiguration, /Google App Password/);
    process.env.NEWSLETTER_FROM = 'Newsletter Test\r\nBcc: attacker@example.test';
    assert.throws(assertNewsletterMailConfiguration, /sender addresses/);
  } finally {
    if (original.user === undefined) delete process.env.NEWSLETTER_SMTP_USER;
    else process.env.NEWSLETTER_SMTP_USER = original.user;
    if (original.password === undefined) delete process.env.NEWSLETTER_SMTP_APP_PASSWORD;
    else process.env.NEWSLETTER_SMTP_APP_PASSWORD = original.password;
    if (original.from === undefined) delete process.env.NEWSLETTER_FROM;
    else process.env.NEWSLETTER_FROM = original.from;
  }
});

test('signup sends a confirmation but stores no subscriber before an explicit POST', async () => {
  const response = await request(app).post('/api/subscribe').send(signupPayload());
  assert.equal(response.status, 202);
  assert.deepEqual(response.body.success, true);
  assert.equal(await db('subscribers').where({ email }).first(), undefined);
  assert.equal(mails.at(-1)?.to, email);
  assert.equal(mails.at(-1)?.from, 'Tuğba Şimşek Ergüner <newsletter@example.test>');

  const html = String(mails.at(-1)?.html ?? '');
  assert.match(html, /<table role="presentation"/);
  assert.match(html, /Yeni yazılar için e-posta adresinizi doğrulayın/);
  assert.match(html, /background-color:#704a39/);
  assert.match(html, /href="http:\/\/localhost:3000\/api\/subscribe\/confirm\?token=/);
  assert.match(html, /doğrulama bağlantısını buradan açın/);
  assert.doesNotMatch(html, /<a[^>]*>[^<]*\?token=/);
  assert.match(html, /<img src="cid:newsletter-brand-mark"/);
  assert.doesNotMatch(html, /<link\b|@import|https?:\/\/(?!localhost:3000)/i);
  assert.deepEqual(mails.at(-1)?.attachments?.map(({ cid, contentType }) => ({ cid, contentType })), [
    { cid: 'newsletter-brand-mark', contentType: 'image/png' },
  ]);
  assert.match(String(mails.at(-1)?.text ?? ''), /30 dakika geçerlidir/);

  const token = tokenFromLastMail();
  const row = await db('newsletter_verification_tokens').where({ email, purpose: 'confirm' }).first();
  assert.equal(row.token_hash, hashNewsletterToken(token));
  assert.notEqual(row.token_hash, token);
  assert.equal(row.token_hash.length, 64);

  const scannerGet = await request(app).get(`/api/subscribe/confirm?token=${token}`);
  assert.equal(scannerGet.status, 200);
  assert.match(scannerGet.text, /method="post"/);
  assert.match(scannerGet.text, /<svg viewBox="4 12 40 32">[\s\S]*M24 19 V15\.5/);
  assert.doesNotMatch(scannerGet.text, /class="mark"[^>]*>t</);
  assert.equal(scannerGet.headers['referrer-policy'], 'no-referrer');
  assert.equal(await db('subscribers').where({ email }).first(), undefined);

  const confirmed = await request(app).post('/api/subscribe/confirm').type('form').send({ token });
  assert.equal(confirmed.status, 200);
  const subscriber = await db('subscribers').where({ email }).first();
  assert.equal(subscriber.name, 'Test Kişi');
  assert.equal(subscriber.consent_version, CURRENT_CONSENT_VERSION);
  assert.ok(subscriber.email_verified_at);
  assert.equal(subscriber.unsubscribed_at, null);
});

test('mailbox token confirmation works when the email client posts from another origin', async () => {
  const address = `${prefix}-email-client@example.test`;
  await request(app).post('/api/subscribe').send(signupPayload(address)).expect(202);
  const token = tokenFromLastMail();
  const response = await request(app).post('/api/subscribe/confirm').type('form').send({ token })
    .set('Origin', 'https://mail.google.com')
    .set('Sec-Fetch-Site', 'cross-site');
  assert.equal(response.status, 200);
  assert.ok(await db('subscribers').where({ email: address }).first());
});

test('confirmation tokens are purpose-bound, single-use and reject malformed values', async () => {
  const token = tokenFromLastMail();
  assert.equal((await request(app).post('/api/subscribe/confirm').type('form').send({ token })).status, 400);
  assert.equal((await request(app).post('/api/subscribe/unsubscribe/confirm').type('form').send({ token })).status, 400);
  assert.equal((await request(app).post('/api/subscribe/confirm').type('form').send({ token: '<script>' })).status, 400);
});

test('a pending request is not resent during the per-address cooldown', async () => {
  const cooldownEmail = `${prefix}-cooldown@example.test`;
  const before = mails.length;
  await request(app).post('/api/subscribe').send(signupPayload(cooldownEmail)).expect(202);
  await request(app).post('/api/subscribe').send(signupPayload(cooldownEmail)).expect(202);
  assert.equal(mails.length, before + 1);
  assert.equal(await db('newsletter_verification_tokens').where({ email: cooldownEmail }).count({ count: '*' }).first().then(row => Number(row?.count)), 1);
});

test('unsubscribe sends a link and only the explicit confirmation changes the row', async () => {
  const before = await db('subscribers').where({ email }).first();
  const response = await request(app).post('/api/subscribe/unsubscribe').send({ email });
  assert.equal(response.status, 202);
  assert.equal((await db('subscribers').where({ email }).first()).unsubscribed_at, null);
  const token = tokenFromLastMail();
  assert.equal((await request(app).get(`/api/subscribe/unsubscribe/confirm?token=${token}`)).status, 200);
  assert.equal((await db('subscribers').where({ email }).first()).unsubscribed_at, null);
  assert.equal((await request(app).post('/api/subscribe/unsubscribe/confirm').type('form').send({ token })).status, 200);
  const after = await db('subscribers').where({ email }).first();
  assert.ok(after.unsubscribed_at);
  assert.equal(String(after.email_verified_at), String(before.email_verified_at));
});

test('rejoining after opt-out requires a fresh mailbox confirmation', async () => {
  const response = await request(app).post('/api/subscribe').send(signupPayload());
  assert.equal(response.status, 202);
  assert.ok((await db('subscribers').where({ email }).first()).unsubscribed_at);
  const token = tokenFromLastMail();
  await request(app).post('/api/subscribe/confirm').type('form').send({ token }).expect(200);
  assert.equal((await db('subscribers').where({ email }).first()).unsubscribed_at, null);
});

test('concurrent token replay has exactly one successful effect', async () => {
  await request(app).post('/api/subscribe').send(signupPayload()).expect(202);
  const token = tokenFromLastMail();
  const responses = await Promise.all([
    request(app).post('/api/subscribe/confirm').type('form').send({ token }),
    request(app).post('/api/subscribe/confirm').type('form').send({ token }),
  ]);
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 400]);
});

test('known and unknown unsubscribe requests have the same public response', async () => {
  const unknown = `${prefix}-unknown@example.test`;
  const knownResponse = await request(app).post('/api/subscribe/unsubscribe').send({ email });
  const unknownResponse = await request(app).post('/api/subscribe/unsubscribe').send({ email: unknown });
  assert.equal(knownResponse.status, 202);
  assert.equal(unknownResponse.status, 202);
  assert.deepEqual(knownResponse.body, unknownResponse.body);
  const unknownToken = tokenFromLastMail();
  assert.equal((await request(app).post('/api/subscribe/unsubscribe/confirm').type('form').send({ token: unknownToken })).status, 200);
  assert.equal(await db('subscribers').where({ email: unknown }).first(), undefined);
});

test('SMTP failure returns a fixed error and invalidates the pending token', async () => {
  const failed = `${prefix}-smtp@example.test`;
  setNewsletterMailTransportForTests({ sendMail: async () => { throw new Error('synthetic secret SMTP detail'); } });
  const response = await request(app).post('/api/subscribe').send(signupPayload(failed));
  assert.equal(response.status, 503);
  assert.ok(!response.text.includes('synthetic'));
  const rows = await db('newsletter_verification_tokens').where({ email: failed });
  assert.equal(rows.length, 1);
  assert.ok(rows[0].consumed_at);
  setNewsletterMailTransportForTests({ sendMail: async message => {
    mails.push(message);
    return { accepted: [message.to], rejected: [], envelopeTime: 0, messageTime: 0, messageSize: 0,
      response: 'test', envelope: { from: '', to: [] }, messageId: 'test' };
  } });
});

test('validation, consent version and honeypot behavior remain enforced', async () => {
  assert.equal((await request(app).post('/api/subscribe').send({})).status, 400);
  assert.equal((await request(app).post('/api/subscribe').send({ ...signupPayload(), consentVersion: 'old' })).status, 400);
  const mailCount = mails.length;
  assert.equal((await request(app).post('/api/subscribe').send({ ...signupPayload(), honeypot: 'bot' })).status, 202);
  assert.equal(mails.length, mailCount);
  assert.equal((await request(app).post('/api/subscribe/unsubscribe').send({ email: 'bad' })).status, 400);
});

test('subscriber listing requires a current administrator and shows verification state', async () => {
  assert.equal((await request(app).get('/api/admin/subscribers')).status, 401);
  const [id] = await db('users').insert({ username: `${prefix}-user`, role: 'user', password_hash: 'unused' });
  try {
    const token = signSession({ userId: id, sessionVersion: 0 });
    assert.equal((await request(app).get('/api/admin/subscribers').set('Cookie', `session=${token}`)).status, 403);
  } finally { await db('users').where({ id }).delete(); }

  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD }).expect(200);
  const list = await agent.get('/api/admin/subscribers').expect(200);
  const subscriber = list.body.find((item: { email: string }) => item.email === email);
  assert.ok(subscriber.email_verified_at);
  assert.equal(list.headers['cache-control'], 'no-store');
});
