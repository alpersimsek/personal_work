import express, { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { HttpError } from '../middleware/errorHandler.js';
import { MAX_IMAGE_BYTES, storeBlogImage } from '../storage/blogImages.js';

export const imagesRouter = Router();
imagesRouter.use(requireAuth, requireAdmin);
imagesRouter.post('/', express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: MAX_IMAGE_BYTES }), async (req, res) => {
  if (!Buffer.isBuffer(req.body)) throw new HttpError(400, 'PNG, JPG veya WebP görseli seçin.');
  const url = await storeBlogImage(req.body, req.get('Content-Type')?.split(';')[0].trim().toLowerCase() || '');
  res.status(201).json({ url });
});
