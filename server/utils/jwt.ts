import jwt from 'jsonwebtoken';
import type { SessionPayload } from '../types.js';

const EXPIRES_IN = '12h';

function requireSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, requireSecret(), { expiresIn: EXPIRES_IN });
}

export function verifySession(token: string): SessionPayload {
  return jwt.verify(token, requireSecret()) as SessionPayload;
}
