import { createHash, randomBytes } from 'node:crypto';
import type { Knex } from 'knex';
import { db, withDbTransaction } from '../db/knex.js';

export type NewsletterTokenPurpose = 'confirm' | 'unsubscribe';
const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 30 * 60 * 1000;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export interface NewsletterTokenInput {
  purpose: NewsletterTokenPurpose;
  email: string;
  name?: string;
  consentVersion?: string;
}

export interface NewsletterTokenRow {
  id: number;
  token_hash: string;
  purpose: NewsletterTokenPurpose;
  email: string;
  name: string | null;
  consent_version: string | null;
  expires_at: Date | string;
  consumed_at: Date | string | null;
}

export function hashNewsletterToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function issueNewsletterToken(input: NewsletterTokenInput): Promise<string | null> {
  return withDbTransaction(async trx => {
    const pending = await trx('newsletter_verification_tokens')
      .where({ email: input.email, purpose: input.purpose, broadcast: false })
      .whereNull('consumed_at')
      .where('expires_at', '>', trx.fn.now())
      .whereRaw('created_at > DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 MINUTE)')
      .forUpdate()
      .first('id');
    if (pending) return null;

    const token = randomBytes(TOKEN_BYTES).toString('base64url');
    await trx('newsletter_verification_tokens')
      .where({ email: input.email, purpose: input.purpose, broadcast: false })
      .whereNull('consumed_at')
      .update({ consumed_at: trx.fn.now() });
    await trx('newsletter_verification_tokens').insert({
      token_hash: hashNewsletterToken(token),
      purpose: input.purpose,
      email: input.email,
      name: input.name ?? null,
      consent_version: input.consentVersion ?? null,
      // Database clock, matching the NOW() comparisons below; a JS Date skews by
      // any host/session timezone difference.
      expires_at: trx.raw('DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? SECOND)', [TOKEN_TTL_MS / 1000]),
    });
    await trx('newsletter_verification_tokens')
      .whereRaw('expires_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY)')
      .delete();
    return token;
  });
}

export async function discardNewsletterToken(token: string): Promise<void> {
  if (!TOKEN_PATTERN.test(token)) return;
  await db('newsletter_verification_tokens')
    .where({ token_hash: hashNewsletterToken(token) })
    .whereNull('consumed_at')
    .update({ consumed_at: db.fn.now() });
}

export async function consumeNewsletterToken(
  token: string,
  purpose: NewsletterTokenPurpose,
  apply: (row: NewsletterTokenRow, trx: Knex.Transaction) => Promise<void>,
): Promise<boolean> {
  if (!TOKEN_PATTERN.test(token)) return false;
  return withDbTransaction(async trx => {
    const row = await trx<NewsletterTokenRow>('newsletter_verification_tokens')
      .where({ token_hash: hashNewsletterToken(token), purpose })
      .whereNull('consumed_at')
      .where('expires_at', '>', trx.fn.now())
      .forUpdate()
      .first();
    if (!row) return false;
    const consumed = await trx('newsletter_verification_tokens')
      .where({ id: row.id })
      .whereNull('consumed_at')
      .update({ consumed_at: trx.fn.now() });
    if (consumed !== 1) return false;
    await apply(row, trx);
    return true;
  });
}

/**
 * A long-lived unsubscribe token for a broadcast email.
 *
 * Unlike `issueNewsletterToken` it neither rate-limits nor invalidates other
 * tokens, so every newsletter a person has received keeps a working link. It
 * is marked `broadcast` so form-driven issuance ignores it in turn.
 */
export async function issueBroadcastUnsubscribeToken(email: string, ttlMs: number): Promise<string> {
  const token = randomBytes(TOKEN_BYTES).toString('base64url');
  await db('newsletter_verification_tokens').insert({
    token_hash: hashNewsletterToken(token),
    purpose: 'unsubscribe',
    email,
    broadcast: true,
    // Computed on the database clock: consumeNewsletterToken compares against
    // the database NOW(), so a JS Date would skew by any driver/session
    // timezone difference.
    expires_at: db.raw('DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? SECOND)', [Math.round(ttlMs / 1000)]),
  });
  return token;
}

export async function purgeExpiredNewsletterTokens(): Promise<void> {
  await db('newsletter_verification_tokens')
    .whereRaw('expires_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY)')
    .delete();
}
