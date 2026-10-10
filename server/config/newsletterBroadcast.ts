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

/** Read at call time so tests (and a restart-free env change) take effect. */
export function newsletterBroadcastConfig(): NewsletterBroadcastConfig {
  return {
    workerEnabled: process.env.NEWSLETTER_WORKER_ENABLED?.trim().toLowerCase() !== 'false',
    delayMinutes: positiveInteger('NEWSLETTER_DELAY_MINUTES', 10),
    batchSize: positiveInteger('NEWSLETTER_BATCH_SIZE', 20),
    dailyCap: positiveInteger('NEWSLETTER_DAILY_CAP', 400),
    unsubscribeTtlDays: positiveInteger('NEWSLETTER_UNSUBSCRIBE_TTL_DAYS', 30),
  };
}
