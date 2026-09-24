import { SESSION_TTL_SECONDS } from './jwt.js';

const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * In production the `__Host-` prefix makes browsers accept the cookie only if
 * it is Secure, set from this exact host and scoped to `/`, so a sibling
 * subdomain cannot plant or overwrite a session cookie.
 */
export const sessionCookieName = () => (isProduction() ? '__Host-session' : 'session');

/** Attributes shared by setting and clearing, so logout removes the same cookie login set. */
export const sessionCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: 'strict' as const,
  path: '/',
});

/** The cookie lives exactly as long as the token inside it. */
export const SESSION_COOKIE_MAX_AGE_MS = SESSION_TTL_SECONDS * 1000;
