import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';
import { adminPasswordProblem } from '../../utils/adminPassword.js';

export async function seed(knex: Knex): Promise<void> {
  const username = (process.env.ADMIN_USERNAME ?? '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? '';
  if (!username || !password) {
    throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD must be set to seed the admin user.');
  }

  const problem = adminPasswordProblem(password, username);
  if (problem) throw new Error(`ADMIN_PASSWORD rejected: ${problem}`);

  const existing = await knex('users').where({ username }).first();
  if (existing) return;

  const passwordHash = await bcrypt.hash(password, 12);
  await knex('users').insert({ username, password_hash: passwordHash, role: 'admin' });
}
