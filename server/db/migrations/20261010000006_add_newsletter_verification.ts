import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('subscribers', (table) => {
    table.datetime('email_verified_at').nullable().after('consent_version');
  });

  await knex.schema.createTable('newsletter_verification_tokens', (table) => {
    table.bigIncrements('id').primary();
    table.string('token_hash', 64).notNullable().unique();
    table.enum('purpose', ['confirm', 'unsubscribe']).notNullable();
    table.string('email', 255).notNullable();
    table.string('name', 255).nullable();
    table.string('consent_version', 32).nullable();
    table.datetime('expires_at').notNullable();
    table.datetime('consumed_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.index(['email', 'purpose']);
    table.index('expires_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('newsletter_verification_tokens');
  await knex.schema.alterTable('subscribers', (table) => {
    table.dropColumn('email_verified_at');
  });
}
