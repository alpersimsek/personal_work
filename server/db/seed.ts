import 'dotenv/config';
import { db } from './knex.js';

async function main(): Promise<void> {
  await db.seed.run();
  console.log('Seed complete');
  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
