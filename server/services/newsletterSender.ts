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
 * - `pause`: a sender-level problem that says nothing about the recipient
 *   (quota, authentication, 4.7.x/5.7.x policy, missing configuration). Stop
 *   sending and leave the recipient untouched.
 * - `halt`: any other 5xx that is not recipient-specific. Stop sending, but
 *   count it against the recipient in case it really is about that address.
 */
export type SendFailureKind = 'transient' | 'permanent' | 'halt' | 'pause';

export class NewsletterSendError extends Error {
  constructor(readonly kind: SendFailureKind, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'NewsletterSendError';
  }
}

export interface NewsletterSender {
  send(message: BroadcastMessage): Promise<void>;
}

const QUOTA_PATTERN = /(daily user sending limit|sending limit|rate limit|quota|too many|5\.4\.5|4\.5\.3|4\.7\.0)/i;

const SENDER_LEVEL_PATTERN = /(\b[45]\.7\.\d+\b|authentication required|app password)/i;
const RECIPIENT_PATTERN = /(\b5\.1\.\d+\b|no such user|user unknown|does not exist|mailbox (unavailable|not found)|invalid (recipient|address))/i;

/**
 * `permanent` is reserved for rejections that are specific to the recipient.
 * Sender-level problems pause the run without touching the recipient; any
 * other 5xx halts the run and counts against the recipient.
 */
export function classifySmtpError(error: unknown): SendFailureKind {
  const details = (error ?? {}) as { code?: unknown; responseCode?: unknown; response?: unknown; message?: unknown };
  const text = `${String(details.response ?? '')} ${String(details.message ?? '')}`;
  const responseCode = typeof details.responseCode === 'number' ? details.responseCode : undefined;
  const authFailure = details.code === 'EAUTH'
    || (details.code === 'EENVELOPE' && /auth/i.test(text))
    || responseCode === 530 || responseCode === 534 || responseCode === 535;
  if (authFailure || QUOTA_PATTERN.test(text) || SENDER_LEVEL_PATTERN.test(text)) return 'pause';
  if (responseCode !== undefined && responseCode >= 500) {
    return RECIPIENT_PATTERN.test(text) ? 'permanent' : 'halt';
  }
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
    } catch (error) {
      throw new NewsletterSendError('pause', 'mail configuration is missing or invalid', { cause: error });
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
      throw new NewsletterSendError(kind, reasonFor(kind, error), { cause: error });
    }
  }
}
