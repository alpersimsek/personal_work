import 'dotenv/config';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';
import { db } from '../db/knex.js';
import { signSession } from '../utils/jwt.js';
import { CURRENT_CONSENT_VERSION } from '../config/consent.js';

const app = createApp();
const emails = [`audit-active-${process.pid}@example.test`, `audit-inactive-${process.pid}@example.test`];
before(async () => {
  await db('subscribers').insert(emails.map((email, index) => ({
    name: 'Synthetic Audit Subscriber', email, consent_given: true,
    consent_version: CURRENT_CONSENT_VERSION, consent_at: '2026-01-01 00:00:00',
    unsubscribed_at: index ? '2026-02-01 00:00:00' : null,
  })));
});
after(async () => {
  await db('subscribers').whereIn('email', emails).delete();
  await db.destroy();
});

test('anonymous clients cannot create consent, unsubscribe others, or undo an opt-out', async () => {
  const before = await db('subscribers').whereIn('email', emails).orderBy('email');
  const fresh = `audit-new-${process.pid}@example.test`;
  let rejection;
  for (const email of [...emails, fresh]) {
    for (const route of ['/api/subscribe', '/api/subscribe/unsubscribe']) {
      const response = await request(app).post(route).send({
        name: 'Untrusted replacement', email, consent: true, consentVersion: CURRENT_CONSENT_VERSION,
      });
      assert.equal(response.status, 403);
      assert.equal(response.headers['cache-control'], 'no-store');
      assert.equal(response.body.success, undefined);
      rejection ??= response.body;
      assert.deepEqual(response.body, rejection, 'membership must not be disclosed');
    }
  }
  assert.deepEqual(await db('subscribers').whereIn('email', emails).orderBy('email'), before);
  assert.equal(await db('subscribers').where({ email: fresh }).first(), undefined);
});

test('trusted frontend origin cannot bypass mailbox ownership containment', async () => {
  for (const route of ['/api/subscribe', '/api/subscribe/unsubscribe']) {
    const response = await request(app).post(route).set('Origin', process.env.ALLOWED_ORIGIN || 'http://localhost:3000')
      .send({ email: emails[0], consent: true, consentVersion: CURRENT_CONSENT_VERSION });
    assert.equal(response.status, 403);
  }
});

test('subscriber listing requires a current administrator session', async () => {
  assert.equal((await request(app).get('/api/admin/subscribers')).status, 401);
  const [id] = await db('users').insert({ username: `newsletter-user-${process.pid}`, role: 'user', password_hash: 'unused' });
  try {
    const token = signSession({ userId: id, sessionVersion: 0 });
    assert.equal((await request(app).get('/api/admin/subscribers').set('Cookie', `session=${token}`)).status, 403);
  } finally { await db('users').where({ id }).delete(); }
});

test('administrators retain access to existing consent and opt-out records', async () => {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD }).expect(200);
  const response = await agent.get('/api/admin/subscribers').expect(200);
  assert.equal(response.headers['cache-control'], 'no-store');
  for (const email of emails) {
    const row = response.body.find((item: { email: string }) => item.email === email);
    assert.ok(row);
    assert.equal(row.consent_given, true);
    assert.equal(row.consent_version, CURRENT_CONSENT_VERSION);
    assert.equal(Boolean(row.unsubscribed_at), email === emails[1]);
  }
});

test('server and frontend display the same availability notice', async () => {
  const { NEWSLETTER_UNAVAILABLE } = await import('../../src/newsletterAvailability.js');
  assert.equal((await request(app).post('/api/subscribe').send({})).body.error, NEWSLETTER_UNAVAILABLE);
});
