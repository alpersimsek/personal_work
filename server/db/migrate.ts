import { db } from './knex.js';

async function main(): Promise<void> {
  await db.migrate.latest();
  console.log('Migrations complete');
  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
