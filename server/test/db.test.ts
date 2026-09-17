import 'dotenv/config';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../db/knex.js';

// Without this, the mysql2 connection pool keeps an open socket handle
// and `node --test` hangs after the tests finish instead of exiting.
after(async () => {
  await db.destroy();
});

test('migrations create the expected tables and the seed creates the admin user', async () => {
  const tables = await db.raw(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
  );
  const tableNames = tables[0].map((row: { table_name: string; TABLE_NAME?: string }) =>
    (row.table_name ?? row.TABLE_NAME).toLowerCase()
  );
  assert.ok(tableNames.includes('users'));
  assert.ok(tableNames.includes('blog_posts'));
  assert.ok(tableNames.includes('subscribers'));

  const admin = await db('users').where({ username: process.env.ADMIN_USERNAME?.toLowerCase() }).first();
  assert.ok(admin, 'expected the seeded admin user to exist');
  assert.equal(admin.role, 'admin');
});
