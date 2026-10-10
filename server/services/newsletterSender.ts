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

/** `550 5.1.1 ...` or `550-5.1.1 ...`: the reply code and enhanced status code at the start of the reply. */
// Followed by whitespace or the end, so an address such as `5.7.0@x` never counts.
const ENHANCED_CODE = /^(\d{3})[ -](\d)\.(\d{1,3})\.(\d{1,3})(?=\s|$)/;
const REPLY_CODE = /^(\d{3})(?=[\s-]|$)/;

// Free-text fallbacks, used only on sanitised text (see `sanitise`).
const DAILY_LIMIT_PATTERN = /daily user sending limit/i;
const SENDER_TEXT_PATTERN = /(sending limit|rate limit|quota|too many|authentication required|app password)/i;
const RECIPIENT_PATTERN = /(no such user|user unknown|does not exist|mailbox (unavailable|not found)|invalid (recipient|address))/i;

/**
 * SMTP replies often echo the recipient address, and a subscriber chooses that
 * text (`quota@...`, `5.7.0@...`). Remove anything in angle brackets, quoted
 * local parts and every token containing `@` before matching free text.
 */
function sanitise(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/"[^"]*"@\S*/g, ' ')
    .split(/\s+/)
    .filter(token => !token.includes('@'))
    .join(' ');
}

/**
 * Precedence, first match wins:
 * 1. EAUTH or reply 530/534/535 -> `pause` (our credentials).
 * 2. Enhanced 5.1.x, or (without an enhanced code) 550/551/553 with recipient
 *    wording -> `permanent`.
 * 3. Enhanced 4.2.2 -> `transient`, 5.2.2 -> `permanent` (mailbox full).
 * 4. Quota or rate limits: enhanced 5.4.5, 4.5.3, 4.7.x, or "daily user
 *    sending limit" -> `pause`.
 * 5. Any other enhanced 5.7.x (sender policy) -> `pause`.
 * 6. Only when there is no enhanced code: sender wording such as "quota",
 *    "too many" or "authentication required" -> `pause`.
 * 7. Any other 5xx -> `halt` (not recipient-specific, but counts against it).
 * 8. Everything else -> `transient`.
 * Structural codes are preferred; free text is only ever matched after
 * `sanitise`, so a recipient address cannot steer the result.
 */
export function classifySmtpError(error: unknown): SendFailureKind {
  const details = (error ?? {}) as { code?: unknown; responseCode?: unknown; response?: unknown; message?: unknown };
  const response = String(details.response ?? '').trimStart();
  const text = sanitise(`${response} ${String(details.message ?? '')}`);
  const enhanced = ENHANCED_CODE.exec(response);
  const parsedReply = enhanced?.[1] ?? REPLY_CODE.exec(response)?.[1];
  const replyCode = typeof details.responseCode === 'number' ? details.responseCode
    : parsedReply ? Number(parsedReply) : undefined;
  const [statusClass, subject, detail] = enhanced ? enhanced.slice(2).map(Number) : [];

  if (details.code === 'EAUTH' || replyCode === 530 || replyCode === 534 || replyCode === 535) return 'pause';
  if (enhanced ? statusClass === 5 && subject === 1
    : (replyCode === 550 || replyCode === 551 || replyCode === 553) && RECIPIENT_PATTERN.test(text)) return 'permanent';
  if (enhanced && subject === 2 && detail === 2) return statusClass === 5 ? 'permanent' : 'transient';
  const quota = enhanced
    ? (statusClass === 5 && subject === 4 && detail === 5) || (statusClass === 4 && subject === 5 && detail === 3)
      || (statusClass === 4 && subject === 7)
    : false;
  if (quota || DAILY_LIMIT_PATTERN.test(text)) return 'pause';
  if (enhanced && statusClass === 5 && subject === 7) return 'pause';
  if (!enhanced && SENDER_TEXT_PATTERN.test(text)) return 'pause';
  if (replyCode !== undefined && replyCode >= 500) return 'halt';
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
