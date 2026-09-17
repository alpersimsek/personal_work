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
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    if (response.status === 401) return { username: '', isLoggedIn: false };
    if (!response.ok) throw new Error('Oturum kontrol edilemedi.');
    const data = await response.json();
    return { username: data.username, isLoggedIn: true };
  },

  async logout(): Promise<void> {
    const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    if (!response.ok) throw new Error('Çıkış yapılamadı.');
  },
};
