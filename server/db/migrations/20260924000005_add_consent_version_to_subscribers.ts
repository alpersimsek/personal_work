import type { Knex } from 'knex';

/**
 * Records which version of the consent wording each subscriber agreed to.
 * Null for anyone who signed up before versions were tracked.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('subscribers', (table) => {
    table.string('consent_version', 32);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('subscribers', (table) => {
    table.dropColumn('consent_version');
  });
}
