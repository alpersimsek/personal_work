import type { Request } from 'express';

/** Facts about the site that search engines and link previews are told. Keep in step with the page copy. */
export const SITE = {
  name: 'Tuğba Ergüner Şimşek',
  language: 'tr',
  locale: 'tr_TR',
  jobTitle: 'Yaşam Koçu',
  email: 'tugba.erguner@gmail.com',
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
  return configuredOrigin() ?? `${request.protocol}://${request.get('host')}`;
}

/**
 * Refuses to start with an unusable PUBLIC_SITE_URL, and in production
 * without one: the fallback builds canonical links and the sitemap from the
 * Host header, which the visitor chooses. Call once at startup.
 */
export function assertSiteConfiguration(): void {
  if (!configuredOrigin() && process.env.NODE_ENV === 'production') {
    throw new Error('PUBLIC_SITE_URL is not configured');
  }
}

/**
 * PUBLIC_SITE_URL as scheme and host only, or undefined when it is unset.
 *
 * The parsed address is returned rather than the text as typed, so what is
 * checked here is exactly what ends up in links.
 */
function configuredOrigin(): string | undefined {
  const configured = process.env.PUBLIC_SITE_URL?.trim().replace(/\/+$/, '');
  if (!configured) return undefined;
  const url = URL.canParse(configured) ? new URL(configured) : undefined;
  if (!url || !/^https?:$/.test(url.protocol)) {
    throw new Error('PUBLIC_SITE_URL must be an http(s) address such as https://www.example.com');
  }
  if (url.username || url.password) {
    throw new Error('PUBLIC_SITE_URL must not contain a user name or password');
  }
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error('PUBLIC_SITE_URL must be the site address only, without a path');
  }
  return url.origin;
}

/** Makes a site path or an already absolute URL absolute. */
export function absoluteUrl(origin: string, pathOrUrl: string): string {
  return /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : `${origin}${pathOrUrl}`;
}
