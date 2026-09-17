import type { Request, Response, NextFunction } from 'express';
import { verifySession } from '../utils/jwt.js';
import type { SessionPayload } from '../types.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: SessionPayload;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.session;
  if (!token) {
    res.status(401).json({ error: 'Oturum açılmamış.' });
    return;
  }
  try {
    req.user = verifySession(token);
  } catch {
    res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum.' });
    return;
  }
  next();
}
