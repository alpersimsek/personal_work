import 'dotenv/config';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../db/knex.js';
import {
  consumeNewsletterToken, hashNewsletterToken,
  issueBroadcastUnsubscribeToken, purgeExpiredNewsletterTokens,
} from '../services/newsletterTokens.js';

const email = `bcast-token-${process.pid}@example.test`;
after(async () => {
  await db('newsletter_verification_tokens').where({ email }).delete();
  await db.destroy();
});

test('several broadcast tokens for one address stay valid side by side', async () => {
  const first = await issueBroadcastUnsubscribeToken(email, 60_000);
  const second = await issueBroadcastUnsubscribeToken(email, 60_000);
  assert.notEqual(first, second);
  assert.match(first, /^[A-Za-z0-9_-]{43}$/);
  const seen: string[] = [];
  assert.equal(await consumeNewsletterToken(first, 'unsubscribe', async row => { seen.push(row.email); }), true);
  assert.deepEqual(seen, [email]);
  assert.equal(await consumeNewsletterToken(second, 'unsubscribe', async () => {}), true);
});

test('a broadcast token is single-use, purpose-bound and expires', async () => {
  const token = await issueBroadcastUnsubscribeToken(email, 60_000);
  assert.equal(await consumeNewsletterToken(token, 'confirm', async () => {}), false);
  assert.equal(await consumeNewsletterToken(token, 'unsubscribe', async () => {}), true);
  assert.equal(await consumeNewsletterToken(token, 'unsubscribe', async () => {}), false);

  const expired = await issueBroadcastUnsubscribeToken(email, -1_000);
  assert.equal(await consumeNewsletterToken(expired, 'unsubscribe', async () => {}), false);
});

test('only the hash is stored, and purge removes long-expired rows', async () => {
  const token = await issueBroadcastUnsubscribeToken(email, 60_000);
  const stored = await db('newsletter_verification_tokens').where({ token_hash: hashNewsletterToken(token) }).first();
  assert.ok(stored);
  assert.notEqual(stored.token_hash, token);

  const old = await issueBroadcastUnsubscribeToken(email, -3 * 24 * 60 * 60 * 1000);
  await purgeExpiredNewsletterTokens();
  assert.equal(await db('newsletter_verification_tokens').where({ token_hash: hashNewsletterToken(old) }).first(), undefined);
  assert.ok(await db('newsletter_verification_tokens').where({ token_hash: hashNewsletterToken(token) }).first());
});
