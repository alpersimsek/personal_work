import { AdminSession } from '../types';

// Pre-computed SHA-256 hash of "UlkuTe2391!"
// Input: "UlkuTe2391!" -> SHA-256 Hex: ed95b6a7194f4a3e20eebcd70e0600a9faacffdfd48f95c52c6575971485ee40
const TARGET_USERNAME = 'terguner';
const TARGET_PASSWORD_SHA256 = 'ed95b6a7194f4a3e20eebcd70e0600a9faacffdfd48f95c52c6575971485ee40';
const SESSION_KEY = 'tugba_admin_session';

/**
 * Computes SHA-256 hash of a plain text password using Web Crypto API
 */
export async function hashPasswordSHA256(password: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback (for older/non-subtle environments)
  return password;
}

export const authService = {
  /**
   * Authenticate admin user terguner with SHA-256 password verification
   */
  async login(username: string, plainPassword: string): Promise<{ success: boolean; message?: string }> {
    const trimmedUser = (username || '').trim().toLowerCase();
    const trimmedPass = (plainPassword || '').trim();

    if (trimmedUser !== TARGET_USERNAME.toLowerCase()) {
      return { success: false, message: 'Geçersiz kullanıcı adı veya şifre.' };
    }

    const hashedInput = await hashPasswordSHA256(trimmedPass);
    const isDirectMatch = trimmedPass === 'UlkuTe2391!';
    const isHashMatch = hashedInput.toLowerCase() === TARGET_PASSWORD_SHA256.toLowerCase();

    if (!isDirectMatch && !isHashMatch) {
      return { success: false, message: 'Geçersiz kullanıcı adı veya şifre.' };
    }

    // Login successful
    const session: AdminSession = {
      username: TARGET_USERNAME,
      isLoggedIn: true,
      loginTime: new Date().toISOString(),
    };

    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // Ignore quota errors
    }

    return { success: true };
  },

  /**
   * Checks current admin session status
   */
  getSession(): AdminSession {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AdminSession;
        if (parsed.isLoggedIn && parsed.username === TARGET_USERNAME) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return { username: '', isLoggedIn: false };
  },

  /**
   * Logs out admin user
   */
  logout(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore
    }
  },
};
