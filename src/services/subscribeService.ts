export interface SubscribeInput {
  name: string;
  email: string;
  consent: boolean;
  honeypot?: string;
}

export interface SubscribeResult {
  success: boolean;
  message?: string;
}

export async function subscribe(input: SubscribeInput): Promise<SubscribeResult> {
  const response = await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (response.ok) {
    return { success: true };
  }

  const data = await response.json().catch(() => ({}));
  if (response.status === 409) {
    return { success: false, message: data.error || 'Bu e-posta adresi zaten kayıtlı.' };
  }
  return { success: false, message: data.error || 'Kaydınız şu anda alınamadı. Lütfen daha sonra tekrar deneyin.' };
}
