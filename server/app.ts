import 'express-async-errors';
import express from 'express';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';

export function createApp(_options: { staticDir?: string; serveStatic?: boolean } = {}) {
  const app = express();
  app.use(express.json({ limit: '15mb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);

  app.use(errorHandler);

  return app;
}
