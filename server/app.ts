import 'express-async-errors';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler.js';
import { postsRouter, adminPostsRouter } from './routes/posts.js';
import { subscribersRouter, adminSubscribersRouter } from './routes/subscribers.js';
import { blogBackupRouter } from './routes/blogBackup.js';
import { authRouter } from './routes/auth.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export function createApp(options: { staticDir?: string; serveStatic?: boolean } = {}) {
  const app = express();
  app.use(cookieParser());
  app.use('/api/admin/blog-backup', blogBackupRouter);
  app.use(express.json({ limit: '15mb' }));

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
