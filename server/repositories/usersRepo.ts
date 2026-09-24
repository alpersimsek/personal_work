import { db } from '../db/knex.js';

export interface UserRow {
  id: number;
  username: string;
  email: string | null;
  password_hash: string;
  role: 'admin' | 'user';
  session_version: number;
  created_at: string;
  updated_at: string;
}

export function findByUsername(username: string): Promise<UserRow | undefined> {
  return db<UserRow>('users').where({ username }).first();
}

export function findById(id: number): Promise<UserRow | undefined> {
  return db<UserRow>('users').where({ id }).first();
}

/**
 * Stores a new password hash and invalidates every session issued so far.
 * Returns the new session version, so the caller can keep its own session alive.
 */
export async function changePassword(id: number, passwordHash: string): Promise<number> {
  await db<UserRow>('users').where({ id }).update({
    password_hash: passwordHash,
    session_version: db.raw('session_version + 1'),
    updated_at: db.fn.now(),
  });
  const updated = await findById(id);
  return updated!.session_version;
}

/** Invalidates every session token issued to this user so far. */
export async function bumpSessionVersion(id: number): Promise<void> {
  await db<UserRow>('users').where({ id }).increment('session_version', 1);
}
