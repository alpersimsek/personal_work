import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('blog_posts', (table) => {
    table.increments('id').primary();
    table.string('slug', 255).notNullable().unique();
    table.string('title', 255).notNullable();
    table.text('summary');
    table.text('content', 'longtext');
    table.string('category', 100);
    table.json('tags');
    table.string('author', 100);
    table.string('read_time', 50);
    table.text('cover_image', 'longtext');
    table.boolean('published').notNullable().defaultTo(true);
    table.boolean('featured').notNullable().defaultTo(false);
    table.integer('likes').notNullable().defaultTo(0);
    table.integer('views').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('blog_posts');
}
