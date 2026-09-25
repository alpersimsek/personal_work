import type { Request } from 'express';

/** Facts about the site that search engines and link previews are told. Keep in step with the page copy. */
export const SITE = {
  name: 'Tuğba Ergüner Şimşek',
  language: 'tr',
  locale: 'tr_TR',
  jobTitle: 'Yaşam Koçu',
  email: 'iletisim@tugbaergunersimsek.com',
  homeTitle: 'Tuğba Ergüner Şimşek — Kendine Yeniden Yaklaş | Yaşam Koçluğu',
  description:
    'Hayatındaki gürültüyü azaltıp ne istediğini duymaya başladığında, değişim doğal bir yerden başlar. Tuğba Ergüner Şimşek Yaşam Koçluğu.',
  /** Shown when a page has no picture of its own: a 1200x630 crop of the calm hero picture. Swap in a branded share image when there is one. */
  defaultImagePath: '/og-default.jpg',
  profileImagePath: '/profil.webp',
} as const;

/**
 * The public address of the site, without a trailing slash.
 *
 * PUBLIC_SITE_URL is used when set (the real domain in production); otherwise
 * the address of the current request, so local runs still produce working links.
 */
export function siteOrigin(request: Request): string {
  const configured = process.env.PUBLIC_SITE_URL?.trim().replace(/\/+$/, '');
  if (configured) return configured;
  return `${request.protocol}://${request.get('host')}`;
}

/** Makes a site path or an already absolute URL absolute. */
export function absoluteUrl(origin: string, pathOrUrl: string): string {
  return /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : `${origin}${pathOrUrl}`;
}
