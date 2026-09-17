import 'express-async-errors';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler.js';
import { postsRouter, adminPostsRouter } from './routes/posts.js';
import { subscribersRouter, adminSubscribersRouter } from './routes/subscribers.js';
import { authRouter } from './routes/auth.js';
import { imagesRouter } from './routes/images.js';
import { IMAGE_PATH, uploadsDirectory } from './storage/blogImages.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export function createApp(options: { staticDir?: string; serveStatic?: boolean } = {}) {
  const app = express();
  app.use(cookieParser());
  app.use('/api/admin/images', imagesRouter);
  app.use(express.json({ limit: '15mb' }));

  app.use('/uploads', (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (!IMAGE_PATH.test(`/uploads${req.path}`)) {
      res.status(404).json({ error: 'Görsel bulunamadı.' });
      return;
    }
    express.static(uploadsDirectory(), { dotfiles: 'deny', index: false, maxAge: '1y', immutable: true })(req, res, next);
  });
  app.use('/uploads', (_req, res) => { res.status(404).json({ error: 'Görsel bulunamadı.' }); });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);

  app.use('/api/posts', postsRouter);
  app.use('/api/admin/posts', adminPostsRouter);

  app.use('/api/subscribe', subscribersRouter);
  app.use('/api/admin/subscribers', adminSubscribersRouter);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Bulunamadı.' });
  });

  if (options.serveStatic ?? process.env.NODE_ENV === 'production') {
    const staticDir = options.staticDir ?? path.resolve(currentDir, '../dist');
    app.use(express.static(staticDir));
    app.get('*', (_req, res) => { res.sendFile(path.join(staticDir, 'index.html')); });
  }

  app.use(errorHandler);

  return app;
}
