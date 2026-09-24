import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  listPublished,
  findBySlug,
  findById,
  listAll,
  incrementViews,
  incrementLikes,
  createPost,
  updatePost,
  deletePost,
  setPublished,
} from '../repositories/postsRepo.js';
import { createPostSchema, updatePostSchema } from '../validation/schemas.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { uniqueSlug } from '../utils/slug.js';

export const postsRouter = Router();
export const adminPostsRouter = Router();

function positiveInteger(value: unknown): number {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new HttpError(400, 'Geçersiz sayısal değer.');
  }
  return Number(value);
}

postsRouter.get('/', async (req, res) => {
  const page = positiveInteger(req.query.page ?? '1');
  const limit = positiveInteger(req.query.limit ?? '6');
  if (limit > 100) throw new HttpError(400, 'Sayfa boyutu en fazla 100 olabilir.');
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const searchQuery = typeof req.query.searchQuery === 'string' ? req.query.searchQuery : undefined;

  const { posts, total } = await listPublished({ category, searchQuery, page, limit });
  res.json({ posts, total, totalPages: Math.ceil(total / limit) || 1, currentPage: page });
});

postsRouter.get('/:slug', async (req, res) => {
  const post = await findBySlug(req.params.slug);
  if (!post || !post.published) {
    throw new HttpError(404, 'Yazı bulunamadı.');
  }
  await incrementViews(post.id);
  res.json({ ...post, views: post.views + 1 });
});

postsRouter.post('/:id/like', async (req, res) => {
  const id = positiveInteger(req.params.id);
  const post = await findById(id);
  if (!post || !post.published) throw new HttpError(404, 'Yazı bulunamadı.');
  const likes = await incrementLikes(id);
  res.json({ likes });
});

adminPostsRouter.use(requireAuth, requireAdmin);

adminPostsRouter.get('/', async (_req, res) => {
  res.json(await listAll());
});

adminPostsRouter.post('/', async (req, res) => {
  const parsed = createPostSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Geçersiz yazı verisi.');
  }
  const post = await createPost(
    await uniqueSlug(parsed.data.title, async (slug) => Boolean(await findBySlug(slug))),
    parsed.data,
  );
  res.status(201).json(post);
});

adminPostsRouter.put('/:id', async (req, res) => {
  const parsed = updatePostSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Geçersiz yazı verisi.');
  }
  const updated = await updatePost(positiveInteger(req.params.id), parsed.data);
  if (!updated) {
    throw new HttpError(404, 'Yazı bulunamadı.');
  }
  res.json(updated);
});

adminPostsRouter.delete('/:id', async (req, res) => {
  const deleted = await deletePost(positiveInteger(req.params.id));
  if (!deleted) {
    throw new HttpError(404, 'Yazı bulunamadı.');
  }
  res.json({ success: true });
});

adminPostsRouter.patch('/:id/publish', async (req, res) => {
  const id = positiveInteger(req.params.id);
  const current = await findById(id);
  if (!current) {
    throw new HttpError(404, 'Yazı bulunamadı.');
  }
  const updated = await setPublished(id, !current.published);
  res.json(updated);
});
