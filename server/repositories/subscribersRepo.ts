import { db } from '../db/knex.js';
import type { Knex } from 'knex';

export interface SubscriberRow {
  id: number;
  name: string;
  email: string;
  consent_given: boolean;
  consent_at: string;
  consent_version: string | null;
  email_verified_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
}

export async function listAll(): Promise<SubscriberRow[]> {
  return (await db<SubscriberRow>('subscribers').orderBy('created_at', 'desc'))
    .map(row => ({ ...row, consent_given: Boolean(row.consent_given) }));
}

export async function confirmSubscriber(
  trx: Knex.Transaction,
  input: { name: string; email: string; consentVersion: string },
): Promise<void> {
  const existing = await trx<SubscriberRow>('subscribers').where({ email: input.email }).forUpdate().first();
  const values = {
    name: input.name,
    consent_given: true,
    consent_at: trx.fn.now(),
    consent_version: input.consentVersion,
    email_verified_at: trx.fn.now(),
    unsubscribed_at: null,
  };
  if (existing) await trx('subscribers').where({ id: existing.id }).update(values);
  else await trx('subscribers').insert({ email: input.email, ...values });
}

export async function unsubscribeSubscriber(trx: Knex.Transaction, email: string): Promise<void> {
  await trx('subscribers').where({ email }).whereNull('unsubscribed_at').update({ unsubscribed_at: trx.fn.now() });
}
