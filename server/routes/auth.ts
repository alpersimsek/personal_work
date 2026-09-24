import { Router } from 'express';
import { z } from 'zod';
import { findByUsername, findById, bumpSessionVersion } from '../repositories/usersRepo.js';
import { verifyPassword } from '../utils/password.js';
import { signSession, verifySession } from '../utils/jwt.js';
import {
  sessionCookieName,
  sessionCookieOptions,
  SESSION_COOKIE_MAX_AGE_MS,
} from '../utils/sessionCookie.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { loginRateLimit } from '../middleware/rateLimit.js';
import { HttpError } from '../middleware/errorHandler.js';

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
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
