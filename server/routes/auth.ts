import { Router } from 'express';
import { z } from 'zod';
import { findByUsername, findById, bumpSessionVersion, changePassword } from '../repositories/usersRepo.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { adminPasswordProblem } from '../utils/adminPassword.js';
import { signSession, verifySession } from '../utils/jwt.js';
import {
  sessionCookieName,
  sessionCookieOptions,
  SESSION_COOKIE_MAX_AGE_MS,
} from '../utils/sessionCookie.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { changePasswordRateLimit, loginRateLimit } from '../middleware/rateLimit.js';
import { HttpError } from '../middleware/errorHandler.js';

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
  confirmPassword: z.string().min(1),
});

export const authRouter = Router();

// Session state must never be stored by a browser or a shared cache.
authRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

authRouter.post('/login', loginRateLimit, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Kullanıcı adı ve şifre gereklidir.');
  }

  const user = await findByUsername(parsed.data.username.toLowerCase());
  const passwordMatches = user ? await verifyPassword(parsed.data.password, user.password_hash) : false;
  if (!user || !passwordMatches) {
    throw new HttpError(401, 'Geçersiz kullanıcı adı veya şifre.');
  }

  const token = signSession({ userId: user.id, sessionVersion: user.session_version });
  res.cookie(sessionCookieName(), token, { ...sessionCookieOptions(), maxAge: SESSION_COOKIE_MAX_AGE_MS });
  res.json({ username: user.username, role: user.role });
});

/**
 * Ends the session for good: bumping the user's session version makes the
 * token dead even if someone copied it, not just deleted from this browser.
 * Always clears the cookie, whether or not the token was still valid.
 */
authRouter.post('/logout', async (req, res) => {
  const token = req.cookies?.[sessionCookieName()];
  if (typeof token === 'string' && token) {
    try {
      const claims = verifySession(token);
      const user = await findById(claims.userId);
      if (user && user.session_version === claims.sessionVersion) {
        await bumpSessionVersion(user.id);
      }
    } catch {
      // An invalid or expired token has nothing left to revoke.
    }
  }
  res.clearCookie(sessionCookieName(), sessionCookieOptions());
  res.json({ success: true });
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ username: req.user!.username, role: req.user!.role });
});

/**
 * Changes the signed-in user's password.
 *
 * Every other login is ended (the version number moves on), and this one is
 * re-issued so the person changing it is not thrown out of the panel.
 */
authRouter.post('/change-password', changePasswordRateLimit, requireAuth, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Mevcut şifre, yeni şifre ve yeni şifre tekrarı gereklidir.');
  }
  const { currentPassword, newPassword, confirmPassword } = parsed.data;

  const user = await findById(req.user!.userId);
  if (!user) throw new HttpError(401, 'Oturum geçersiz.');

  if (!(await verifyPassword(currentPassword, user.password_hash))) {
    throw new HttpError(400, 'Mevcut şifre yanlış.');
  }
  if (newPassword !== confirmPassword) {
    throw new HttpError(400, 'Yeni şifre ile tekrarı eşleşmiyor.');
  }
  if (newPassword === currentPassword) {
    throw new HttpError(400, 'Yeni şifre mevcut şifreden farklı olmalıdır.');
  }
  const problem = adminPasswordProblem(newPassword, user.username);
  if (problem) throw new HttpError(400, problem);

  const sessionVersion = await changePassword(user.id, await hashPassword(newPassword));
  const token = signSession({ userId: user.id, sessionVersion });
  res.cookie(sessionCookieName(), token, { ...sessionCookieOptions(), maxAge: SESSION_COOKIE_MAX_AGE_MS });
  res.json({ success: true });
});
