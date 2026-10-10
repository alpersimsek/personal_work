import type { Request, Response, NextFunction } from 'express';

/** Strict cookies do not stop requests from a different origin on the same site. */
export function requireSameOrigin(req: Request, res: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const expected = process.env.NODE_ENV === 'production'
    ? process.env.PUBLIC_SITE_URL
    : process.env.ALLOWED_ORIGIN || `${req.protocol}://${req.get('host')}`;
  const origin = req.get('Origin');
  const referer = req.get('Referer');
  const site = req.get('Sec-Fetch-Site');
  let trusted = origin === undefined && !referer;
  try {
    if (expected) {
      const configured = new URL(expected);
      const supplied = origin !== undefined ? new URL(origin) : referer ? new URL(referer) : undefined;
      trusted = ['http:', 'https:'].includes(configured.protocol) &&
        (!supplied || (!supplied.username && !supplied.password && supplied.origin === configured.origin &&
          (origin === undefined || origin === supplied.origin)));
    }
  } catch { trusted = false; }

  // Browsers supply at least one of these signals on cross-origin writes.
  // Header-less CLI clients still need the normal authentication checks.
  if (!trusted || (site !== undefined && site !== 'same-origin' && site !== 'none')) {
    res.status(403).json({ error: 'Bu kaynaktan gelen isteğe izin verilmiyor.' });
    return;
  }
  next();
}
