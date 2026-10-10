import 'dotenv/config';
import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../db/knex.js';
import { findById } from '../repositories/postsRepo.js';
import { syncNewsletterSchedule } from '../services/newsletterSchedule.js';

const prefix = `sched-${process.pid}`;
let counter = 0;

async function makePost(values: Record<string, unknown>) {
  const [id] = await db('blog_posts').insert({ slug: `${prefix}-${counter++}`, title: 'T', ...values });
  return (await findById(id))!;
}

beforeEach(async () => { await db('blog_posts').where('slug', 'like', `${prefix}%`).delete(); });
after(async () => {
  await db('blog_posts').where('slug', 'like', `${prefix}%`).delete();
  await db('subscribers').where('email', 'like', `${prefix}%`).delete();
  await db.destroy();
});

test('a newly published post is scheduled; a draft is not', async () => {
  const live = await syncNewsletterSchedule(await makePost({ published: true }));
  assert.ok(live.newsletter_scheduled_at);
  const draft = await syncNewsletterSchedule(await makePost({ published: false }));
  assert.equal(draft.newsletter_scheduled_at, null);
});

test('a post already sent is never scheduled again, however often it is toggled', async () => {
  const sent = await makePost({ published: true, newsletter_sent_at: db.fn.now() });
  const again = await syncNewsletterSchedule(sent);
  assert.equal(again.newsletter_scheduled_at, null);
  await db('blog_posts').where({ id: sent.id }).update({ published: false });
  await syncNewsletterSchedule((await findById(sent.id))!);
  await db('blog_posts').where({ id: sent.id }).update({ published: true });
  const republished = await syncNewsletterSchedule((await findById(sent.id))!);
  assert.equal(republished.newsletter_scheduled_at, null);
});

test('unpublishing or opting out clears the schedule and cancels pending deliveries', async () => {
  const post = await syncNewsletterSchedule(await makePost({ published: true }));
  const [subscriberId] = await db('subscribers').insert({
    name: 'n', email: `${prefix}@example.test`, consent_given: true, consent_at: db.fn.now(), email_verified_at: db.fn.now(),
  });
  await db('newsletter_deliveries').insert({ post_id: post.id, subscriber_id: subscriberId, status: 'pending' });

  await db('blog_posts').where({ id: post.id }).update({ published: false });
  const cleared = await syncNewsletterSchedule((await findById(post.id))!);
  assert.equal(cleared.newsletter_scheduled_at, null);
  const delivery = await db('newsletter_deliveries').where({ post_id: post.id }).first();
  assert.equal(delivery.status, 'skipped');

  const optedOut = await syncNewsletterSchedule(await makePost({ published: true, newsletter_enabled: false }));
  assert.equal(optedOut.newsletter_scheduled_at, null);
});

test('re-enabling the newsletter before it was sent schedules it again', async () => {
  const post = await makePost({ published: true, newsletter_enabled: false });
  await syncNewsletterSchedule(post);
  await db('blog_posts').where({ id: post.id }).update({ newsletter_enabled: true });
  const enabled = await syncNewsletterSchedule((await findById(post.id))!);
  assert.ok(enabled.newsletter_scheduled_at);
});
