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
  const keys = ['NODE_ENV', 'NEWSLETTER_WORKER_ENABLED', 'NEWSLETTER_DELAY_MINUTES', 'NEWSLETTER_BATCH_SIZE',
    'NEWSLETTER_DAILY_CAP', 'NEWSLETTER_UNSUBSCRIBE_TTL_DAYS'] as const;
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    for (const key of keys) if (key !== 'NODE_ENV') delete process.env[key];
    process.env.NODE_ENV = 'test';
    assert.deepEqual(newsletterBroadcastConfig(),
      { workerEnabled: false, delayMinutes: 10, batchSize: 20, dailyCap: 400, unsubscribeTtlDays: 365 });
    process.env.NEWSLETTER_DAILY_CAP = '-5';
    process.env.NEWSLETTER_DELAY_MINUTES = 'abc';
    const config = newsletterBroadcastConfig();
    assert.equal(config.dailyCap, 400);
    assert.equal(config.delayMinutes, 10);
  } finally {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
});

test('the worker is on by default only in production and the flag overrides it', () => {
  const saved = { nodeEnv: process.env.NODE_ENV, flag: process.env.NEWSLETTER_WORKER_ENABLED };
  const enabled = (nodeEnv: string, flag?: string) => {
    process.env.NODE_ENV = nodeEnv;
    if (flag === undefined) delete process.env.NEWSLETTER_WORKER_ENABLED;
    else process.env.NEWSLETTER_WORKER_ENABLED = flag;
    return newsletterBroadcastConfig().workerEnabled;
  };
  try {
    assert.equal(enabled('test'), false);
    assert.equal(enabled('development'), false);
    assert.equal(enabled('production'), true);
    assert.equal(enabled('production', 'FALSE'), false);
    assert.equal(enabled('production', ' false '), false);
    assert.equal(enabled('development', 'True'), true);
    assert.equal(enabled('test', 'true'), true);
    assert.equal(enabled('production', 'nonsense'), true);
    assert.equal(enabled('development', 'nonsense'), false);
  } finally {
    process.env.NODE_ENV = saved.nodeEnv;
    if (saved.flag === undefined) delete process.env.NEWSLETTER_WORKER_ENABLED;
    else process.env.NEWSLETTER_WORKER_ENABLED = saved.flag;
  }
});
