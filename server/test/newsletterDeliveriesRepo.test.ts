import 'dotenv/config';
import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../db/knex.js';
import {
  cancelPendingDeliveries,
  claimNextDelivery,
  countSentInLast24Hours,
  deferDelivery,
  fanOutDeliveries,
  listDuePostIds,
  markFailed,
  markRetry,
  reclaimStaleDeliveries,
  releaseDelivery,
  requeueFailedDeliveries,
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

test('with equal updated_at, a delivery with fewer attempts is claimed first', async () => {
  const postId = await makePost();
  const [older, newer] = [await makeSubscriber(), await makeSubscriber()];
  // A fixed literal (not a JS Date), so both rows share one timestamp exactly.
  const sameTime = '2026-01-01 00:00:00';
  const [oldId] = await db('newsletter_deliveries')
    .insert({ post_id: postId, subscriber_id: older, status: 'pending', attempts: 1, updated_at: sameTime });
  const [freshId] = await db('newsletter_deliveries')
    .insert({ post_id: postId, subscriber_id: newer, status: 'pending', attempts: 0, updated_at: sameTime });
  assert.ok(freshId > oldId);

  const first = await claimNextDelivery(postId);
  assert.equal(first?.id, freshId);
  const second = await claimNextDelivery(postId);
  assert.equal(second?.id, oldId);
  assert.equal(await claimNextDelivery(postId), null);
});

test('a row tried less recently is claimed first, whatever its attempts', async () => {
  const postId = await makePost();
  const [first, second] = [await makeSubscriber(), await makeSubscriber()];
  const [retriedId] = await db('newsletter_deliveries').insert({
    post_id: postId, subscriber_id: first, status: 'pending', attempts: 2,
    updated_at: db.raw('DATE_SUB(NOW(), INTERVAL 2 MINUTE)'),
  });
  await db('newsletter_deliveries').insert({
    post_id: postId, subscriber_id: second, status: 'pending', attempts: 0,
    updated_at: db.raw('DATE_SUB(NOW(), INTERVAL 1 MINUTE)'),
  });
  assert.equal((await claimNextDelivery(postId))?.id, retriedId);
});

test('release, defer and retry always move updated_at strictly later', async () => {
  const postId = await makePost();
  const subscriberId = await makeSubscriber();
  const [id] = await db('newsletter_deliveries')
    .insert({ post_id: postId, subscriber_id: subscriberId, status: 'pending' });
  const updatedAt = async () =>
    Number((await db('newsletter_deliveries').where({ id }).first(db.raw('UNIX_TIMESTAMP(updated_at) AS t'))).t);
  for (const put of [releaseDelivery, deferDelivery, (rowId: number) => markRetry(rowId, 'transient')]) {
    // Two rounds in the same second would tie without the strict bump.
    for (let round = 0; round < 2; round++) {
      const claimed = await claimNextDelivery(postId);
      assert.equal(claimed?.id, id);
      const before = await updatedAt();
      assert.equal(await put(id), 1);
      assert.ok(await updatedAt() > before);
    }
  }
});

test('with equal attempts, a recently released delivery is claimed after untried ones', async () => {
  const postId = await makePost();
  const [first, second] = [await makeSubscriber(), await makeSubscriber()];
  const [releasedId] = await db('newsletter_deliveries').insert({
    post_id: postId, subscriber_id: first, status: 'pending',
    updated_at: db.raw('DATE_SUB(NOW(), INTERVAL 1 MINUTE)'),
  });
  const [untriedId] = await db('newsletter_deliveries').insert({
    post_id: postId, subscriber_id: second, status: 'pending',
    updated_at: db.raw('DATE_SUB(NOW(), INTERVAL 1 MINUTE)'),
  });
  assert.ok(releasedId < untriedId);

  const claimed = await claimNextDelivery(postId);
  assert.equal(claimed?.id, releasedId);
  assert.equal(await releaseDelivery(releasedId), 1);

  assert.equal((await claimNextDelivery(postId))?.id, untriedId);
  assert.equal((await claimNextDelivery(postId))?.id, releasedId);
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
  const unverified = await makeSubscriber(false);

  assert.equal(await fanOutDeliveries(postId), true);
  assert.equal(await fanOutDeliveries(postId), false);
  const rows = await db('newsletter_deliveries').where({ post_id: postId });
  const queued = rows.map(r => r.subscriber_id);
  assert.equal(queued.filter(id => id === verified).length, 1);
  assert.equal(queued.includes(unverified), false);
  assert.equal(new Set(queued).size, queued.length);
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

test('a delivery cancelled while sending is not revived by a late result', async () => {
  const postId = await makePost();
  const subscriberId = await makeSubscriber();
  await db('newsletter_deliveries')
    .insert({ post_id: postId, subscriber_id: subscriberId, status: 'pending' });
  const claimed = await claimNextDelivery(postId);
  assert.ok(claimed);
  assert.equal(await cancelPendingDeliveries(postId), 1);

  assert.equal(await markRetry(claimed.id, 'transient'), 0);
  assert.equal(await deferDelivery(claimed.id), 0);
  assert.equal(await markFailed(claimed.id, 'permanent'), 0);
  const row = await db('newsletter_deliveries').where({ id: claimed.id }).first();
  assert.equal(row.status, 'skipped');
  assert.equal(row.attempts, 0);
  assert.equal(row.last_error, 'cancelled');
});

test('fan-out tolerates an existing delivery without duplicating it', async () => {
  const postId = await makePost({ newsletter_enabled: true });
  const existing = await makeSubscriber();
  const fresh = await makeSubscriber();
  await db('newsletter_deliveries')
    .insert({ post_id: postId, subscriber_id: existing, status: 'sent' });

  assert.equal(await fanOutDeliveries(postId), true);
  const rows = await db('newsletter_deliveries').where({ post_id: postId })
    .whereIn('subscriber_id', [existing, fresh]).orderBy('subscriber_id');
  assert.deepEqual(rows.map(r => [r.subscriber_id, r.status]), [[existing, 'sent'], [fresh, 'pending']]);
});

test('a stale sending delivery is failed as interrupted, never re-queued', async () => {
  const postId = await makePost();
  const [staleSubscriber, freshSubscriber] = [await makeSubscriber(), await makeSubscriber()];
  const [staleId] = await db('newsletter_deliveries').insert({
    post_id: postId, subscriber_id: staleSubscriber, status: 'sending', attempts: 1,
    updated_at: db.raw('DATE_SUB(NOW(), INTERVAL 11 MINUTE)'),
  });
  const [freshId] = await db('newsletter_deliveries')
    .insert({ post_id: postId, subscriber_id: freshSubscriber, status: 'sending' });

  await reclaimStaleDeliveries();
  const stale = await db('newsletter_deliveries').where({ id: staleId }).first();
  assert.equal(stale.status, 'failed');
  assert.equal(stale.last_error, 'interrupted');
  assert.equal(stale.attempts, 1);
  assert.equal((await db('newsletter_deliveries').where({ id: freshId }).first()).status, 'sending');
});

test('requeueFailedDeliveries skips interrupted deliveries that may already be sent', async () => {
  const postId = await makePost();
  const [plain, interrupted] = [await makeSubscriber(), await makeSubscriber()];
  await db('newsletter_deliveries').insert([
    { post_id: postId, subscriber_id: plain, status: 'failed', last_error: 'permanent (smtp 550)', attempts: 2 },
    { post_id: postId, subscriber_id: interrupted, status: 'failed', last_error: 'interrupted' },
  ]);

  assert.equal(await requeueFailedDeliveries(postId), 1);
  const rows = await db('newsletter_deliveries').where({ post_id: postId }).orderBy('id');
  assert.deepEqual(rows.map(row => row.status), ['pending', 'failed']);
  assert.equal(rows[0].attempts, 0);
  assert.equal(rows[1].last_error, 'interrupted');
});

test('releaseDelivery returns a sending row to pending without counting an attempt', async () => {
  const postId = await makePost();
  const subscriberId = await makeSubscriber();
  await db('newsletter_deliveries')
    .insert({ post_id: postId, subscriber_id: subscriberId, status: 'pending', attempts: 2 });
  const claimed = await claimNextDelivery(postId);
  assert.ok(claimed);

  assert.equal(await releaseDelivery(claimed.id), 1);
  const row = await db('newsletter_deliveries').where({ id: claimed.id }).first();
  assert.equal(row.status, 'pending');
  assert.equal(row.attempts, 2);

  // Not sending any more, so a second release (or one after a cancel) is a no-op.
  assert.equal(await releaseDelivery(claimed.id), 0);
  await claimNextDelivery(postId);
  await cancelPendingDeliveries(postId);
  assert.equal(await releaseDelivery(claimed.id), 0);
  assert.equal((await db('newsletter_deliveries').where({ id: claimed.id }).first()).status, 'skipped');
});

test('the daily count includes in-flight and interrupted deliveries, which may have been sent', async () => {
  const postId = await makePost();
  const subscribers = [await makeSubscriber(), await makeSubscriber(), await makeSubscriber(), await makeSubscriber()];
  const before = await countSentInLast24Hours();
  await db('newsletter_deliveries').insert([
    { post_id: postId, subscriber_id: subscribers[0], status: 'failed', last_error: 'interrupted' },
    { post_id: postId, subscriber_id: subscribers[1], status: 'sending' },
    { post_id: postId, subscriber_id: subscribers[2], status: 'failed', last_error: 'permanent (smtp 550)' },
    {
      post_id: postId, subscriber_id: subscribers[3], status: 'failed', last_error: 'interrupted',
      updated_at: db.raw('DATE_SUB(NOW(), INTERVAL 25 HOUR)'),
    },
  ]);
  assert.equal(await countSentInLast24Hours(), before + 2);
});
