import { db } from '../db/knex.js';

export interface SubscriberRow {
  id: number;
  name: string;
  email: string;
  consent_given: boolean;
  consent_at: string;
  unsubscribed_at: string | null;
  created_at: string;
}

export function findByEmail(email: string): Promise<SubscriberRow | undefined> {
  return db<SubscriberRow>('subscribers').where({ email }).first();
}

export async function createSubscriber(input: { name: string; email: string }): Promise<SubscriberRow> {
  const [id] = await db('subscribers').insert({
    name: input.name,
    email: input.email,
    consent_given: true,
    consent_at: db.fn.now(),
  });
  const created = await db<SubscriberRow>('subscribers').where({ id }).first();
  return created!;
}

export async function listAll(): Promise<SubscriberRow[]> {
  return (await db<SubscriberRow>('subscribers').orderBy('created_at', 'desc'))
    .map(row => ({ ...row, consent_given: Boolean(row.consent_given) }));
}
