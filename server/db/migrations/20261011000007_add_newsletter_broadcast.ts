import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('blog_posts', (table) => {
    table.boolean('newsletter_enabled').notNullable().defaultTo(true);
    table.datetime('newsletter_scheduled_at').nullable();
    table.datetime('newsletter_sent_at').nullable();
  });

  // Posts that are already live must never be emailed retroactively.
  await knex('blog_posts').where({ published: true }).update({ newsletter_sent_at: knex.fn.now() });

  await knex.schema.createTable('newsletter_deliveries', (table) => {
    table.bigIncrements('id').primary();
    table.integer('post_id').unsigned().notNullable()
      .references('id').inTable('blog_posts').onDelete('CASCADE');
    table.integer('subscriber_id').unsigned().notNullable()
      .references('id').inTable('subscribers').onDelete('CASCADE');
    table.enum('status', ['pending', 'sending', 'sent', 'failed', 'skipped']).notNullable().defaultTo('pending');
    table.tinyint('attempts').unsigned().notNullable().defaultTo(0);
    table.string('last_error', 255).nullable();
    table.datetime('sent_at').nullable();
    table.timestamps(true, true);
    table.unique(['post_id', 'subscriber_id']);
    table.index(['status', 'id']);
    table.index('sent_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('newsletter_deliveries');
  await knex.schema.alterTable('blog_posts', (table) => {
    table.dropColumn('newsletter_sent_at');
    table.dropColumn('newsletter_scheduled_at');
    table.dropColumn('newsletter_enabled');
  });
}
