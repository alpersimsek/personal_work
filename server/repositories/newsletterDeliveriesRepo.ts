import { db, withDbTransaction } from '../db/knex.js';

export type DeliveryStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'skipped';

export interface DeliveryRow {
  id: number;
  post_id: number;
  subscriber_id: number;
  status: DeliveryStatus;
  attempts: number;
  last_error: string | null;
  sent_at: string | null;
}

const STALE_SENDING_MINUTES = 10;

export function cancelPendingDeliveries(postId: number): Promise<number> {
  return db('newsletter_deliveries')
    .where({ post_id: postId })
    .whereIn('status', ['pending', 'sending'])
    .update({ status: 'skipped', last_error: 'cancelled', updated_at: db.fn.now() });
}

/**
 * Turns a due post into one pending delivery per verified, subscribed address.
 * The post row is locked and `newsletter_sent_at` is set in the same
 * transaction, so two ticks can never fan the same post out twice.
 */
export async function fanOutDeliveries(postId: number): Promise<boolean> {
  return withDbTransaction(async trx => {
    const post = await trx('blog_posts').where({ id: postId }).forUpdate()
      .first('id', 'published', 'newsletter_enabled', 'newsletter_sent_at');
    if (!post || post.newsletter_sent_at || !post.published || !post.newsletter_enabled) return false;
    await trx.raw(
      `INSERT IGNORE INTO newsletter_deliveries (post_id, subscriber_id, status)
       SELECT ?, id, 'pending' FROM subscribers
       WHERE email_verified_at IS NOT NULL AND unsubscribed_at IS NULL`,
      [postId],
    );
    await trx('blog_posts').where({ id: postId }).update({ newsletter_sent_at: trx.fn.now() });
    return true;
  });
}

export async function listDuePostIds(onlyPostId?: number): Promise<number[]> {
  const query = db('blog_posts')
    .where({ published: true, newsletter_enabled: true })
    .whereNull('newsletter_sent_at')
    .whereNotNull('newsletter_scheduled_at')
    .where('newsletter_scheduled_at', '<=', db.fn.now());
  if (onlyPostId !== undefined) query.where({ id: onlyPostId });
  return (await query.select('id')).map(row => Number(row.id));
}

/**
 * Takes the least-attempted, oldest pending delivery. Ordering by attempts
 * first lets a recipient that keeps halting sink behind fresh ones instead of
 * blocking the queue. The conditional update is the claim: if another tick got
 * there first it affects no row and we try the next one.
 */
export async function claimNextDelivery(onlyPostId?: number, excludeIds: number[] = []): Promise<DeliveryRow | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const query = db<DeliveryRow>('newsletter_deliveries')
      .where({ status: 'pending' })
      .orderBy([{ column: 'attempts', order: 'asc' }, { column: 'id', order: 'asc' }]);
    if (onlyPostId !== undefined) query.where({ post_id: onlyPostId });
    if (excludeIds.length > 0) query.whereNotIn('id', excludeIds);
    const candidate = await query.first();
    if (!candidate) return null;
    const claimed = await db('newsletter_deliveries')
      .where({ id: candidate.id, status: 'pending' })
      .update({ status: 'sending', updated_at: db.fn.now() });
    if (claimed === 1) return candidate;
  }
  return null;
}

export const markSent = (id: number) =>
  db('newsletter_deliveries').where({ id })
    .update({ status: 'sent', sent_at: db.fn.now(), last_error: null, updated_at: db.fn.now() });

export const markSkipped = (id: number, reason: string) =>
  db('newsletter_deliveries').where({ id })
    .update({ status: 'skipped', last_error: reason.slice(0, 255), updated_at: db.fn.now() });

export const markRetry = (id: number, reason: string) =>
  db('newsletter_deliveries').where({ id })
    .update({ status: 'pending', attempts: db.raw('attempts + 1'), last_error: reason.slice(0, 255), updated_at: db.fn.now() });

export const markFailed = (id: number, reason: string) =>
  db('newsletter_deliveries').where({ id })
    .update({ status: 'failed', attempts: db.raw('attempts + 1'), last_error: reason.slice(0, 255), updated_at: db.fn.now() });

/** Puts a claimed delivery back without counting an attempt (used when sending halts). */
export const releaseDelivery = (id: number) =>
  db('newsletter_deliveries').where({ id }).update({ status: 'pending', updated_at: db.fn.now() });

/**
 * Puts a claimed delivery back and counts an attempt, so that when sending
 * halts repeatedly on the same recipient it sinks behind fresher deliveries.
 */
export const deferDelivery = (id: number): Promise<number> =>
  db('newsletter_deliveries').where({ id }).update({
    status: 'pending',
    attempts: db.raw('attempts + 1'),
    last_error: 'paused',
    updated_at: db.fn.now(),
  });

/** A crash between claim and result would leave `sending` rows forever. */
export async function reclaimStaleDeliveries(): Promise<void> {
  await db('newsletter_deliveries')
    .where({ status: 'sending' })
    .whereRaw('updated_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)', [STALE_SENDING_MINUTES])
    .update({ status: 'pending', updated_at: db.fn.now() });
}

export async function countSentInLast24Hours(): Promise<number> {
  const row = await db('newsletter_deliveries')
    .where({ status: 'sent' })
    .whereRaw('sent_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)')
    .count<{ count: string }[]>({ count: 'id' })
    .first();
  return Number(row?.count ?? 0);
}

export async function deliveryCounts(postId: number): Promise<Record<DeliveryStatus, number>> {
  const counts: Record<DeliveryStatus, number> = { pending: 0, sending: 0, sent: 0, failed: 0, skipped: 0 };
  const rows = await db('newsletter_deliveries').where({ post_id: postId })
    .select('status').count<{ status: DeliveryStatus; count: string }[]>({ count: 'id' }).groupBy('status');
  for (const row of rows) counts[row.status] = Number(row.count);
  return counts;
}

export function requeueFailedDeliveries(postId: number): Promise<number> {
  return db('newsletter_deliveries').where({ post_id: postId, status: 'failed' })
    .update({ status: 'pending', attempts: 0, last_error: null, updated_at: db.fn.now() });
}
