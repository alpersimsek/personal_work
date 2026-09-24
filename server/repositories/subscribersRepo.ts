import { db } from '../db/knex.js';

export interface SubscriberRow {
  id: number;
  name: string;
  email: string;
  consent_given: boolean;
  consent_at: string;
  consent_version: string | null;
  unsubscribed_at: string | null;
  created_at: string;
}

export function findByEmail(email: string): Promise<SubscriberRow | undefined> {
  return db<SubscriberRow>('subscribers').where({ email }).first();
}

export async function createSubscriber(input: { name: string; email: string; consentVersion: string }): Promise<SubscriberRow> {
  const [id] = await db('subscribers').insert({
    name: input.name,
    email: input.email,
    consent_given: true,
    consent_at: db.fn.now(),
    consent_version: input.consentVersion,
  });
  const created = await db<SubscriberRow>('subscribers').where({ id }).first();
  return created!;
}

/**
 * Marks an active subscriber as unsubscribed. The row and its consent record
 * are kept as proof; a repeat call leaves the original opt-out time alone.
 */
export async function markUnsubscribed(email: string): Promise<void> {
  await db('subscribers').where({ email }).whereNull('unsubscribed_at').update({ unsubscribed_at: db.fn.now() });
}

/** Signs a former subscriber up again, replacing the old consent with the new one. */
export async function resubscribe(id: number, input: { name: string; consentVersion: string }): Promise<SubscriberRow> {
  await db('subscribers').where({ id }).update({
    name: input.name,
    consent_given: true,
    consent_at: db.fn.now(),
    consent_version: input.consentVersion,
    unsubscribed_at: null,
  });
  const updated = await db<SubscriberRow>('subscribers').where({ id }).first();
  return updated!;
}

export async function listAll(): Promise<SubscriberRow[]> {
  return (await db<SubscriberRow>('subscribers').orderBy('created_at', 'desc'))
    .map(row => ({ ...row, consent_given: Boolean(row.consent_given) }));
}
