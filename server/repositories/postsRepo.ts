import { db } from '../db/knex.js';

export interface BlogPostRow {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  content: string | null;
  category: string | null;
  tags: string[] | null;
  author: string | null;
  read_time: string | null;
  cover_image: string | null;
  published: boolean;
  featured: boolean;
  likes: number;
  views: number;
  created_at: string;
  updated_at: string;
}

function normalize(row: BlogPostRow): BlogPostRow {
  return { ...row, tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags ?? []),
    published: Boolean(row.published), featured: Boolean(row.featured) };
}

export interface PostFilters {
  category?: string;
  searchQuery?: string;
  page?: number;
  limit?: number;
}

export interface PostInput {
  title?: string;
  summary?: string;
  content?: string;
  category?: string;
  tags?: string[];
  author?: string;
  readTime?: string;
  coverImage?: string;
  published?: boolean;
  featured?: boolean;
}

export async function listPublished(
  filters: PostFilters
): Promise<{ posts: BlogPostRow[]; total: number }> {
  const { category, searchQuery, page = 1, limit = 6 } = filters;
  let query = db<BlogPostRow>('blog_posts').where({ published: true });

  if (category && category !== 'Tümü') {
    query = query.andWhere({ category });
  }
  if (searchQuery?.trim()) {
    const term = `%${searchQuery.trim()}%`;
    query = query.andWhere((builder) => {
      builder.where('title', 'like', term).orWhere('summary', 'like', term).orWhereRaw("JSON_SEARCH(tags, 'one', ?) IS NOT NULL", [term]);
    });
  }

  const countRow = await query.clone().count<{ count: string }[]>({ count: 'id' }).first();
  const total = Number(countRow?.count ?? 0);

  const posts = await query
    .clone()
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset((page - 1) * limit);

  return { posts: posts.map(normalize), total };
}

export async function findBySlug(slug: string): Promise<BlogPostRow | undefined> {
  const row = await db<BlogPostRow>('blog_posts').where({ slug }).first();
  return row ? normalize(row) : undefined;
}

export async function findById(id: number): Promise<BlogPostRow | undefined> {
  const row = await db<BlogPostRow>('blog_posts').where({ id }).first();
  return row ? normalize(row) : undefined;
}

export async function listAll(): Promise<BlogPostRow[]> {
  return (await db<BlogPostRow>('blog_posts').orderBy('created_at', 'desc')).map(normalize);
}

export async function incrementViews(id: number): Promise<void> {
  await db('blog_posts').where({ id }).increment('views', 1);
}

export async function incrementLikes(id: number): Promise<number> {
  await db('blog_posts').where({ id }).increment('likes', 1);
  const row = await db<BlogPostRow>('blog_posts').where({ id }).first();
  return row?.likes ?? 0;
}

export async function createPost(slug: string, input: PostInput): Promise<BlogPostRow> {
  const [id] = await db('blog_posts').insert({
    slug,
    title: input.title,
    summary: input.summary ?? '',
    content: input.content ?? '',
    category: input.category ?? null,
    tags: JSON.stringify(input.tags ?? []),
    author: input.author ?? null,
    read_time: input.readTime ?? null,
    cover_image: input.coverImage ?? null,
    published: input.published ?? true,
    featured: input.featured ?? false,
  });
  const created = await findById(id);
  return created!;
}

export async function updatePost(id: number, input: PostInput): Promise<BlogPostRow | undefined> {
  const updates: Record<string, unknown> = { updated_at: db.fn.now() };
  if (input.title !== undefined) updates.title = input.title;
  if (input.summary !== undefined) updates.summary = input.summary;
  if (input.content !== undefined) updates.content = input.content;
  if (input.category !== undefined) updates.category = input.category;
  if (input.tags !== undefined) updates.tags = JSON.stringify(input.tags);
  if (input.author !== undefined) updates.author = input.author;
  if (input.readTime !== undefined) updates.read_time = input.readTime;
  if (input.coverImage !== undefined) updates.cover_image = input.coverImage;
  if (input.published !== undefined) updates.published = input.published;
  if (input.featured !== undefined) updates.featured = input.featured;

  const existing = await findById(id);
  if (!existing) return undefined;

  await db('blog_posts').where({ id }).update(updates);
  return findById(id);
}

export async function deletePost(id: number): Promise<boolean> {
  const deleted = await db('blog_posts').where({ id }).delete();
  return deleted > 0;
}

export async function setPublished(id: number, published: boolean): Promise<BlogPostRow | undefined> {
  const existing = await findById(id);
  if (!existing) return undefined;
  await db('blog_posts').where({ id }).update({ published, updated_at: db.fn.now() });
  return findById(id);
}
