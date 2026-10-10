import { newsletterBroadcastConfig } from '../config/newsletterBroadcast.js';
import { runBroadcastTick } from '../services/newsletterBroadcast.js';
import { GmailNewsletterSender, type NewsletterSender } from '../services/newsletterSender.js';

const TICK_MS = 60_000;
const HALT_PAUSE_MS = 60 * 60_000;

/**
 * Starts the queue timer and returns a function that stops it. Does nothing
 * under tests or when `NEWSLETTER_WORKER_ENABLED=false`.
 */
export function startNewsletterWorker(sender: NewsletterSender = new GmailNewsletterSender()): () => void {
  if (process.env.NODE_ENV === 'test' || !newsletterBroadcastConfig().workerEnabled) return () => {};

  let running = false;
  let pausedUntil = 0;

  const tick = async () => {
    if (running || Date.now() < pausedUntil) return;
    running = true;
    try {
      const result = await runBroadcastTick({ sender });
      if (result.sent || result.failed || result.skipped) {
        console.log(`Newsletter: sent ${result.sent}, failed ${result.failed}, skipped ${result.skipped}`);
      }
      if (result.halted) {
        pausedUntil = Date.now() + HALT_PAUSE_MS;
        console.error('Newsletter sending paused for one hour (quota, authentication or configuration).');
      }
    } catch (error) {
      // Only the message: a NewsletterSendError cause may contain an address.
      console.error('Newsletter tick failed:', error instanceof Error ? error.message : 'unknown error');
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => void tick(), TICK_MS);
  timer.unref();
  return () => clearInterval(timer);
}
