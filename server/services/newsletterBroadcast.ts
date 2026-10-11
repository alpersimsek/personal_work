import { db } from '../db/knex.js';
import { findById } from '../repositories/postsRepo.js';
import type { SubscriberRow } from '../repositories/subscribersRepo.js';
import {
  claimNextDelivery, countSentInLast24Hours, deferDelivery, fanOutDeliveries, listDuePostIds, markFailed,
  markRetry, markSent as markDeliverySent, markSkipped, reclaimStaleDeliveries, releaseDelivery, type DeliveryRow,
} from '../repositories/newsletterDeliveriesRepo.js';
import { newsletterBroadcastConfig } from '../config/newsletterBroadcast.js';
import { issueBroadcastUnsubscribeToken, purgeExpiredNewsletterTokens } from './newsletterTokens.js';
import { publicOrigin } from './newsletterMail.js';
import { renderBroadcast, unsubscribeUrlFor } from './newsletterBroadcastMail.js';
import { NewsletterSendError, type BroadcastMessage, type NewsletterSender } from './newsletterSender.js';
import { logError } from '../logging/errorLog.js';

const MAX_ATTEMPTS = 3;
/** A delivery that halted this many times is likely a rejection specific to its recipient. */
const MAX_HALT_ATTEMPTS = 6;
/** This many transient failures in a row look like an outage, not bad addresses. */
const MAX_CONSECUTIVE_TRANSIENT = 3;

export type HaltReason = 'send' | 'transient' | 'configuration';

export interface TickResult {
  sent: number;
  failed: number;
  skipped: number;
  halted: boolean;
  haltReason?: HaltReason;
}

export interface BroadcastTickDeps {
  sender: NewsletterSender;
  /** Restricts the pass to one post, so tests never touch other deliveries. */
  postId?: number;
  /** Defaults to `issueBroadcastUnsubscribeToken`. */
  issueUnsubscribeToken?: (email: string, ttlMs: number) => Promise<string>;
  /** Defaults to the repository's `markSent`. */
  markSent?: (id: number) => Promise<unknown>;
}

type Outcome = 'sent' | 'skipped' | 'failed' | 'retry' | 'halt' | 'halt-failed';

interface DeliveryResult {
  outcome: Outcome;
  transientSendFailure: boolean;
}

/**
 * Log-safe fields for an error: its name and code only. Messages are never
 * logged because knex puts bound values (recipient addresses) in query error
 * messages, and an SMTP cause can quote the recipient too.
 */
export function errorLogFields(error: unknown): { errorClass: string; errorCode?: string | number } {
  if (!(error instanceof Error)) return { errorClass: 'unknown' };
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' || typeof code === 'number'
    ? { errorClass: error.name, errorCode: code }
    : { errorClass: error.name };
}

/** Records a failed send, storing only `failure.message`, never `cause`. */
async function recordSendFailure(delivery: DeliveryRow, failure: NewsletterSendError): Promise<DeliveryResult> {
  const transientSendFailure = failure.kind === 'transient';
  if (failure.kind === 'pause') {
    // A sender-level problem says nothing about this recipient: put the row
    // back untouched so a long outage can never fail anyone.
    await releaseDelivery(delivery.id);
    return { outcome: 'halt', transientSendFailure };
  }
  if (failure.kind === 'halt') {
    // Deferring counts an attempt, so a recipient that keeps halting sinks
    // behind fresh ones instead of blocking the queue.
    if (delivery.attempts + 1 >= MAX_HALT_ATTEMPTS) {
      await markFailed(delivery.id, 'halt-repeated');
      return { outcome: 'halt-failed', transientSendFailure };
    }
    await deferDelivery(delivery.id);
    return { outcome: 'halt', transientSendFailure };
  }
  if (failure.kind === 'permanent' || delivery.attempts + 1 >= MAX_ATTEMPTS) {
    await markFailed(delivery.id, failure.message);
    return { outcome: 'failed', transientSendFailure };
  }
  await markRetry(delivery.id, failure.message);
  return { outcome: 'retry', transientSendFailure };
}

async function recordProcessingError(delivery: DeliveryRow, error: unknown): Promise<DeliveryResult> {
  logError('newsletter_delivery_prepare_failed', { deliveryId: delivery.id, ...errorLogFields(error) });
  if (delivery.attempts + 1 >= MAX_ATTEMPTS) {
    await markFailed(delivery.id, 'processing-error');
    return { outcome: 'failed', transientSendFailure: false };
  }
  await markRetry(delivery.id, 'processing-error');
  return { outcome: 'retry', transientSendFailure: false };
}

/** Loads the post and subscriber and builds the message, or says why to skip. */
async function prepareMessage(
  delivery: DeliveryRow, deps: BroadcastTickDeps, origin: string,
): Promise<{ skip: string } | { message: BroadcastMessage }> {
  const [post, subscriber] = await Promise.all([
    findById(delivery.post_id),
    db<SubscriberRow>('subscribers').where({ id: delivery.subscriber_id }).first(),
  ]);
  if (!post || !post.published || !post.newsletter_enabled) return { skip: 'post not live' };
  if (!subscriber || subscriber.unsubscribed_at || !subscriber.email_verified_at) return { skip: 'not subscribed' };

  const issueToken = deps.issueUnsubscribeToken ?? issueBroadcastUnsubscribeToken;
  const { unsubscribeTtlDays } = newsletterBroadcastConfig();
  const token = await issueToken(subscriber.email, unsubscribeTtlDays * 24 * 60 * 60 * 1000);
  const unsubscribeUrl = unsubscribeUrlFor(origin, token);
  const mail = renderBroadcast({
    post: { slug: post.slug, title: post.title, summary: post.summary, coverImage: post.cover_image },
    origin,
    unsubscribeUrl,
  });
  return { message: { to: subscriber.email, ...mail, unsubscribeUrl } };
}

async function deliver(delivery: DeliveryRow, deps: BroadcastTickDeps, origin: string): Promise<DeliveryResult> {
  let prepared: Awaited<ReturnType<typeof prepareMessage>>;
  try {
    prepared = await prepareMessage(delivery, deps, origin);
  } catch (error) {
    return recordProcessingError(delivery, error);
  }
  if ('skip' in prepared) {
    await markSkipped(delivery.id, prepared.skip);
    return { outcome: 'skipped', transientSendFailure: false };
  }

  try {
    await deps.sender.send(prepared.message);
  } catch (error) {
    const failure = error instanceof NewsletterSendError ? error : new NewsletterSendError('transient', 'transient');
    return recordSendFailure(delivery, failure);
  }
  // Outside the try: if recording fails, the error ends the tick and the row
  // stays `sending` (later failed as interrupted) instead of being re-sent.
  await (deps.markSent ?? markDeliverySent)(delivery.id);
  return { outcome: 'sent', transientSendFailure: false };
}

/**
 * One pass of the newsletter queue: fan out due posts, then make a bounded
 * number of send attempts. Every attempt (sent, failed or retried) uses one
 * unit of the batch and daily budget; skipped deliveries do not.
 */
export async function runBroadcastTick(deps: BroadcastTickDeps): Promise<TickResult> {
  const config = newsletterBroadcastConfig();
  const result: TickResult = { sent: 0, failed: 0, skipped: 0, halted: false };
  const halt = (reason: HaltReason) => {
    result.halted = true;
    result.haltReason = reason;
    return result;
  };

  await reclaimStaleDeliveries();
  await purgeExpiredNewsletterTokens();
  for (const postId of await listDuePostIds(deps.postId)) await fanOutDeliveries(postId);

  let origin: string;
  try {
    origin = publicOrigin();
  } catch {
    return halt('configuration');
  }

  // A retried row goes back to pending; skip it for the rest of this pass so
  // one tick makes one attempt per delivery.
  const retried: number[] = [];
  let consecutiveTransient = 0;
  let budget = Math.min(config.batchSize, config.dailyCap - (await countSentInLast24Hours()));
  while (budget > 0) {
    const delivery = await claimNextDelivery(deps.postId, retried);
    if (!delivery) break;
    const { outcome, transientSendFailure } = await deliver(delivery, deps, origin);
    if (outcome === 'skipped') {
      result.skipped += 1;
      continue;
    }
    if (outcome === 'halt' || outcome === 'halt-failed') {
      if (outcome === 'halt-failed') result.failed += 1;
      return halt('send');
    }
    budget -= 1;
    if (outcome === 'sent') result.sent += 1;
    else if (outcome === 'failed') result.failed += 1;
    else retried.push(delivery.id);

    consecutiveTransient = transientSendFailure ? consecutiveTransient + 1 : outcome === 'sent' ? 0 : consecutiveTransient;
    if (consecutiveTransient >= MAX_CONSECUTIVE_TRANSIENT) return halt('transient');
  }
  return result;
}
