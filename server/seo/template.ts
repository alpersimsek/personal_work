import type { SeoPage } from './pages.js';
import { absoluteUrl, SITE } from './site.js';
import { escapeHtml, jsonForScript } from './html.js';

/** Tags the built page already carries; they are replaced, never duplicated. */
const REPLACED_TAGS = /<title>[\s\S]*?<\/title>\s*|<meta\s+(?:name|property)="(?:description|robots|og:[^"]*|twitter:[^"]*|article:[^"]*)"[^>]*>\s*|<link\s+rel="canonical"[^>]*>\s*/g;

const meta = (attribute: 'name' | 'property', key: string, value: string) =>
  `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`;

/** The head tags for one page: title, description, canonical, Open Graph, Twitter and JSON-LD. */
function headTags(page: SeoPage, origin: string): string {
  const url = `${origin}${page.path}`;
  const image = absoluteUrl(origin, page.image);

  const tags = [
    `<title>${escapeHtml(page.title)}</title>`,
    meta('name', 'description', page.description),
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    ...(page.noindex ? [meta('name', 'robots', 'noindex, nofollow')] : []),
    meta('property', 'og:site_name', SITE.name),
    meta('property', 'og:locale', SITE.locale),
    meta('property', 'og:type', page.ogType),
    meta('property', 'og:title', page.title),
    meta('property', 'og:description', page.description),
    meta('property', 'og:url', url),
    meta('property', 'og:image', image),
    ...(page.publishedTime ? [meta('property', 'article:published_time', page.publishedTime)] : []),
    ...(page.modifiedTime ? [meta('property', 'article:modified_time', page.modifiedTime)] : []),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', page.title),
    meta('name', 'twitter:description', page.description),
    meta('name', 'twitter:image', image),
    ...page.jsonLd.map((data) => `<script type="application/ld+json">${jsonForScript(data)}</script>`),
  ];
  return tags.map((tag) => `    ${tag}`).join('\n');
}

/**
 * Turns the built `index.html` into the page for one address: its own head data
 * and a readable copy of its content inside the app root. The app replaces
 * that content as soon as it starts, so visitors see the normal site while
 * crawlers that do not run scripts still read the text.
 */
export function renderShell(template: string, page: SeoPage, origin: string): string {
  const withoutOld = template.replace(REPLACED_TAGS, '');
  const withHead = withoutOld.includes('</head>')
    ? withoutOld.replace('</head>', () => `${headTags(page, origin)}\n  </head>`)
    : withoutOld;
  return withHead.replace('<div id="root"></div>', () => `<div id="root">${page.bodyHtml}</div>`);
}
