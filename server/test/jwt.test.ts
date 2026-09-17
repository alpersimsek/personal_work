import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signSession, verifySession } from '../utils/jwt.js';

test('verifySession decodes what signSession produced', () => {
  process.env.JWT_SECRET = 'test-secret';
  const token = signSession({ userId: 1, username: 'admin', role: 'admin' });
  const decoded = verifySession(token);
  assert.equal(decoded.userId, 1);
  assert.equal(decoded.username, 'admin');
  assert.equal(decoded.role, 'admin');
});

test('verifySession throws on a tampered token', () => {
  process.env.JWT_SECRET = 'test-secret';
  const token = signSession({ userId: 1, username: 'admin', role: 'admin' });
  assert.throws(() => verifySession(`${token}tampered`));
});
