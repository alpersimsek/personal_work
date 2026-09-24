import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import {
  ISSUER,
  AUDIENCE,
  SESSION_TTL_SECONDS,
  assertJwtConfiguration,
  signSession,
  verifySession,
} from '../utils/jwt.js';

const SECRET = 'Zk3v9Qx7Lr2Tn8Wy5Hc1Bd6Mf4Sg0Pa-jUeXoNiVtRb';
const OTHER_SECRET = 'q7Ns1Vd4Kx9Ej2Ry6Hb3Tc8Wm5Lg0Za-pYuFoIiBtCe';

beforeEach(() => {
  process.env.JWT_SECRET = SECRET;
  delete process.env.JWT_SECRET_PREVIOUS;
});

/** Signs a token the way the server does, but lets a test break one rule. */
function forge(claims: object, options: jwt.SignOptions = {}, secret = SECRET): string {
  return jwt.sign(claims, secret, {
    algorithm: 'HS256',
    issuer: ISSUER,
    audience: AUDIENCE,
    subject: '7',
    expiresIn: 60,
    ...options,
  });
}

test('verifySession returns the user id and session version signSession stored', () => {
  const claims = verifySession(signSession({ userId: 7, sessionVersion: 3 }));
  assert.deepEqual(claims, { userId: 7, sessionVersion: 3 });
});

test('a token carries no username or role, only ids and standard claims', () => {
  const decoded = jwt.decode(signSession({ userId: 7, sessionVersion: 0 })) as Record<string, unknown>;
  assert.deepEqual(Object.keys(decoded).sort(), ['aud', 'exp', 'iat', 'iss', 'jti', 'sub', 'sv']);
});

test('every token gets its own id and expires after the session lifetime', () => {
  const first = jwt.decode(signSession({ userId: 7, sessionVersion: 0 })) as jwt.JwtPayload;
  const second = jwt.decode(signSession({ userId: 7, sessionVersion: 0 })) as jwt.JwtPayload;
  assert.notEqual(first.jti, second.jti);
  assert.equal(first.exp! - first.iat!, SESSION_TTL_SECONDS);
});

test('a tampered token is rejected', () => {
  const token = signSession({ userId: 7, sessionVersion: 0 });
  assert.throws(() => verifySession(`${token}tampered`));
});

test('an unsigned alg:none token is rejected', () => {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ sub: '7', sv: 0, iss: ISSUER, aud: AUDIENCE, exp: Math.floor(Date.now() / 1000) + 60 }),
  ).toString('base64url');
  assert.throws(() => verifySession(`${header}.${payload}.`));
});

test('only HS256 is accepted, even when signed with the right secret', () => {
  for (const algorithm of ['HS384', 'HS512'] as const) {
    assert.throws(() => verifySession(forge({ sv: 0 }, { algorithm })), /algorithm/i);
  }
});

test('a token signed with a different secret is rejected', () => {
  assert.throws(() => verifySession(forge({ sv: 0 }, {}, OTHER_SECRET)));
});

test('a token from another issuer or for another audience is rejected', () => {
  assert.throws(() => verifySession(forge({ sv: 0 }, { issuer: 'someone-else' })));
  assert.throws(() => verifySession(forge({ sv: 0 }, { audience: 'another-app' })));
});

test('an expired token is rejected', () => {
  assert.throws(() => verifySession(forge({ sv: 0 }, { expiresIn: -60 })), /expired/i);
});

test('a token that never expires is rejected', () => {
  const token = jwt.sign({ sv: 0 }, SECRET, { algorithm: 'HS256', issuer: ISSUER, audience: AUDIENCE, subject: '7' });
  assert.throws(() => verifySession(token));
});

test('a token with an absurdly long lifetime is rejected', () => {
  assert.throws(() => verifySession(forge({ sv: 0 }, { expiresIn: SESSION_TTL_SECONDS * 10 })));
});

test('a token issued in the future is rejected', () => {
  const issuedAt = Math.floor(Date.now() / 1000) + 3600;
  assert.throws(() => verifySession(forge({ sv: 0, iat: issuedAt }, { expiresIn: 7200 })));
});

test('tokens with malformed subject or session version are rejected', () => {
  assert.throws(() => verifySession(forge({ sv: 0 }, { subject: 'admin' })));
  assert.throws(() => verifySession(forge({ sv: 0 }, { subject: '-1' })));
  assert.throws(() => verifySession(forge({ sv: 0 }, { subject: '1.5' })));
  assert.throws(() => verifySession(forge({})));
  assert.throws(() => verifySession(forge({ sv: '0' })));
  assert.throws(() => verifySession(forge({ sv: -1 })));
});

test('verifySession fails closed when JWT_SECRET is missing', () => {
  const token = signSession({ userId: 7, sessionVersion: 0 });
  delete process.env.JWT_SECRET;
  assert.throws(() => verifySession(token), /JWT_SECRET/);
  assert.throws(() => signSession({ userId: 7, sessionVersion: 0 }), /JWT_SECRET/);
});

test('a token from the previous secret is accepted only while it is configured', () => {
  const oldToken = forge({ sv: 0 }, {}, OTHER_SECRET);
  assert.throws(() => verifySession(oldToken));

  process.env.JWT_SECRET_PREVIOUS = OTHER_SECRET;
  assert.equal(verifySession(oldToken).userId, 7);

  delete process.env.JWT_SECRET_PREVIOUS;
  assert.throws(() => verifySession(oldToken));
});

test('new tokens are always signed with the current secret, never the previous one', () => {
  process.env.JWT_SECRET_PREVIOUS = OTHER_SECRET;
  const token = signSession({ userId: 7, sessionVersion: 0 });
  assert.doesNotThrow(() => jwt.verify(token, SECRET, { algorithms: ['HS256'] }));
  assert.throws(() => jwt.verify(token, OTHER_SECRET, { algorithms: ['HS256'] }));
});

test('assertJwtConfiguration accepts a long random secret', () => {
  assert.doesNotThrow(() => assertJwtConfiguration());
});

test('assertJwtConfiguration accepts every secret the documented generators produce', () => {
  for (let run = 0; run < 300; run++) {
    for (const encoding of ['hex', 'base64', 'base64url'] as const) {
      process.env.JWT_SECRET = randomBytes(48).toString(encoding);
      assert.doesNotThrow(() => assertJwtConfiguration());
    }
  }
});

test('assertJwtConfiguration rejects missing, short and placeholder secrets', () => {
  for (const weak of [
    undefined,
    '',
    'short',
    'a'.repeat(64),
    'change-me-to-a-long-random-string',
    'please-change-me-please-change-me-please-change-me',
    'my-super-secret-password-my-super-secret-password',
  ]) {
    if (weak === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = weak;
    assert.throws(() => assertJwtConfiguration(), /JWT_SECRET/, `should reject ${String(weak)}`);
  }
});

test('assertJwtConfiguration rejects a weak or identical previous secret', () => {
  process.env.JWT_SECRET_PREVIOUS = 'short';
  assert.throws(() => assertJwtConfiguration(), /JWT_SECRET_PREVIOUS/);
  process.env.JWT_SECRET_PREVIOUS = SECRET;
  assert.throws(() => assertJwtConfiguration(), /JWT_SECRET_PREVIOUS/);
});
