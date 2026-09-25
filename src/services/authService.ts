import { AdminSession } from '../types';

export const authService = {
  async login(username: string, password: string): Promise<{ success: boolean; message?: string }> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: false, message: data.error ?? 'Geçersiz kullanıcı adı veya şifre.' };
    }
    return { success: true };
  },

  async getSession(): Promise<AdminSession> {
    // /session answers 200 either way, unlike /me, so visitors get no 401 in their console.
    const response = await fetch('/api/auth/session', { credentials: 'include' });
    if (!response.ok) throw new Error('Oturum kontrol edilemedi.');
    const data = await response.json();
    return data.loggedIn ? { username: data.username, isLoggedIn: true } : { username: '', isLoggedIn: false };
  },

  /**
   * Changes the signed-in user's password. On success the server keeps this
   * session alive and signs every other one out.
   */
  async changePassword(input: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ success: boolean; message?: string }> {
    let response: Response;
    try {
      response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });
    } catch {
      return { success: false, message: 'Sunucuya ulaşamadık. İnternet bağlantınızı kontrol edip tekrar deneyin.' };
    }

    if (response.ok) return { success: true };
    if (response.status === 401) {
      return { success: false, message: 'Oturumunuz sona ermiş. Lütfen sayfayı yenileyip yeniden giriş yapın.' };
    }
    if (response.status === 429) {
      return { success: false, message: 'Kısa sürede çok fazla deneme yaptınız. Lütfen biraz bekleyip tekrar deneyin.' };
    }
    if (response.status >= 500) {
      return { success: false, message: 'Şu anda şifreniz değiştirilemedi. Lütfen birkaç dakika sonra tekrar deneyin.' };
    }
    const data = await response.json().catch(() => ({}));
    return { success: false, message: typeof data.error === 'string' ? data.error : 'Şifre değiştirilemedi. Bilgilerinizi kontrol edin.' };
  },

  async logout(): Promise<void> {
    const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    if (!response.ok) throw new Error('Çıkış yapılamadı.');
  },
};
