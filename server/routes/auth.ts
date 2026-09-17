import { Router } from 'express';
import { z } from 'zod';
import { findByUsername, findById } from '../repositories/usersRepo.js';
import { verifyPassword } from '../utils/password.js';
import { signSession } from '../utils/jwt.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { loginRateLimit } from '../middleware/rateLimit.js';
import { HttpError } from '../middleware/errorHandler.js';

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

const COOKIE_NAME = 'session';
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
});

export const authRouter = Router();

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

  const token = signSession({ userId: user.id, username: user.username, role: user.role });
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: 12 * 60 * 60 * 1000 });
  res.json({ username: user.username, role: user.role });
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.json({ success: true });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await findById(req.user!.userId);
  if (!user) {
    throw new HttpError(401, 'Oturum geçersiz.');
  }
  res.json({ username: user.username, role: user.role });
});
