import 'dotenv/config';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../db/knex.js';
import { newsletterBroadcastConfig } from '../config/newsletterBroadcast.js';

after(async () => { await db.destroy(); });

test('blog_posts has the newsletter columns and deliveries table exists', async () => {
  for (const column of ['newsletter_enabled', 'newsletter_scheduled_at', 'newsletter_sent_at']) {
    assert.ok(await db.schema.hasColumn('blog_posts', column), column);
  }
  for (const column of ['post_id', 'subscriber_id', 'status', 'attempts', 'last_error', 'sent_at']) {
    assert.ok(await db.schema.hasColumn('newsletter_deliveries', column), column);
  }
});

test('deliveries are removed with their post', async () => {
  const [postId] = await db('blog_posts').insert({ slug: `schema-${process.pid}`, title: 't', published: false });
  const [subscriberId] = await db('subscribers').insert({
    name: 'n', email: `schema-${process.pid}@example.test`, consent_given: true, consent_at: db.fn.now(),
  });
  await db('newsletter_deliveries').insert({ post_id: postId, subscriber_id: subscriberId, status: 'pending' });
  await db('blog_posts').where({ id: postId }).delete();
  assert.equal((await db('newsletter_deliveries').where({ post_id: postId })).length, 0);
  await db('subscribers').where({ id: subscriberId }).delete();
});

test('configuration has safe defaults and rejects nonsense values', () => {
  const keys = ['NEWSLETTER_WORKER_ENABLED', 'NEWSLETTER_DELAY_MINUTES', 'NEWSLETTER_BATCH_SIZE',
    'NEWSLETTER_DAILY_CAP', 'NEWSLETTER_UNSUBSCRIBE_TTL_DAYS'] as const;
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    for (const key of keys) delete process.env[key];
    assert.deepEqual(newsletterBroadcastConfig(),
      { workerEnabled: true, delayMinutes: 10, batchSize: 20, dailyCap: 400, unsubscribeTtlDays: 30 });
    process.env.NEWSLETTER_DAILY_CAP = '-5';
    process.env.NEWSLETTER_DELAY_MINUTES = 'abc';
    process.env.NEWSLETTER_WORKER_ENABLED = 'false';
    const config = newsletterBroadcastConfig();
    assert.equal(config.dailyCap, 400);
    assert.equal(config.delayMinutes, 10);
    assert.equal(config.workerEnabled, false);
  } finally {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
});
