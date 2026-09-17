import type { Knex } from 'knex';
import { storeLegacyDataImage } from './blogImages.js';

export async function migrateBlogImages(database: Knex): Promise<{ migrated: number; skipped: number }> {
  let migrated = 0;
  let skipped = 0;
  let lastId = 0;
  // Process one image at a time to avoid loading an entire image-heavy table into memory.
  while (true) {
    const row = await database('blog_posts').select('id', 'cover_image')
      .where('id', '>', lastId).where('cover_image', 'like', 'data:%').orderBy('id').first();
    if (!row) break;
    lastId = row.id;
    const url = await storeLegacyDataImage(row.cover_image);
    // A concurrent editor's change must never be replaced by an old migration value.
    const changed = await database('blog_posts').where({ id: row.id })
      .whereRaw('BINARY ?? = ?', ['cover_image', row.cover_image]).update({ cover_image: url });
    if (changed) migrated++; else skipped++;
  }
  return { migrated, skipped };
}
