import { mailTransport, newsletterFrom } from './newsletterMail.js';

export interface BroadcastMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  unsubscribeUrl: string;
}

/**
 * - `transient`: try this recipient again later.
 * - `permanent`: this recipient will never work (mailbox missing); stop trying.
 * - `halt`: nothing can be sent right now (quota, authentication, missing
 *   configuration). Leave every recipient pending.
 */
export type SendFailureKind = 'transient' | 'permanent' | 'halt';

export class NewsletterSendError extends Error {
  constructor(readonly kind: SendFailureKind, message: string) {
    super(message);
    this.name = 'NewsletterSendError';
  }
}

export interface NewsletterSender {
  send(message: BroadcastMessage): Promise<void>;
}

const QUOTA_PATTERN = /(daily user sending limit|sending limit|rate limit|quota|too many|5\.4\.5|4\.5\.3|4\.7\.0)/i;

export function classifySmtpError(error: unknown): SendFailureKind {
  const details = (error ?? {}) as { code?: unknown; responseCode?: unknown; response?: unknown; message?: unknown };
  const text = `${String(details.response ?? '')} ${String(details.message ?? '')}`;
  if (details.code === 'EAUTH' || details.responseCode === 535 || QUOTA_PATTERN.test(text)) return 'halt';
  if (typeof details.responseCode === 'number' && details.responseCode >= 500) return 'permanent';
  return 'transient';
}

/** A short reason that is safe to store and log: no address, no raw SMTP text. */
function reasonFor(kind: SendFailureKind, error: unknown): string {
  const code = (error as { responseCode?: unknown } | undefined)?.responseCode;
  return `${kind}${typeof code === 'number' ? ` (smtp ${code})` : ''}`;
}

export class GmailNewsletterSender implements NewsletterSender {
  async send(message: BroadcastMessage): Promise<void> {
    let mailer: ReturnType<typeof mailTransport>;
    let from: string;
    try {
      mailer = mailTransport();
      from = newsletterFrom();
    } catch {
      throw new NewsletterSendError('halt', 'mail configuration is missing or invalid');
    }
    try {
      await mailer.sendMail({
        from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        headers: { 'List-Unsubscribe': `<${message.unsubscribeUrl}>` },
      });
    } catch (error) {
      const kind = classifySmtpError(error);
      throw new NewsletterSendError(kind, reasonFor(kind, error));
    }
  }
}
