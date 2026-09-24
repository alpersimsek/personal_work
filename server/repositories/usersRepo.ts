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

/** Invalidates every session token issued to this user so far. */
export async function bumpSessionVersion(id: number): Promise<void> {
  await db<UserRow>('users').where({ id }).increment('session_version', 1);
}
