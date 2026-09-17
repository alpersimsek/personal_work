import 'dotenv/config';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
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

test('compiled migration commands accept a source-migrated database and remain idempotent', async () => {
  const run = promisify(execFile);
  const directory = await mkdtemp(path.join(os.tmpdir(), 'compiled-migrations-test-'));
  try {
    await writeFile(path.join(directory, 'package.json'), '{"type":"module"}');
    await symlink(path.resolve('node_modules'), path.join(directory, 'node_modules'), 'junction');
    await run(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'server/tsconfig.json', '--outDir', path.join(directory, 'server')]);
    const before = await db('knex_migrations').select('name', 'batch').orderBy('name');
    assert.ok(before.length > 0);
    assert.ok(before.every(row => row.name.endsWith('.ts')));
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await run(process.execPath, [path.join(directory, 'server/db/migrate.js')], { env: { ...process.env, NODE_ENV: 'test' } });
      assert.match(result.stdout, /Migrations complete/);
      assert.deepEqual(await db('knex_migrations').select('name', 'batch').orderBy('name'), before);
    }
    const [, migrations] = await db.migrate.latest();
    assert.deepEqual(migrations, []);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
