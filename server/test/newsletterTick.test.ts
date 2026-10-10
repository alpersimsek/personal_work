import 'dotenv/config';
import { test, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../db/knex.js';
import { runBroadcastTick } from '../services/newsletterBroadcast.js';
import { startNewsletterWorker } from '../worker/newsletterWorker.js';
import { countSentInLast24Hours, fanOutDeliveries } from '../repositories/newsletterDeliveriesRepo.js';
import { NewsletterSendError, type BroadcastMessage, type NewsletterSender } from '../services/newsletterSender.js';

const prefix = `tick-${process.pid}`;
const mine = (to: string) => to.startsWith(prefix);

const ENV_KEYS = ['PUBLIC_SITE_URL', 'NEWSLETTER_BATCH_SIZE', 'NEWSLETTER_DAILY_CAP'] as const;
const originalEnv = Object.fromEntries(ENV_KEYS.map(key => [key, process.env[key]]));

class FakeSender implements NewsletterSender {
  readonly sent: BroadcastMessage[] = [];
  failures = new Map<string, NewsletterSendError>();
  async send(message: BroadcastMessage): Promise<void> {
    const failure = this.failures.get(message.to);
    if (failure) throw failure;
    this.sent.push(message);
  }
  get mine() { return this.sent.filter(m => mine(m.to)); }
}

async function makeSubscriber(name: string, extra: Record<string, unknown> = {}) {
  const email = `${prefix}-${name}@example.test`;
  const [id] = await db('subscribers').insert({
    name, email, consent_given: true, consent_at: db.fn.now(), email_verified_at: db.fn.now(), ...extra,
  });
  return { id, email };
}

async function makeDuePost(extra: Record<string, unknown> = {}) {
  const [id] = await db('blog_posts').insert({
    slug: `${prefix}-${Math.random().toString(36).slice(2)}`, title: 'Yeni Yazı', summary: 'Özet',
    published: true, newsletter_enabled: true,
    newsletter_scheduled_at: db.raw('DATE_SUB(NOW(), INTERVAL 1 MINUTE)'), ...extra,
  });
  return id as number;
}

/**
 * Fans the post out now and skips every delivery that does not belong to a
 * subscriber created by this file, so other subscribers in the test database
 * cannot change ordering, counts or pending sets.
 */
async function makeHermeticDuePost(extra: Record<string, unknown> = {}) {
  const postId = await makeDuePost(extra);
  assert.equal(await fanOutDeliveries(postId), true);
  const foreign = db('subscribers').whereNot('email', 'like', `${prefix}%`).select('id');
  await db('newsletter_deliveries').where({ post_id: postId }).whereIn('subscriber_id', foreign)
    .update({ status: 'skipped', last_error: 'not part of this test' });
  return postId;
}

async function deliveryOf(postId: number, email: string) {
  return db('newsletter_deliveries as d').join('subscribers as s', 's.id', 'd.subscriber_id')
    .where({ 'd.post_id': postId, 's.email': email }).first('d.id', 'd.status', 'd.attempts', 'd.last_error');
}

async function statusOf(postId: number, email: string): Promise<string | undefined> {
  return (await deliveryOf(postId, email))?.status;
}

async function myDeliveries(postId: number) {
  return db('newsletter_deliveries as d').join('subscribers as s', 's.id', 'd.subscriber_id')
    .where({ 'd.post_id': postId }).where('s.email', 'like', `${prefix}%`)
    .select('d.id', 'd.status', 'd.attempts', 'd.last_error', 's.email');
}

async function cleanup() {
  await db('blog_posts').where('slug', 'like', `${prefix}%`).delete();
  await db('subscribers').where('email', 'like', `${prefix}%`).delete();
  await db('newsletter_verification_tokens').where('email', 'like', `${prefix}%`).delete();
}

beforeEach(async () => {
  process.env.PUBLIC_SITE_URL = 'http://localhost:3000';
  process.env.NEWSLETTER_BATCH_SIZE = '1000';
  process.env.NEWSLETTER_DAILY_CAP = '100000';
  await cleanup();
});
after(async () => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
  await cleanup();
  await db.destroy();
});

test('sends once to verified, subscribed addresses only, then never again', async () => {
  const ok = await makeSubscriber('ok');
  await makeSubscriber('unverified', { email_verified_at: null });
  await makeSubscriber('gone', { unsubscribed_at: db.fn.now() });
  const postId = await makeDuePost();
  const sender = new FakeSender();

  await runBroadcastTick({ sender, postId });
  assert.deepEqual(sender.mine.map(m => m.to), [ok.email]);
  assert.match(sender.mine[0].unsubscribeUrl, /unsubscribe\/confirm\?token=[A-Za-z0-9_-]{43}$/);
  assert.equal(await statusOf(postId, ok.email), 'sent');
  assert.ok((await db('blog_posts').where({ id: postId }).first()).newsletter_sent_at);

  await runBroadcastTick({ sender, postId });
  assert.equal(sender.mine.length, 1);
});

test('does nothing before the delay has passed', async () => {
  await makeSubscriber('early');
  const postId = await makeDuePost({ newsletter_scheduled_at: db.raw('DATE_ADD(NOW(), INTERVAL 10 MINUTE)') });
  const sender = new FakeSender();
  await runBroadcastTick({ sender, postId });
  assert.equal(sender.mine.length, 0);
  assert.equal((await db('newsletter_deliveries').where({ post_id: postId })).length, 0);
});

test('a subscriber who unsubscribes after fan-out is skipped', async () => {
  const stays = await makeSubscriber('stays');
  const leaves = await makeSubscriber('leaves');
  const postId = await makeHermeticDuePost();
  const sender = new FakeSender();
  // Subscribers are claimed in insertion order, so a batch of one sends "stays" first.
  process.env.NEWSLETTER_BATCH_SIZE = '1';
  await runBroadcastTick({ sender, postId });
  assert.deepEqual(sender.mine.map(m => m.to), [stays.email]);
  await db('subscribers').where({ id: leaves.id }).update({ unsubscribed_at: db.fn.now() });
  process.env.NEWSLETTER_BATCH_SIZE = '1000';
  await runBroadcastTick({ sender, postId });
  assert.deepEqual(sender.mine.map(m => m.to), [stays.email]);
  assert.equal(await statusOf(postId, leaves.email), 'skipped');
});

test('a post unpublished before its turn sends nothing', async () => {
  const first = await makeSubscriber('a');
  const second = await makeSubscriber('b');
  const postId = await makeHermeticDuePost();
  const sender = new FakeSender();
  process.env.NEWSLETTER_BATCH_SIZE = '1';
  await runBroadcastTick({ sender, postId });
  assert.deepEqual(sender.mine.map(m => m.to), [first.email]);
  await db('blog_posts').where({ id: postId }).update({ published: false });
  process.env.NEWSLETTER_BATCH_SIZE = '1000';
  await runBroadcastTick({ sender, postId });
  assert.equal(sender.mine.length, 1);
  assert.equal(await statusOf(postId, second.email), 'skipped');
});

test('the rolling daily cap stops sending and leaves the rest pending', async () => {
  for (const name of ['a', 'b', 'c', 'd']) await makeSubscriber(name);
  const postId = await makeHermeticDuePost();
  process.env.NEWSLETTER_DAILY_CAP = String((await countSentInLast24Hours()) + 2);
  const sender = new FakeSender();
  const result = await runBroadcastTick({ sender, postId });
  assert.equal(result.sent, 2);
  const pending = await db('newsletter_deliveries').where({ post_id: postId, status: 'pending' });
  assert.equal(pending.length, 2);
});

test('a quota or auth error halts the tick and burns no recipient to failed', async () => {
  const first = await makeSubscriber('a');
  const second = await makeSubscriber('b');
  const postId = await makeHermeticDuePost();
  const sender = new FakeSender();
  sender.failures.set(first.email, new NewsletterSendError('halt', 'halt (smtp 550)'));
  sender.failures.set(second.email, new NewsletterSendError('halt', 'halt (smtp 550)'));
  const result = await runBroadcastTick({ sender, postId });
  assert.equal(result.halted, true);
  assert.equal(result.sent, 0);
  assert.equal((await db('newsletter_deliveries').where({ post_id: postId, status: 'failed' })).length, 0);
  const rows = await myDeliveries(postId);
  assert.ok(rows.every(row => row.status === 'pending'));
  // Only the delivery that was claimed is deferred; the tick stops there.
  assert.deepEqual(
    rows.map(row => [row.email, row.attempts]).sort(),
    [[first.email, 1], [second.email, 0]],
  );
});

test('a delivery that keeps halting is failed at the halt cap; the others stay pending', async () => {
  const stuck = await makeSubscriber('stuck');
  const other = await makeSubscriber('other');
  const third = await makeSubscriber('third');
  const postId = await makeHermeticDuePost();
  // Equal attempts keep id order, so the stuck recipient is claimed first.
  const ids = (await myDeliveries(postId)).map(row => row.id);
  await db('newsletter_deliveries').whereIn('id', ids).update({ attempts: 5 });
  const sender = new FakeSender();
  sender.failures.set(stuck.email, new NewsletterSendError('halt', 'halt (smtp 554)'));

  const result = await runBroadcastTick({ sender, postId });
  assert.equal(result.halted, true);
  const stuckRow = await deliveryOf(postId, stuck.email);
  assert.equal(stuckRow.status, 'failed');
  assert.equal(stuckRow.last_error, 'halt-repeated');
  assert.equal(stuckRow.attempts, 6);
  assert.equal(await statusOf(postId, other.email), 'pending');
  assert.equal(await statusOf(postId, third.email), 'pending');
  assert.equal(sender.mine.length, 0);
});

test('after a halt the next tick sends the other recipients first', async () => {
  const first = await makeSubscriber('a');
  const second = await makeSubscriber('b');
  const third = await makeSubscriber('c');
  const postId = await makeHermeticDuePost();
  const sender = new FakeSender();
  sender.failures.set(first.email, new NewsletterSendError('halt', 'halt (smtp 554)'));
  assert.equal((await runBroadcastTick({ sender, postId })).halted, true);

  sender.failures.clear();
  const result = await runBroadcastTick({ sender, postId });
  assert.equal(result.halted, false);
  assert.deepEqual(sender.mine.map(m => m.to), [second.email, third.email, first.email]);
});

test('one failing address is retried, then failed, without blocking the others', async () => {
  const bad = await makeSubscriber('bad');
  const good = await makeSubscriber('good');
  const postId = await makeHermeticDuePost();
  const sender = new FakeSender();
  sender.failures.set(bad.email, new NewsletterSendError('transient', 'transient'));
  for (let round = 0; round < 3; round++) await runBroadcastTick({ sender, postId });
  assert.equal(await statusOf(postId, good.email), 'sent');
  assert.equal(await statusOf(postId, bad.email), 'failed');
  const failed = await deliveryOf(postId, bad.email);
  assert.equal(failed.attempts, 3);
  assert.equal(failed.last_error, 'transient');
});

test('a permanent failure is failed at once', async () => {
  const gone = await makeSubscriber('nomailbox');
  const postId = await makeHermeticDuePost();
  const sender = new FakeSender();
  sender.failures.set(gone.email, new NewsletterSendError('permanent', 'permanent (smtp 550)'));
  await runBroadcastTick({ sender, postId });
  assert.equal(await statusOf(postId, gone.email), 'failed');
});

test('only the error message is stored, never its cause', async () => {
  const gone = await makeSubscriber('cause');
  const postId = await makeHermeticDuePost();
  const sender = new FakeSender();
  sender.failures.set(gone.email, new NewsletterSendError('permanent', 'permanent (smtp 550)', {
    cause: new Error(`550 5.1.1 <${gone.email}> no such user`),
  }));
  await runBroadcastTick({ sender, postId });
  const row = await deliveryOf(postId, gone.email);
  assert.equal(row.last_error, 'permanent (smtp 550)');
});

test('two ticks at the same time never send the same delivery twice', async () => {
  for (const name of ['a', 'b', 'c', 'd', 'e']) await makeSubscriber(name);
  const postId = await makeHermeticDuePost();
  const sender = new FakeSender();
  await Promise.all([runBroadcastTick({ sender, postId }), runBroadcastTick({ sender, postId })]);
  const recipients = sender.mine.map(m => m.to);
  assert.equal(new Set(recipients).size, recipients.length);
  assert.equal(recipients.length, 5);
});

test('a missing PUBLIC_SITE_URL halts without touching any delivery', async () => {
  await makeSubscriber('a');
  const postId = await makeHermeticDuePost();
  delete process.env.PUBLIC_SITE_URL;
  const result = await runBroadcastTick({ sender: new FakeSender(), postId });
  assert.equal(result.halted, true);
  const rows = await myDeliveries(postId);
  assert.ok(rows.length > 0);
  assert.ok(rows.every(row => row.status === 'pending' && row.attempts === 0));
});

test('the worker never starts under tests or when disabled', () => {
  const setIntervalSpy = mock.method(globalThis, 'setInterval');
  const originalNodeEnv = process.env.NODE_ENV;
  const originalEnabled = process.env.NEWSLETTER_WORKER_ENABLED;
  try {
    startNewsletterWorker(new FakeSender())();
    process.env.NODE_ENV = 'development';
    process.env.NEWSLETTER_WORKER_ENABLED = 'false';
    startNewsletterWorker(new FakeSender())();
    assert.equal(setIntervalSpy.mock.callCount(), 0);
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalEnabled === undefined) delete process.env.NEWSLETTER_WORKER_ENABLED;
    else process.env.NEWSLETTER_WORKER_ENABLED = originalEnabled;
    setIntervalSpy.mock.restore();
  }
});
