import { findBySlug, listAllPublished } from '../repositories/postsRepo.js';
import { absoluteUrl, SITE } from './site.js';
import { escapeHtml, renderArticleHtml } from './html.js';

/** Everything the server tells a crawler about one address. */
export interface SeoPage {
  status: number;
  title: string;
  description: string;
  /** Canonical path, e.g. `/blog/kendine-donus`. */
  path: string;
  ogType: 'website' | 'article';
  /** A site path or absolute URL for the share image. */
  image: string;
  noindex: boolean;
  jsonLd: object[];
  /** Readable content placed inside the app root until the app takes over. */
  bodyHtml: string;
  publishedTime?: string;
  modifiedTime?: string;
}

const BLOG_DESCRIPTION = 'Farkındalık, dönüşüm ve içsel netlik üzerine hazırlanan tüm makaleleri keşfedin.';
const KVKK_DESCRIPTION =
  'Bülten aboneliği için kişisel verilerin işlenmesine ilişkin aydınlatma metni ve açık rıza beyanı.';
const SUMMARY_LIMIT = 160;

const isoDate = (value: string | Date): string => new Date(value).toISOString();

function limit(text: string, max = SUMMARY_LIMIT): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
}

function base(path: string, overrides: Partial<SeoPage>): SeoPage {
  return {
    status: 200,
    title: SITE.homeTitle,
    description: SITE.description,
    path,
    ogType: 'website',
    image: SITE.defaultImagePath,
    noindex: false,
    jsonLd: [],
    bodyHtml: '',
    ...overrides,
  };
}

async function homePage(origin: string): Promise<SeoPage> {
  const posts = (await listAllPublished()).slice(0, 6);
  const person = { '@id': `${origin}/#person` };
  const postLinks = posts
    .map((post) => `<li><a href="/blog/${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a></li>`)
    .join('');

  return base('/', {
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': `${origin}/#website`,
            url: `${origin}/`,
            name: SITE.name,
            inLanguage: SITE.language,
            publisher: person,
          },
          {
            '@type': 'Person',
            '@id': `${origin}/#person`,
            name: SITE.name,
            jobTitle: SITE.jobTitle,
            url: `${origin}/`,
            email: SITE.email,
            image: absoluteUrl(origin, SITE.profileImagePath),
          },
          {
            '@type': 'ProfessionalService',
            '@id': `${origin}/#service`,
            name: `${SITE.name} Yaşam Koçluğu`,
            url: `${origin}/`,
            description: SITE.description,
            image: absoluteUrl(origin, SITE.profileImagePath),
            founder: person,
            inLanguage: SITE.language,
          },
        ],
      },
    ],
    bodyHtml: `<main>
<h1>Kendine yeniden yaklaş.</h1>
<p>Hayatındaki gürültüyü biraz azaltıp ne istediğini gerçekten duymaya başladığında, değişim çok daha doğal bir yerden başlar.</p>
<h2>Koçluk alanları</h2>
<ul><li>Kendini ve Yönünü Keşfet</li><li>Düşünceden Eyleme</li><li>Zihinsel Denge &amp; Mindfulness</li></ul>
${posts.length ? `<h2>Son yazılar</h2><ul>${postLinks}</ul>` : ''}
<nav aria-label="Site"><a href="/blog">Blog</a> · <a href="/kvkk">KVKK Aydınlatma Metni</a></nav>
<p>İletişim: <a href="mailto:${SITE.email}">${SITE.email}</a></p>
</main>`,
  });
}

async function blogListPage(origin: string): Promise<SeoPage> {
  const posts = await listAllPublished();
  const items = posts
    .map(
      (post) =>
        `<li><h2><a href="/blog/${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a></h2>${
          post.summary ? `<p>${escapeHtml(post.summary)}</p>` : ''
        }</li>`,
    )
    .join('');

  return base('/blog', {
    title: `Blog | ${SITE.name}`,
    description: BLOG_DESCRIPTION,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `Blog | ${SITE.name}`,
        url: `${origin}/blog`,
        description: BLOG_DESCRIPTION,
        inLanguage: SITE.language,
      },
    ],
    bodyHtml: `<main><h1>Tüm Yazılar &amp; Keşifler</h1><p>${escapeHtml(BLOG_DESCRIPTION)}</p><ul>${items}</ul></main>`,
  });
}

async function postPage(slug: string, origin: string): Promise<SeoPage | null> {
  const post = await findBySlug(slug);
  if (!post || !post.published) return null;

  const path = `/blog/${encodeURIComponent(post.slug)}`;
  const description = limit(post.summary?.trim() || post.content || SITE.description);
  const image = absoluteUrl(origin, post.cover_image || SITE.defaultImagePath);
  const published = isoDate(post.created_at);
  const modified = isoDate(post.updated_at);
  const author = post.author || SITE.name;

  return base(path, {
    title: `${post.title} | ${SITE.name}`,
    description,
    ogType: 'article',
    image,
    publishedTime: published,
    modifiedTime: modified,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description,
        image: [image],
        datePublished: published,
        dateModified: modified,
        inLanguage: SITE.language,
        author: { '@type': 'Person', name: author },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${origin}${path}` },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${origin}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${origin}/blog` },
          { '@type': 'ListItem', position: 3, name: post.title, item: `${origin}${path}` },
        ],
      },
    ],
    bodyHtml: `<main><article>
<p><a href="/blog">Tüm yazılar</a></p>
<h1>${escapeHtml(post.title)}</h1>
${post.category ? `<p>${escapeHtml(post.category)}</p>` : ''}
${post.summary ? `<p><em>${escapeHtml(post.summary)}</em></p>` : ''}
${renderArticleHtml(post.content ?? '')}
</article></main>`,
  });
}

const notFoundPage = (path: string): SeoPage =>
  base(path, {
    status: 404,
    noindex: true,
    title: `Sayfa bulunamadı | ${SITE.name}`,
    description: 'Aradığınız sayfa bulunamadı.',
    bodyHtml: '<main><h1>Sayfa bulunamadı</h1><p><a href="/">Ana sayfaya dön</a></p></main>',
  });

/**
 * Works out what to tell a crawler for a URL path: its status, head data and a
 * readable copy of the content. Unknown addresses and missing or draft posts
 * are real 404s, never the home page.
 */
export async function resolvePage(pathname: string, origin: string): Promise<SeoPage> {
  let normalized: string;
  try {
    normalized = decodeURIComponent(pathname).replace(/\/+$/, '') || '/';
  } catch {
    return notFoundPage('/');
  }
  const [first, second, ...rest] = normalized.split('/').filter(Boolean);

  if (normalized === '/') return homePage(origin);
  if (first === 'blog' && !second) return blogListPage(origin);
  if (first === 'blog' && second && rest.length === 0) {
    return (await postPage(second, origin)) ?? notFoundPage(normalized);
  }
  if (first === 'kvkk' && !second) {
    return base('/kvkk', {
      title: `Bülten Aydınlatma Metni | ${SITE.name}`,
      description: KVKK_DESCRIPTION,
      bodyHtml: '<main><h1>Bülten Aydınlatma Metni ve Açık Rıza Beyanı</h1><p><a href="/">Ana sayfaya dön</a></p></main>',
    });
  }
  if (first === 'admin' && !second) {
    return base('/admin', { noindex: true, title: `Yazar Paneli | ${SITE.name}`, description: SITE.description });
  }
  return notFoundPage(normalized);
}
