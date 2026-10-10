import 'dotenv/config';
import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../db/knex.js';
import {
  claimNextDelivery,
  deferDelivery,
  fanOutDeliveries,
  listDuePostIds,
} from '../repositories/newsletterDeliveriesRepo.js';

const prefix = `deliv-${process.pid}`;
let counter = 0;

async function makePost(values: Record<string, unknown> = {}): Promise<number> {
  const [id] = await db('blog_posts').insert({
    slug: `${prefix}-${counter++}`, title: 'T', published: true, ...values,
  });
  return id;
}

async function makeSubscriber(verified = true): Promise<number> {
  const [id] = await db('subscribers').insert({
    name: 'n',
    email: `${prefix}-${counter++}@example.test`,
    consent_given: true,
    consent_at: db.fn.now(),
    email_verified_at: verified ? db.fn.now() : null,
  });
  return id;
}

async function cleanup() {
  await db('blog_posts').where('slug', 'like', `${prefix}%`).delete();
  await db('subscribers').where('email', 'like', `${prefix}%`).delete();
}

beforeEach(cleanup);
after(async () => { await cleanup(); await db.destroy(); });

test('a delivery that has been deferred is claimed after fresh ones', async () => {
  const postId = await makePost();
  const [older, newer] = [await makeSubscriber(), await makeSubscriber()];
  const [oldId] = await db('newsletter_deliveries')
    .insert({ post_id: postId, subscriber_id: older, status: 'pending', attempts: 1 });
  const [freshId] = await db('newsletter_deliveries')
    .insert({ post_id: postId, subscriber_id: newer, status: 'pending', attempts: 0 });
  assert.ok(freshId > oldId);

  const first = await claimNextDelivery(postId);
  assert.equal(first?.id, freshId);
  const second = await claimNextDelivery(postId);
  assert.equal(second?.id, oldId);
  assert.equal(await claimNextDelivery(postId), null);
});

test('deferDelivery returns the row to pending and counts an attempt', async () => {
  const postId = await makePost();
  const subscriberId = await makeSubscriber();
  await db('newsletter_deliveries')
    .insert({ post_id: postId, subscriber_id: subscriberId, status: 'pending' });
  const claimed = await claimNextDelivery(postId);
  assert.ok(claimed);

  assert.equal(await deferDelivery(claimed.id), 1);
  const row = await db('newsletter_deliveries').where({ id: claimed.id }).first();
  assert.equal(row.status, 'pending');
  assert.equal(row.attempts, 1);
  assert.equal(row.last_error, 'paused');
});

test('fan-out enqueues verified subscribers once and marks the post sent', async () => {
  const postId = await makePost({ newsletter_enabled: true });
  const verified = await makeSubscriber(true);
  await makeSubscriber(false);

  assert.equal(await fanOutDeliveries(postId), true);
  assert.equal(await fanOutDeliveries(postId), false);
  const rows = await db('newsletter_deliveries').where({ post_id: postId });
  assert.deepEqual(rows.map(r => r.subscriber_id), [verified]);
});

test('a post scheduled in the past is due; one in the future is not', async () => {
  const due = await makePost({
    newsletter_enabled: true,
    newsletter_scheduled_at: db.raw('DATE_SUB(NOW(), INTERVAL 5 MINUTE)'),
  });
  const future = await makePost({
    newsletter_enabled: true,
    newsletter_scheduled_at: db.raw('DATE_ADD(NOW(), INTERVAL 60 MINUTE)'),
  });
  assert.deepEqual(await listDuePostIds(due), [due]);
  assert.deepEqual(await listDuePostIds(future), []);
});
