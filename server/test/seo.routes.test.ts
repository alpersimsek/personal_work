import 'dotenv/config';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { createApp } from '../app.js';
import { db } from '../db/knex.js';

const TEMPLATE = `<!doctype html><html lang="tr"><head><meta charset="UTF-8" />
<title>OLD TITLE</title><meta name="description" content="OLD DESCRIPTION" />
<meta property="og:title" content="OLD OG" /><meta name="twitter:card" content="old" />
<script type="module" src="/assets/index-abc123.js"></script></head>
<body><div id="root"></div></body></html>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-fixture-'));
fs.mkdirSync(path.join(dir, 'assets'));
fs.writeFileSync(path.join(dir, 'index.html'), TEMPLATE);
fs.writeFileSync(path.join(dir, 'assets', 'index-abc123.js'), 'console.log("x");'.repeat(400));
fs.writeFileSync(path.join(dir, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');

const app = createApp({ serveStatic: true, staticDir: dir });
const ORIGIN = 'https://example.test';
const previousOrigin = process.env.PUBLIC_SITE_URL;

const published = { slug: 'seo-test-yayindaki-yazi', title: 'Yayındaki <b>Yazı</b> & "Tırnak"', summary: 'Kısa özet cümlesi.', content: '## Alt Başlık\n\nBir paragraf <script>alert(1)</script>.\n\n- madde bir\n- madde iki\n\n> Alıntı\n\n---\n\nSon.', category: 'Farkındalık', cover_image: '/uploads/blog/' + 'a'.repeat(64) + '.jpg', published: true };
const draft = { slug: 'seo-test-taslak-yazi', title: 'Taslak Yazı', summary: '', content: 'Gizli.', category: 'Farkındalık', cover_image: '', published: false };

before(async () => {
  process.env.PUBLIC_SITE_URL = ORIGIN;
  await db('blog_posts').whereIn('slug', [published.slug, draft.slug]).delete();
  await db('blog_posts').insert([published, draft]);
});

after(async () => {
  if (previousOrigin === undefined) delete process.env.PUBLIC_SITE_URL;
  else process.env.PUBLIC_SITE_URL = previousOrigin;
  await db('blog_posts').whereIn('slug', [published.slug, draft.slug]).delete();
  fs.rmSync(dir, { recursive: true });
  await db.destroy();
});

const count = (text: string, needle: string) => text.split(needle).length - 1;

test('robots.txt is plain text, hides the panel and points at the sitemap', async () => {
  const response = await request(app).get('/robots.txt').expect(200);
  assert.match(response.headers['content-type'], /text\/plain/);
  assert.match(response.text, /Disallow: \/admin/);
  assert.match(response.text, /Disallow: \/api\//);
  assert.match(response.text, new RegExp(`Sitemap: ${ORIGIN}/sitemap.xml`));
});

test('sitemap.xml lists the pages and published posts, never drafts', async () => {
  const response = await request(app).get('/sitemap.xml').expect(200);
  assert.match(response.headers['content-type'], /xml/);
  for (const location of ['/', '/blog', '/kvkk']) assert.ok(response.text.includes(`<loc>${ORIGIN}${location}</loc>`), location);
  assert.ok(response.text.includes(`<loc>${ORIGIN}/blog/${published.slug}</loc>`));
  assert.match(response.text, new RegExp(`${published.slug}</loc><lastmod>\\d{4}-\\d{2}-\\d{2}T`));
  assert.ok(!response.text.includes(draft.slug));
});

test('the home page gets its own head, structured data and readable content', async () => {
  const html = (await request(app).get('/').expect(200)).text;
  assert.equal(count(html, '<title>'), 1);
  assert.match(html, /<title>Tuğba Ergüner Şimşek — Kendine Yeniden Yaklaş \| Yaşam Koçluğu<\/title>/);
  assert.ok(!html.includes('OLD'), 'template values must be replaced, not duplicated');
  assert.ok(html.includes(`<link rel="canonical" href="${ORIGIN}/" />`));
  assert.ok(html.includes('<meta property="og:locale" content="tr_TR" />'));
  assert.match(html, /<meta property="og:image" content="https:\/\/example\.test\/og-default\.jpg" \/>/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image" \/>/);
  for (const type of ['WebSite', 'Person', 'ProfessionalService']) assert.ok(html.includes(`"@type":"${type}"`), type);
  assert.match(html, /<div id="root"><main>\s*<h1>Kendine yeniden yaklaş\.<\/h1>/);
  assert.ok(html.includes(`href="/blog/${published.slug}"`), 'latest posts are linked as real anchors');
  assert.ok(!html.includes(draft.slug));
});

test('the blog list links every published post as a real anchor', async () => {
  const html = (await request(app).get('/blog').expect(200)).text;
  assert.match(html, /<title>Blog \| Tuğba Ergüner Şimşek<\/title>/);
  assert.ok(html.includes(`<a href="/blog/${published.slug}">`));
  assert.ok(!html.includes(draft.slug));
});

test('a post gets its own title, description, canonical, Article data and escaped text', async () => {
  const html = (await request(app).get(`/blog/${published.slug}`).expect(200)).text;
  assert.match(html, /<title>Yayındaki &lt;b&gt;Yazı&lt;\/b&gt; &amp; &quot;Tırnak&quot; \| Tuğba Ergüner Şimşek<\/title>/);
  assert.ok(html.includes('<meta name="description" content="Kısa özet cümlesi." />'));
  assert.ok(html.includes(`<link rel="canonical" href="${ORIGIN}/blog/${published.slug}" />`));
  assert.ok(html.includes('<meta property="og:type" content="article" />'));
  assert.match(html, /article:published_time" content="\d{4}-/);
  assert.ok(html.includes(`content="${ORIGIN}${published.cover_image}"`), 'the cover becomes the share image');
  assert.ok(html.includes('"@type":"Article"') && html.includes('"@type":"BreadcrumbList"'));
  assert.ok(html.includes('<h2>Alt Başlık</h2>') && html.includes('<li>madde bir</li>') && html.includes('<blockquote>Alıntı</blockquote>'));
  assert.ok(!html.includes('<script>alert(1)'), 'article text must be escaped');
  assert.equal(count(html, '<script type="application/ld+json">'), 2);
  assert.equal(count(html, '</script>'), 3, 'a title can never close a script block early');
});

test('drafts, missing posts and unknown addresses are real 404s that the app can still show', async () => {
  for (const url of [`/blog/${draft.slug}`, '/blog/olmayan-yazi', '/gecersiz-sayfa', '/blog/a/b', '/eksik-dosya.js']) {
    const response = await request(app).get(url);
    assert.equal(response.status, 404, url);
    assert.match(response.text, /<div id="root"><main><h1>Sayfa bulunamadı<\/h1>/);
    assert.ok(response.text.includes('noindex'), url);
  }
});

test('the admin panel is served but kept out of search results', async () => {
  const html = (await request(app).get('/admin').expect(200)).text;
  assert.ok(html.includes('<meta name="robots" content="noindex, nofollow" />'));
});

test('hashed build files are cached for a year, pages are never cached', async () => {
  const asset = await request(app).get('/assets/index-abc123.js').expect(200);
  assert.match(asset.headers['cache-control'], /max-age=31536000, immutable/);
  assert.match((await request(app).get('/favicon.svg')).headers['cache-control'], /max-age=86400/);
  assert.equal((await request(app).get('/')).headers['cache-control'], 'no-cache');
});

test('responses are compressed and carry security headers without X-Powered-By', async () => {
  const asset = await request(app).get('/assets/index-abc123.js').set('Accept-Encoding', 'gzip').expect(200);
  assert.equal(asset.headers['content-encoding'], 'gzip');

  const page = await request(app).get('/');
  assert.equal(page.headers['x-powered-by'], undefined);
  assert.equal(page.headers['x-content-type-options'], 'nosniff');
  assert.equal(page.headers['referrer-policy'], 'no-referrer');
  const csp = page.headers['content-security-policy'];
  for (const directive of ["frame-ancestors 'none'", "object-src 'none'", "script-src 'self'", 'https://fonts.googleapis.com', 'https://d8j0ntlcm91z4.cloudfront.net']) {
    assert.ok(csp.includes(directive), directive);
  }
});

test('the API and uploads are not touched by the page router', async () => {
  const posts = await request(app).get('/api/posts').expect(200);
  assert.match(posts.headers['content-type'], /json/);
  assert.equal((await request(app).get('/api/nope')).status, 404);
  assert.match((await request(app).get('/api/nope')).headers['content-type'], /json/);
});

test('the crawler copy of the coach text still matches the live page text', async () => {
  const { COACH, HERO_TEXT } = await import('../seo/homeContent.js');
  const read = (file: string) => fs.readFileSync(new URL(`../../src/components/${file}`, import.meta.url), 'utf8');
  const coach = read('CoachProfileSection.tsx');
  const hero = read('HeroSection.tsx');

  const coachTexts = [
    COACH.heading, COACH.storyTitle, COACH.story, COACH.quote, COACH.approach,
    ...COACH.highlights.flatMap((item) => [item.title, item.text]),
    ...COACH.principles.flatMap((item) => [item.title, item.text]),
  ];
  for (const text of coachTexts) assert.ok(coach.includes(text), `CoachProfileSection no longer has "${text.slice(0, 40)}…"`);
  assert.ok(hero.includes(HERO_TEXT), 'HeroSection subtitle changed');
});

test('the home page copy has the story, the coaching areas as links, and the FAQ with the 30-minute answer', async () => {
  const html = (await request(app).get('/').expect(200)).text;
  assert.ok(html.includes('Finans ve yönetim alanındaki 10+ yıllık'));
  assert.ok(html.includes('<a href="/programlar/dusunceden-eyleme">Düşünceden Eyleme</a>'));
  assert.ok(html.includes('<a href="/hakkimda">Hikâyemin tamamını oku</a>'));
  assert.match(html, /<dt>İlk tanışma görüşmesinde ne konuşuyoruz\?<\/dt><dd>30 dakikalık/);
  assert.ok(!html.includes('15 dakikalık'));
});

test('the about page has its own head, breadcrumb and the full coach text', async () => {
  const html = (await request(app).get('/hakkimda').expect(200)).text;
  assert.match(html, /<title>Hakkımda \| Tuğba Ergüner Şimşek<\/title>/);
  assert.ok(html.includes(`<link rel="canonical" href="${ORIGIN}/hakkimda" />`));
  assert.ok(html.includes('"@type":"AboutPage"') && html.includes('"@type":"BreadcrumbList"'));
  assert.ok(html.includes('<h1>Koçun Hikayesi &amp; Yaklaşımı</h1>'));
  assert.ok(html.includes('Yargısız &amp; Eşlikçi Alan'));
});

test('the programs index and each program page are real pages with Service data', async () => {
  const index = (await request(app).get('/programlar').expect(200)).text;
  assert.match(index, /<title>Koçluk Alanları \| Tuğba Ergüner Şimşek<\/title>/);
  assert.ok(index.includes('"@type":"ItemList"'));
  for (const slug of ['kendini-ve-yonunu-kesfet', 'dusunceden-eyleme', 'zihinsel-denge-mindfulness']) {
    assert.ok(index.includes(`<a href="/programlar/${slug}">`), slug);
  }

  const html = (await request(app).get('/programlar/dusunceden-eyleme').expect(200)).text;
  assert.match(html, /<title>Düşünceden Eyleme \| Tuğba Ergüner Şimşek<\/title>/);
  assert.ok(html.includes(`<link rel="canonical" href="${ORIGIN}/programlar/dusunceden-eyleme" />`));
  assert.ok(html.includes('"@type":"Service"') && html.includes('"@type":"BreadcrumbList"'));
  for (const heading of ['Bu alan kimler için?', 'Birlikte neler yaparız?', 'Süreç nasıl işler?']) {
    assert.ok(html.includes(`<h2>${heading}</h2>`), heading);
  }
  assert.ok(html.includes('Yaşam koçluğu; psikoterapi'), 'the disclaimer is on every program page');
  assert.ok(html.includes('<a href="/programlar/kendini-ve-yonunu-kesfet">'), 'other programs are linked');
});

test('an unknown program is a real 404', async () => {
  const response = await request(app).get('/programlar/olmayan-program');
  assert.equal(response.status, 404);
  assert.ok(response.text.includes('noindex'));
});

test('the sitemap lists the about, programs and every program page', async () => {
  const xml = (await request(app).get('/sitemap.xml').expect(200)).text;
  for (const location of ['/hakkimda', '/programlar', '/programlar/kendini-ve-yonunu-kesfet', '/programlar/dusunceden-eyleme', '/programlar/zihinsel-denge-mindfulness']) {
    assert.ok(xml.includes(`<loc>${ORIGIN}${location}</loc>`), location);
  }
});
