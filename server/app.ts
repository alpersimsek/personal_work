import 'express-async-errors';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';
import { postsRouter, adminPostsRouter } from './routes/posts.js';
import { subscribersRouter, adminSubscribersRouter } from './routes/subscribers.js';
import { authRouter } from './routes/auth.js';
import { imagesRouter } from './routes/images.js';
import { createSeoRouter } from './routes/seo.js';
import { IMAGE_PATH, uploadsDirectory } from './storage/blogImages.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

/** Where the browser may load things from. Google Fonts and the CloudFront videos are the only outside sources. */
const CONTENT_SECURITY_POLICY = {
  useDefaults: false,
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'media-src': ["'self'", 'https://d8j0ntlcm91z4.cloudfront.net'],
    'connect-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
  },
};

/** Hashed build files never change, so browsers may keep them for a year; everything else revalidates soon. */
function cacheHeaders(response: express.Response, filePath: string): void {
  const hashedBuildFile = filePath.includes(`${path.sep}assets${path.sep}`);
  response.setHeader('Cache-Control', hashedBuildFile ? 'public, max-age=31536000, immutable' : 'public, max-age=86400');
}

export function createApp(options: { staticDir?: string; serveStatic?: boolean } = {}) {
  const app = express();
  const serving = options.serveStatic ?? process.env.NODE_ENV === 'production';

  app.disable('x-powered-by');
  if (serving) {
    app.use(compression());
    app.use(
      helmet({
        contentSecurityPolicy: CONTENT_SECURITY_POLICY,
        // Link previews fetch pictures from other sites, so images must stay embeddable.
        crossOriginResourcePolicy: { policy: 'cross-origin' },
      }),
    );
  }
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

  if (serving) {
    const staticDir = options.staticDir ?? path.resolve(currentDir, '../dist');
    // index: false so "/" is answered by the SEO router, which fills in each page's head and content.
    app.use(express.static(staticDir, { index: false, setHeaders: cacheHeaders }));
    app.use(createSeoRouter(staticDir));
  }

  app.use(errorHandler);

  return app;
}
