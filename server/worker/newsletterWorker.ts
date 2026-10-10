import { newsletterBroadcastConfig } from '../config/newsletterBroadcast.js';
import {
  describeErrorSafely, runBroadcastTick, type HaltReason, type TickResult,
} from '../services/newsletterBroadcast.js';
import { GmailNewsletterSender, type NewsletterSender } from '../services/newsletterSender.js';

const TICK_MS = 60_000;
const HALT_PAUSE_MS = 60 * 60_000;

const HALT_LABELS: Record<HaltReason, string> = {
  send: 'send-halt',
  transient: 'consecutive-transient',
  configuration: 'configuration',
};

function summary(result: TickResult): string {
  const counts = `sent ${result.sent}, failed ${result.failed}, skipped ${result.skipped}`;
  return result.halted ? `${counts}; halted: ${HALT_LABELS[result.haltReason ?? 'send']}` : counts;
}

/**
 * Builds one worker tick: it never overlaps itself, pauses for an hour after a
 * halt, and logs only counts and error names (never messages, which can hold
 * recipient addresses).
 */
export function createNewsletterTick(
  sender: NewsletterSender,
  runTick: typeof runBroadcastTick = runBroadcastTick,
): () => Promise<void> {
  let running = false;
  let pausedUntil = 0;

  return async () => {
    if (running || Date.now() < pausedUntil) return;
    running = true;
    try {
      const result = await runTick({ sender });
      if (result.sent || result.failed || result.skipped || result.halted) {
        console.log(`Newsletter: ${summary(result)}`);
      }
      if (result.halted) {
        pausedUntil = Date.now() + HALT_PAUSE_MS;
        console.error('Newsletter sending paused for one hour.');
      }
    } catch (error) {
      console.error(`Newsletter tick failed: ${describeErrorSafely(error)}`);
    } finally {
      running = false;
    }
  };
}

/**
 * Starts the queue timer and returns a function that stops it. Does nothing
 * under tests or when the worker is disabled.
 */
export function startNewsletterWorker(sender: NewsletterSender = new GmailNewsletterSender()): () => void {
  if (process.env.NODE_ENV === 'test' || !newsletterBroadcastConfig().workerEnabled) return () => {};

  const tick = createNewsletterTick(sender);
  const timer = setInterval(() => void tick(), TICK_MS);
  timer.unref();
  return () => clearInterval(timer);
}
