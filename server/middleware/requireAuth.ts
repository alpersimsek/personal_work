import type { Request, Response, NextFunction } from 'express';
import { verifySession } from '../utils/jwt.js';
import { sessionCookieName } from '../utils/sessionCookie.js';
import { findById } from '../repositories/usersRepo.js';
import type { SessionPayload } from '../types.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: SessionPayload;
  }
}

const REJECTED = { error: 'Geçersiz veya süresi dolmuş oturum.' };

/**
 * The user a session token belongs to, or null when it is invalid, expired,
 * revoked or the account is gone. Read from the database, never from the token.
 */
export async function loadSessionUser(token: string): Promise<SessionPayload | null> {
  let claims;
  try {
    claims = verifySession(token);
  } catch {
    return null;
  }
  const user = await findById(claims.userId);
  if (!user || user.session_version !== claims.sessionVersion) return null;
  return { userId: user.id, username: user.username, role: user.role };
}

/**
 * Accepts a request only when its session cookie holds a valid token for a
 * user that still exists and whose session generation has not moved on.
 *
 * `req.user` is filled from the database, never from the token, so a role
 * change or a deleted account takes effect on the very next request.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[sessionCookieName()];
  if (typeof token !== 'string' || !token) {
    res.status(401).json({ error: 'Oturum açılmamış.' });
    return;
  }

  const user = await loadSessionUser(token);
  if (!user) {
    res.status(401).json(REJECTED);
    return;
  }

  req.user = user;
  next();
}
