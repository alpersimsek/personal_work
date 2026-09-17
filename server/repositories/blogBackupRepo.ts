import { db } from '../db/knex.js';
import { listAll } from './postsRepo.js';
import type { BlogBackup, BackupPost } from '../validation/blogBackup.js';

export async function exportBlogBackup(): Promise<BlogBackup> {
  const posts = await listAll();
  return {
    format: 'tugba-blog-backup', version: 1, exportedAt: new Date().toISOString(),
    posts: posts.map(({ id: _id, ...post }) => ({ ...post, tags: post.tags ?? [],
      created_at: new Date(post.created_at).toISOString(),
      updated_at: new Date(post.updated_at).toISOString(),
    })),
  };
}

export async function previewBlogRestore(posts: BackupPost[]) {
  const existing = posts.length ? await db('blog_posts').whereIn('slug', posts.map(post => post.slug)).select('slug') : [];
  return { total: posts.length, created: posts.length - existing.length, updated: existing.length,
    published: posts.filter(post => post.published).length, drafts: posts.filter(post => !post.published).length };
}

export async function restoreBlogBackup(posts: BackupPost[]) {
  return db.transaction(async transaction => {
    let created = 0;
    let updated = 0;
    // Stable ordering also reduces contention between concurrent restores.
    for (const post of [...posts].sort((a, b) => a.slug.localeCompare(b.slug))) {
      const existing = await transaction('blog_posts').where({ slug: post.slug }).first().forUpdate();
      const row = { ...post, tags: JSON.stringify(post.tags),
        created_at: new Date(post.created_at), updated_at: new Date(post.updated_at) };
      if (existing) {
        await transaction('blog_posts').where({ id: existing.id }).update(row);
        updated++;
      } else {
        await transaction('blog_posts').insert(row);
        created++;
      }
    }
    return { total: posts.length, created, updated };
  });
}
