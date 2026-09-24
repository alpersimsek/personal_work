import type { Knex } from 'knex';

/**
 * Adds a per-user session generation.
 *
 * Every token records the generation it was issued under. Bumping the number
 * (on logout, or when a password changes) instantly invalidates every token
 * issued before, which a stateless JWT cannot otherwise do.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.integer('session_version').unsigned().notNullable().defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('session_version');
  });
}
