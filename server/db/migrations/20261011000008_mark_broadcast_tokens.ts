import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('newsletter_verification_tokens', (table) => {
    table.boolean('broadcast').notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('newsletter_verification_tokens', (table) => {
    table.dropColumn('broadcast');
  });
}
