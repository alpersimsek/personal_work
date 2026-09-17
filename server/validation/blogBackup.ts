import { z } from 'zod';

const counter = z.number().int().min(0).max(2147483647);
const timestamp = z.string().datetime({ offset: true }).refine(value => !Number.isNaN(Date.parse(value)));

export const backupPostSchema = z.object({
  slug: z.string().min(1).max(255).regex(/^[a-z0-9ğüşıöç-]+$/),
  title: z.string().trim().min(1).max(255),
  summary: z.string().max(2000).nullable(),
  content: z.string().nullable(),
  category: z.string().max(100).nullable(),
  tags: z.array(z.string()),
  author: z.string().max(100).nullable(),
  read_time: z.string().max(50).nullable(),
  cover_image: z.string().nullable(),
  published: z.boolean(),
  featured: z.boolean(),
  likes: counter,
  views: counter,
  created_at: timestamp,
  updated_at: timestamp,
}).strict();

export const blogBackupSchema = z.object({
  format: z.literal('tugba-blog-backup'),
  version: z.literal(1),
  exportedAt: timestamp,
  posts: z.array(backupPostSchema),
}).strict().superRefine((backup, context) => {
  const slugs = new Set<string>();
  backup.posts.forEach((post, index) => {
    const slug = post.slug.toLowerCase();
    if (slugs.has(slug)) context.addIssue({ code: 'custom', path: ['posts', index, 'slug'], message: 'Duplicate slug' });
    slugs.add(slug);
  });
});

// Accept the old browser-exported BlogPost[] files, ignoring browser IDs/date labels.
const legacyPostSchema = z.object({
  slug: backupPostSchema.shape.slug,
  title: backupPostSchema.shape.title,
  summary: z.string().max(2000).default(''),
  content: z.string().default(''),
  category: z.string().max(100).default('Farkındalık'),
  tags: z.array(z.string()).default([]),
  author: z.string().max(100).default('Tuğba Ergüner Şimşek'),
  readTime: z.string().max(50).default('5 dk okuma'),
  coverImage: z.string().default(''),
  published: z.boolean().default(true),
  featured: z.boolean().default(false),
  likes: counter.default(0),
  views: counter.default(0),
  createdAt: timestamp.optional(),
  updatedAt: timestamp.optional(),
});

export type BackupPost = z.infer<typeof backupPostSchema>;
export type BlogBackup = z.infer<typeof blogBackupSchema>;

export function parseBlogBackup(input: unknown): BlogBackup {
  if (Array.isArray(input)) {
    const now = new Date().toISOString();
    const legacy = z.array(legacyPostSchema).parse(input);
    input = { format: 'tugba-blog-backup', version: 1, exportedAt: now, posts: legacy.map(post => ({
      slug: post.slug, title: post.title, summary: post.summary, content: post.content,
      category: post.category, tags: post.tags, author: post.author,
      read_time: post.readTime, cover_image: post.coverImage,
      published: post.published, featured: post.featured, likes: post.likes, views: post.views,
      created_at: post.createdAt ?? now, updated_at: post.updatedAt ?? post.createdAt ?? now,
    })) };
  }
  return blogBackupSchema.parse(input);
}
