import { DATA_CONTROLLER } from '../legal/kvkk';

export interface SubscribeInput {
  name: string;
  email: string;
  consent: boolean;
  /** Version of the notice the person agreed to; see src/legal/kvkk.ts. */
  consentVersion: string;
  honeypot?: string;
}

export interface SubscribeResult {
  success: boolean;
  message?: string;
}

const NETWORK_ERROR = 'Sunucuya ulaşamadık. İnternet bağlantınızı kontrol edip tekrar deneyin.';
const TOO_MANY_REQUESTS = 'Kısa sürede çok fazla deneme yaptınız. Lütfen biraz bekleyip tekrar deneyin.';
const SERVER_ERROR = `Şu anda işleminizi tamamlayamadık. Lütfen birkaç dakika sonra tekrar deneyin; sorun sürerse ${DATA_CONTROLLER.email} adresine yazabilirsiniz.`;

/** Loose on purpose: catches typos before a request, while the server has the final say. */
export const isPlausibleEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

async function postJson(url: string, body: unknown): Promise<Response | null> {
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return null;
  }
}

/** Turns a failed response into a sentence a visitor can act on. */
async function failureMessage(response: Response, fallback: string): Promise<string> {
  if (response.status === 429) return TOO_MANY_REQUESTS;
  if (response.status >= 500) return SERVER_ERROR;
  const data = await response.json().catch(() => ({}));
  return typeof data.error === 'string' && data.error ? data.error : fallback;
}

export async function subscribe(input: SubscribeInput): Promise<SubscribeResult> {
  const response = await postJson('/api/subscribe', input);
  if (!response) return { success: false, message: NETWORK_ERROR };
  if (response.ok) return { success: true };
  return {
    success: false,
    message: await failureMessage(response, 'Kaydınız şu anda alınamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.'),
  };
}

/**
 * Takes an address off the newsletter.
 *
 * Succeeds whether or not the address was on the list, so the answer never
 * reveals who is subscribed.
 */
export async function unsubscribe(email: string): Promise<SubscribeResult> {
  const response = await postJson('/api/subscribe/unsubscribe', { email });
  if (!response) return { success: false, message: NETWORK_ERROR };
  if (response.ok) return { success: true };
  return {
    success: false,
    message: await failureMessage(response, 'E-posta adresi geçerli görünmüyor. Lütfen kontrol edip tekrar deneyin.'),
  };
}
