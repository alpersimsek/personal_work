import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../db/knex.js';

const LETTERS = 'ğüşıöçĞÜŞİÖÇ — Zihin Sustuğunda Ne Duyarsın? “Işık” İstanbul';

after(async () => { await db.destroy(); });

test('every text column and table is utf8mb4', async () => {
  const [tables] = await db.raw(
    `SELECT TABLE_NAME AS name, TABLE_COLLATION AS collation FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'`,
  );
  assert.ok((tables as unknown[]).length > 0);
  for (const table of tables as Array<{ name: string; collation: string }>) {
    assert.match(table.collation, /^utf8mb4_/, `${table.name} is ${table.collation}`);
  }
  const [columns] = await db.raw(
    `SELECT TABLE_NAME AS t, COLUMN_NAME AS c, CHARACTER_SET_NAME AS cs FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND CHARACTER_SET_NAME IS NOT NULL AND CHARACTER_SET_NAME <> 'utf8mb4'`,
  );
  assert.deepEqual(columns, []);
});

test('Turkish letters round-trip through the connection unchanged', async () => {
  const [rows] = await db.raw('SELECT ? AS value, HEX(?) AS hex, CHAR_LENGTH(?) AS length', [LETTERS, 'ğİı', LETTERS]);
  assert.equal(rows[0].value, LETTERS);
  assert.equal(rows[0].hex, 'C49FC4B0C4B1');
  assert.equal(rows[0].length, [...LETTERS].length);
});
