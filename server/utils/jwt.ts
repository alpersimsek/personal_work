import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';

/** Only HS256 is ever signed or accepted: no `none`, no algorithm switching. */
const ALGORITHM = 'HS256';
export const ISSUER = 'tugba-ergunersimsek.com';
export const AUDIENCE = 'tugba-ergunersimsek.com/admin';
export const SESSION_TTL_SECONDS = 12 * 60 * 60;

/** Seconds of clock drift tolerated when checking exp and iat. */
const CLOCK_TOLERANCE_SECONDS = 5;
const MIN_SECRET_LENGTH = 32;
const MIN_DISTINCT_CHARACTERS = 10;
/** Words people put in hand-written secrets; a random value never contains them. */
const PLACEHOLDER_PATTERN = /change[-_ ]?me|password|passwd|secret|example|default|qwerty|admin/i;
const USER_ID_PATTERN = /^[1-9]\d{0,14}$/;

/** What a verified session token proves: who it was issued to, and which generation of their sessions. */
export interface SessionClaims {
  userId: number;
  sessionVersion: number;
}

function weakSecretReason(secret: string): string | undefined {
  if (secret !== secret.trim()) return 'must not start or end with whitespace';
  if (secret.length < MIN_SECRET_LENGTH) return `must be at least ${MIN_SECRET_LENGTH} characters`;
  if (PLACEHOLDER_PATTERN.test(secret)) return 'still looks like the example placeholder';
  if (new Set(secret).size < MIN_DISTINCT_CHARACTERS) return 'is too repetitive to be random';
  return undefined;
}

/**
 * Refuses to start with a weak or missing signing secret.
 *
 * Call once at startup. Generate a good value with
 * `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`.
 */
export function assertJwtConfiguration(): void {
  const current = process.env.JWT_SECRET;
  if (!current) throw new Error('JWT_SECRET is not configured');
  const currentProblem = weakSecretReason(current);
  if (currentProblem) throw new Error(`JWT_SECRET ${currentProblem}`);

  const previous = process.env.JWT_SECRET_PREVIOUS;
  if (!previous) return;
  const previousProblem = weakSecretReason(previous);
  if (previousProblem) throw new Error(`JWT_SECRET_PREVIOUS ${previousProblem}`);
  if (previous === current) throw new Error('JWT_SECRET_PREVIOUS must differ from JWT_SECRET');
}

function currentSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return secret;
}

/** Secrets that may verify a token: the current one, then the one being rotated out. */
function verificationSecrets(): string[] {
  const previous = process.env.JWT_SECRET_PREVIOUS;
  return previous ? [currentSecret(), previous] : [currentSecret()];
}

/** Issues a signed session token. It carries ids only; role and name are read from the database on each request. */
export function signSession({ userId, sessionVersion }: SessionClaims): string {
  if (!Number.isSafeInteger(userId) || userId < 1) throw new TypeError('userId must be a positive integer');
  if (!Number.isSafeInteger(sessionVersion) || sessionVersion < 0) {
    throw new TypeError('sessionVersion must be a non-negative integer');
  }
  return jwt.sign({ sv: sessionVersion }, currentSecret(), {
    algorithm: ALGORITHM,
    issuer: ISSUER,
    audience: AUDIENCE,
    subject: String(userId),
    expiresIn: SESSION_TTL_SECONDS,
    jwtid: randomUUID(),
  });
}

function verifyWithAnySecret(token: string): jwt.JwtPayload {
  const secrets = verificationSecrets();
  for (const [index, secret] of secrets.entries()) {
    try {
      const payload = jwt.verify(token, secret, {
        algorithms: [ALGORITHM],
        issuer: ISSUER,
        audience: AUDIENCE,
        clockTolerance: CLOCK_TOLERANCE_SECONDS,
      });
      if (typeof payload === 'string') throw new jwt.JsonWebTokenError('unexpected token payload');
      return payload;
    } catch (error) {
      const isLastSecret = index === secrets.length - 1;
      const wrongKey = error instanceof jwt.JsonWebTokenError && error.message === 'invalid signature';
      if (!wrongKey || isLastSecret) throw error;
    }
  }
  throw new jwt.JsonWebTokenError('invalid token');
}

/**
 * Verifies a session token and returns its claims.
 *
 * Beyond the signature this pins the algorithm, issuer and audience, requires
 * a bounded lifetime and validates every claim's shape, so a token that is
 * signed but not one of ours never passes. Throws on any failure.
 */
export function verifySession(token: string): SessionClaims {
  const payload = verifyWithAnySecret(token);
  const { sub, sv, exp, iat } = payload;
  const now = Math.floor(Date.now() / 1000);

  if (typeof exp !== 'number' || typeof iat !== 'number') {
    throw new jwt.JsonWebTokenError('token must have issue and expiry times');
  }
  if (iat > now + CLOCK_TOLERANCE_SECONDS) throw new jwt.JsonWebTokenError('token issued in the future');
  if (exp - iat > SESSION_TTL_SECONDS + CLOCK_TOLERANCE_SECONDS) {
    throw new jwt.JsonWebTokenError('token lifetime is too long');
  }
  if (typeof sub !== 'string' || !USER_ID_PATTERN.test(sub)) {
    throw new jwt.JsonWebTokenError('token subject is not a user id');
  }
  if (typeof sv !== 'number' || !Number.isSafeInteger(sv) || sv < 0) {
    throw new jwt.JsonWebTokenError('token session version is invalid');
  }
  return { userId: Number(sub), sessionVersion: sv };
}
