import { db } from './knex.js';
import { migrateBlogImages } from '../storage/migrateBlogImages.js';

try {
  const result = await migrateBlogImages(db);
  console.log(`Blog images migrated: ${result.migrated}; concurrent changes skipped: ${result.skipped}`);
} catch (error) {
  console.error('Image migration failed; existing database values are preserved for failed rows.', error);
  process.exitCode = 1;
} finally { await db.destroy(); }
