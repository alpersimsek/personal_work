import { z } from 'zod';
import { IMAGE_PATH } from '../storage/blogImages.js';

const coverImageSchema = z.string().max(2048).refine(value => {
  if (value === '' || IMAGE_PATH.test(value)) return true;
  try { return ['https:', 'http:'].includes(new URL(value).protocol); }
  catch { return false; }
});

export const createPostSchema = z.object({
  title: z.string().trim().min(1).max(255),
  summary: z.string().max(2000).optional(),
  content: z.string().optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().max(100).optional(),
  readTime: z.string().max(50).optional(),
  coverImage: coverImageSchema.optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export const updatePostSchema = createPostSchema.partial();

export const unsubscribeSchema = z.object({
  email: z.string().trim().email().max(255),
});

export const subscribeSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(255),
  consent: z.literal(true),
  consentVersion: z.string().trim().min(1).max(32),
  honeypot: z.string().optional(),
});
