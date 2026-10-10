import { db } from '../db/knex.js';
import { findById } from '../repositories/postsRepo.js';
import type { SubscriberRow } from '../repositories/subscribersRepo.js';
import {
  claimNextDelivery, countSentInLast24Hours, deferDelivery, fanOutDeliveries, listDuePostIds, markFailed,
  markRetry, markSent, markSkipped, reclaimStaleDeliveries, type DeliveryRow,
} from '../repositories/newsletterDeliveriesRepo.js';
import { newsletterBroadcastConfig } from '../config/newsletterBroadcast.js';
import { issueBroadcastUnsubscribeToken, purgeExpiredNewsletterTokens } from './newsletterTokens.js';
import { publicOrigin } from './newsletterMail.js';
import { renderBroadcast, unsubscribeUrlFor } from './newsletterBroadcastMail.js';
import { NewsletterSendError, type NewsletterSender } from './newsletterSender.js';

const MAX_ATTEMPTS = 3;
/** A delivery that halted this many times is likely a rejection specific to its recipient. */
const MAX_HALT_ATTEMPTS = 6;

export interface TickResult {
  sent: number;
  failed: number;
  skipped: number;
  halted: boolean;
}

type Outcome = 'sent' | 'skipped' | 'failed' | 'retry' | 'halt';

/**
 * Records a failed send. Only `failure.message` is stored: `cause` may hold the
 * raw SMTP response, which can include the recipient address.
 */
async function recordFailure(delivery: DeliveryRow, failure: NewsletterSendError): Promise<Outcome> {
  if (failure.kind === 'halt') {
    // Deferring (rather than releasing) counts an attempt, so a recipient that
    // keeps halting sinks behind fresh ones instead of blocking the queue.
    if (delivery.attempts + 1 >= MAX_HALT_ATTEMPTS) await markFailed(delivery.id, 'halt-repeated');
    else await deferDelivery(delivery.id);
    return 'halt';
  }
  if (failure.kind === 'permanent' || delivery.attempts + 1 >= MAX_ATTEMPTS) {
    await markFailed(delivery.id, failure.message);
    return 'failed';
  }
  await markRetry(delivery.id, failure.message);
  return 'retry';
}

async function deliver(delivery: DeliveryRow, sender: NewsletterSender, origin: string): Promise<Outcome> {
  const [post, subscriber] = await Promise.all([
    findById(delivery.post_id),
    db<SubscriberRow>('subscribers').where({ id: delivery.subscriber_id }).first(),
  ]);
  if (!post || !post.published || !post.newsletter_enabled) {
    await markSkipped(delivery.id, 'post not live');
    return 'skipped';
  }
  if (!subscriber || subscriber.unsubscribed_at || !subscriber.email_verified_at) {
    await markSkipped(delivery.id, 'not subscribed');
    return 'skipped';
  }

  const { unsubscribeTtlDays } = newsletterBroadcastConfig();
  const token = await issueBroadcastUnsubscribeToken(subscriber.email, unsubscribeTtlDays * 24 * 60 * 60 * 1000);
  const unsubscribeUrl = unsubscribeUrlFor(origin, token);
  const mail = renderBroadcast({
    post: { slug: post.slug, title: post.title, summary: post.summary, coverImage: post.cover_image },
    origin,
    unsubscribeUrl,
  });

  try {
    await sender.send({ to: subscriber.email, ...mail, unsubscribeUrl });
  } catch (error) {
    const failure = error instanceof NewsletterSendError ? error : new NewsletterSendError('transient', 'transient');
    return recordFailure(delivery, failure);
  }
  await markSent(delivery.id);
  return 'sent';
}

/**
 * One pass of the newsletter queue: fan out due posts, then send a bounded
 * batch. `postId` restricts the pass to one post (used by tests so they never
 * touch real deliveries in a shared database).
 */
export async function runBroadcastTick(deps: { sender: NewsletterSender; postId?: number }): Promise<TickResult> {
  const config = newsletterBroadcastConfig();
  const result: TickResult = { sent: 0, failed: 0, skipped: 0, halted: false };

  await reclaimStaleDeliveries();
  await purgeExpiredNewsletterTokens();
  for (const postId of await listDuePostIds(deps.postId)) await fanOutDeliveries(postId);

  let origin: string;
  try {
    origin = publicOrigin();
  } catch {
    result.halted = true;
    return result;
  }

  // A retried row goes back to pending; skip it for the rest of this pass so
  // one tick makes one attempt per delivery.
  const retried: number[] = [];
  let budget = Math.min(config.batchSize, config.dailyCap - (await countSentInLast24Hours()));
  while (budget > 0) {
    const delivery = await claimNextDelivery(deps.postId, retried);
    if (!delivery) break;
    const outcome = await deliver(delivery, deps.sender, origin);
    if (outcome === 'halt') {
      result.halted = true;
      break;
    }
    if (outcome === 'retry') {
      retried.push(delivery.id);
    } else if (outcome === 'sent') {
      result.sent += 1;
      budget -= 1;
    } else if (outcome === 'failed') {
      result.failed += 1;
    } else if (outcome === 'skipped') {
      result.skipped += 1;
    }
  }
  return result;
}
