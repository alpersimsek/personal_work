import 'dotenv/config';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';
import { db } from '../db/knex.js';
import { setNewsletterMailTransportForTests } from '../services/newsletterMail.js';

const app = createApp();
const prefix = `nadmin-${process.pid}`;
const adminUsername = (process.env.ADMIN_USERNAME ?? '').toLowerCase();
const mails: Array<{ to?: unknown }> = [];
const originalEnv = {
  PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL,
  NEWSLETTER_FROM: process.env.NEWSLETTER_FROM,
};
let originalAdminEmail: string | null | undefined;
let postId: number;
let counter = 0;
let subscriberId: number;
let interruptedSubscriberId: number;

function restoreEnv(name: keyof typeof originalEnv) {
  const value = originalEnv[name];
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

before(async () => {
  process.env.PUBLIC_SITE_URL = 'http://localhost:3000';
  process.env.NEWSLETTER_FROM = 'Test <newsletter@example.test>';
  setNewsletterMailTransportForTests({ sendMail: async m => { mails.push(m); return {} as never; } });
  // Remember the real value first so after() can put back exactly that.
  originalAdminEmail = (await db('users').where({ username: adminUsername }).first('email'))?.email;
  await db('users').where({ username: adminUsername }).update({ email: `${prefix}-admin@example.test` });
  [subscriberId] = await db('subscribers').insert({
    name: 'n', email: `${prefix}@example.test`, consent_given: true, consent_at: db.fn.now(),
  });
  [interruptedSubscriberId] = await db('subscribers').insert({
    name: 'n', email: `${prefix}-2@example.test`, consent_given: true, consent_at: db.fn.now(),
  });
});

after(async () => {
  setNewsletterMailTransportForTests(undefined);
  restoreEnv('PUBLIC_SITE_URL');
  restoreEnv('NEWSLETTER_FROM');
  try {
    if (originalAdminEmail !== undefined) {
      await db('users').where({ username: adminUsername }).update({ email: originalAdminEmail });
    }
    await db('blog_posts').where('slug', 'like', `${prefix}%`).delete();
    await db('subscribers').where('email', 'like', `${prefix}%`).delete();
  } finally {
    await db.destroy();
  }
});

// Each test gets its own post: other test files clear blog_posts in the shared
// database while this one runs, so a single long-lived post would vanish.
async function freshPost(): Promise<number> {
  [postId] = await db('blog_posts').insert({
    slug: `${prefix}-${counter++}`, title: 'Yazı', summary: 'Özet', published: true,
  });
  return postId;
}

async function adminAgent() {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({
    username: adminUsername, password: process.env.ADMIN_PASSWORD ?? '',
  });
  return agent;
}

test('newsletter endpoints reject anonymous requests', async () => {
  await freshPost();
  for (const [method, path] of [
    ['get', `/api/admin/posts/${postId}/newsletter`],
    ['post', `/api/admin/posts/${postId}/newsletter/cancel`],
    ['post', `/api/admin/posts/${postId}/newsletter/retry-failed`],
    ['post', `/api/admin/posts/${postId}/newsletter/test`],
  ] as const) {
    const response = await request(app)[method](path);
    assert.equal(response.status, 401, `${method} ${path}`);
  }
});

test('newsletter POST endpoints reject cross-origin requests before side effects', async () => {
  await freshPost();
  const agent = await adminAgent();
  mails.length = 0;
  for (const action of ['cancel', 'retry-failed', 'test']) {
    const response = await agent.post(`/api/admin/posts/${postId}/newsletter/${action}`)
      .set('Origin', 'http://localhost:3999');
    assert.equal(response.status, 403, action);
  }
  assert.equal(mails.length, 0);
});

test('status reports flags and delivery counts', async () => {
  await freshPost();
  await db('newsletter_deliveries').insert({ post_id: postId, subscriber_id: subscriberId, status: 'failed' });
  const response = await (await adminAgent()).get(`/api/admin/posts/${postId}/newsletter`);
  assert.equal(response.status, 200);
  assert.equal(response.body.counts.failed, 1);
  assert.equal(response.body.enabled, true);
});

test('retry-failed requeues failed rows but never interrupted ones', async () => {
  await freshPost();
  await db('newsletter_deliveries').insert({ post_id: postId, subscriber_id: subscriberId, status: 'failed' });
  await db('newsletter_deliveries').insert({
    post_id: postId, subscriber_id: interruptedSubscriberId, status: 'failed', last_error: 'interrupted',
  });
  const response = await (await adminAgent()).post(`/api/admin/posts/${postId}/newsletter/retry-failed`);
  assert.equal(response.status, 200);
  assert.equal(response.body.counts.pending, 1);
  assert.equal(response.body.counts.failed, 1);
  const interrupted = await db('newsletter_deliveries')
    .where({ post_id: postId, subscriber_id: interruptedSubscriberId }).first('status', 'last_error');
  assert.deepEqual({ ...interrupted }, { status: 'failed', last_error: 'interrupted' });
});

test('cancel opts the post out, clears the schedule and skips pending deliveries', async () => {
  await freshPost();
  await db('newsletter_deliveries').insert({ post_id: postId, subscriber_id: subscriberId, status: 'pending' });
  await db('blog_posts').where({ id: postId }).update({ newsletter_scheduled_at: db.fn.now() });
  const response = await (await adminAgent()).post(`/api/admin/posts/${postId}/newsletter/cancel`);
  assert.equal(response.status, 200);
  assert.equal(response.body.enabled, false);
  assert.equal(response.body.scheduledAt, null);
  assert.equal(response.body.counts.skipped, 1);
});

test('test send goes only to the signed-in admin address and leaves the queue alone', async () => {
  await freshPost();
  await db('newsletter_deliveries').insert({ post_id: postId, subscriber_id: subscriberId, status: 'pending' });
  mails.length = 0;
  const queueBefore = await db('newsletter_deliveries').where({ post_id: postId }).select('id', 'status');
  const response = await (await adminAgent()).post(`/api/admin/posts/${postId}/newsletter/test`);
  assert.equal(response.status, 200);
  assert.equal(mails.length, 1);
  assert.equal(mails[0].to, `${prefix}-admin@example.test`);
  const queueAfter = await db('newsletter_deliveries').where({ post_id: postId }).select('id', 'status');
  assert.deepEqual(queueAfter, queueBefore);
});

test('test send failure is a generic 503 that echoes nothing from the sender', async t => {
  await freshPost();
  const agent = await adminAgent();
  const logged: unknown[][] = [];
  for (const method of ['log', 'error', 'warn'] as const) {
    t.mock.method(console, method, (...args: unknown[]) => { logged.push(args); });
  }
  setNewsletterMailTransportForTests({
    sendMail: async () => {
      throw Object.assign(new Error(`550 5.1.1 ${prefix}-admin@example.test smtp-secret`), { responseCode: 550 });
    },
  });
  try {
    const response = await agent.post(`/api/admin/posts/${postId}/newsletter/test`);
    assert.equal(response.status, 503);
    assert.deepEqual(response.body, { error: 'Test e-postası gönderilemedi.' });
    assert.doesNotMatch(JSON.stringify(response.body), /smtp-secret|example\.test/);
    assert.doesNotMatch(JSON.stringify(logged), /smtp-secret|example\.test/);
  } finally {
    setNewsletterMailTransportForTests({ sendMail: async m => { mails.push(m); return {} as never; } });
  }
});

test('an unknown post is a 404', async () => {
  const response = await (await adminAgent()).get('/api/admin/posts/99999999/newsletter');
  assert.equal(response.status, 404);
});
