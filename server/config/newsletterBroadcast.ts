export interface NewsletterBroadcastConfig {
  workerEnabled: boolean;
  delayMinutes: number;
  batchSize: number;
  dailyCap: number;
  unsubscribeTtlDays: number;
}

function positiveInteger(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * On by default only in production, so a development server never sends to
 * real subscribers; `NEWSLETTER_WORKER_ENABLED=true|false` overrides it.
 */
function workerEnabled(): boolean {
  const override = process.env.NEWSLETTER_WORKER_ENABLED?.trim().toLowerCase();
  if (override === 'true') return true;
  if (override === 'false') return false;
  return process.env.NODE_ENV === 'production';
}

/** Read at call time so tests (and a restart-free env change) take effect. */
export function newsletterBroadcastConfig(): NewsletterBroadcastConfig {
  return {
    workerEnabled: workerEnabled(),
    delayMinutes: positiveInteger('NEWSLETTER_DELAY_MINUTES', 10),
    batchSize: positiveInteger('NEWSLETTER_BATCH_SIZE', 20),
    dailyCap: positiveInteger('NEWSLETTER_DAILY_CAP', 400),
    unsubscribeTtlDays: positiveInteger('NEWSLETTER_UNSUBSCRIBE_TTL_DAYS', 365),
  };
}
