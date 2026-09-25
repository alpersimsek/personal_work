import { Router } from 'express';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { listAllPublished } from '../repositories/postsRepo.js';
import { resolvePage } from '../seo/pages.js';
import { renderShell } from '../seo/template.js';
import { siteOrigin } from '../seo/site.js';
import { escapeHtml } from '../seo/html.js';

const HOUR_SECONDS = 60 * 60;

/**
 * robots.txt, sitemap.xml and every page address of the site.
 *
 * Pages are the built `index.html` with per-page head data and readable
 * content filled in; unknown addresses answer with a real 404 (still showing
 * the app, so visitors get its "not found" page).
 */
export function createSeoRouter(staticDir: string): Router {
  const router = Router();
  let template: string | undefined;
  const loadTemplate = () => (template ??= readFileSync(path.join(staticDir, 'index.html'), 'utf8'));

  router.get('/robots.txt', (req, res) => {
    const origin = siteOrigin(req);
    res
      .type('text/plain')
      .set('Cache-Control', `public, max-age=${HOUR_SECONDS}`)
      .send(['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /api/', '', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n'));
  });

  router.get('/sitemap.xml', async (req, res) => {
    const origin = siteOrigin(req);
    const posts = await listAllPublished();
    const newest = posts.reduce<string | undefined>((latest, post) => {
      const modified = new Date(post.updated_at).toISOString();
      return !latest || modified > latest ? modified : latest;
    }, undefined);

    const entry = (location: string, lastModified?: string) =>
      `  <url><loc>${escapeHtml(location)}</loc>${lastModified ? `<lastmod>${lastModified}</lastmod>` : ''}</url>`;
    const urls = [
      entry(`${origin}/`, newest),
      entry(`${origin}/blog`, newest),
      entry(`${origin}/kvkk`),
      ...posts.map((post) =>
        entry(`${origin}/blog/${encodeURIComponent(post.slug)}`, new Date(post.updated_at).toISOString()),
      ),
    ];

    res
      .type('application/xml')
      .set('Cache-Control', `public, max-age=${HOUR_SECONDS}`)
      .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  });

  router.get('*', async (req, res) => {
    const origin = siteOrigin(req);
    const page = await resolvePage(req.path, origin);
    res
      .status(page.status)
      .type('html')
      .set('Cache-Control', 'no-cache')
      .send(renderShell(loadTemplate(), page, origin));
  });

  return router;
}
