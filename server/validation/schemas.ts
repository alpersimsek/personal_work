import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().trim().min(1).max(255),
  summary: z.string().max(2000).optional(),
  content: z.string().optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().max(100).optional(),
  readTime: z.string().max(50).optional(),
  coverImage: z.string().optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export const updatePostSchema = createPostSchema.partial();

export const subscribeSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(255),
  consent: z.literal(true),
  honeypot: z.string().optional(),
});
