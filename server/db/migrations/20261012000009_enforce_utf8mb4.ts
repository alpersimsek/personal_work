import type { Knex } from 'knex';

const CHARSET = 'utf8mb4';
const COLLATION = 'utf8mb4_unicode_ci';

/**
 * Pins the database and every table to utf8mb4 so Turkish letters are stored
 * and compared correctly wherever this runs. Tables are created without an
 * explicit character set, so they otherwise inherit the server default, which
 * on many hosts is latin1 or utf8mb3.
 *
 * Idempotent: tables already on the target collation are left alone.
 */
export async function up(knex: Knex): Promise<void> {
  try {
    await knex.raw(`ALTER DATABASE DEFAULT CHARACTER SET ${CHARSET} COLLATE ${COLLATION}`);
  } catch {
    // Shared hosts often deny ALTER on the schema itself; the tables below are
    // what matters and are converted explicitly.
  }

  const [rows] = await knex.raw(
    `SELECT TABLE_NAME AS name FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
       AND (TABLE_COLLATION IS NULL OR TABLE_COLLATION <> ?)
       AND TABLE_NAME NOT LIKE 'knex\\_migrations%'`,
    [COLLATION],
  );
  for (const { name } of rows as Array<{ name: string }>) {
    await knex.raw(`ALTER TABLE ?? CONVERT TO CHARACTER SET ${CHARSET} COLLATE ${COLLATION}`, [name]);
  }
}

export async function down(): Promise<void> {
  // A character set cannot be narrowed again without risking data loss.
}
