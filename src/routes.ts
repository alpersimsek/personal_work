/** The pages the app can show, each with its own address. */
export type Route =
  | { view: 'home' }
  | { view: 'blog-list' }
  | { view: 'blog-detail'; slug: string }
  | { view: 'blog-admin' };

const decodeSegment = (segment: string): string => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

/** Maps a URL path to a route. Unknown paths fall back to the home page. */
export function parseRoute(pathname: string): Route {
  const [first, second, ...rest] = pathname.split('/').filter(Boolean).map(decodeSegment);

  if (first === 'blog' && !second) return { view: 'blog-list' };
  if (first === 'blog' && second && rest.length === 0) return { view: 'blog-detail', slug: second };
  if (first === 'admin' && !second) return { view: 'blog-admin' };
  return { view: 'home' };
}

/** Builds the URL path for a route, e.g. `/blog/kendine-donus`. */
export function pathForRoute(route: Route): string {
  switch (route.view) {
    case 'blog-list':
      return '/blog';
    case 'blog-detail':
      return `/blog/${encodeURIComponent(route.slug)}`;
    case 'blog-admin':
      return '/admin';
    case 'home':
      return '/';
  }
}
