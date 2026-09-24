import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { db } from './knex.js';
import { createPost, findBySlug } from '../repositories/postsRepo.js';
import { storeBlogImage } from '../storage/blogImages.js';
import { uniqueSlug } from '../utils/slug.js';

/**
 * Adds three example blog posts with cover images so the blog pages have
 * something to show during development. Safe to run again: posts whose title
 * already exists are skipped. Never runs in production.
 */

interface MockPost {
  title: string;
  summary: string;
  category: string;
  tags: string[];
  readTime: string;
  featured: boolean;
  /** Days before now that the post is dated, so the list is not all "today". */
  daysAgo: number;
  /** Cover image already shipped with the site, relative to the project root. */
  cover: string;
  content: string;
}

const MOCK_POSTS: MockPost[] = [
  {
    title: 'Zihin Sustuğunda Ne Duyarsın?',
    summary:
      'Gürültüyü biraz azalttığında, aslında ne istediğini duymaya başlarsın. Kendi sesine yaklaşmanın üç küçük yolu.',
    category: 'Farkındalık',
    tags: ['farkındalık', 'dinginlik', 'nefes'],
    readTime: '4 dk okuma',
    featured: true,
    daysAgo: 2,
    cover: 'src/assets/yaklasim_bg.png',
    content: `Bazı sabahlar, gün daha başlamadan zihnimiz kalabalıktır. Yapılacaklar listesi, yarım kalan konuşmalar, cevap bekleyen mesajlar... Bu kalabalığın içinde asıl sorduğumuz soru çoğu zaman kaybolur: Ben ne istiyorum?

## Gürültü, cevabı örter

Cevaplar çoğu zaman zaten içimizdedir. Onları bulmak için daha fazla çabaya değil, biraz daha fazla boşluğa ihtiyacımız vardır. Suyun durgunlaştığında dibini görebilmemiz gibi, zihin de sakinleştiğinde neyin önemli olduğunu gösterir.

> Sessizlik boş bir alan değildir; kendi sesimizi duyabildiğimiz yerdir.

## Kendine yaklaşmak için üç küçük yol

- Güne başlamadan önce üç nefes al ve yalnızca nefesini say.
- Gün içinde bir kez, telefonsuz beş dakika dur ve çevrendeki sesleri fark et.
- Akşam, "Bugün beni ne yordu, ne besledi?" sorusuna iki cümleyle cevap yaz.

### Küçük başlamak, sürdürülebilir olandır

Bu alışkanlıkların hiçbiri büyük bir değişim gerektirmez. Amaç kendini yeniden yapmak değil, zaten orada olana daha çok yaklaşmaktır.

---

Bugün yalnızca bir tanesini dene. Sonra ne duyduğunu, kendine nazikçe not et.`,
  },
  {
    title: 'Evinde Küçük Bir Dinginlik Köşesi Kurmak',
    summary:
      'İçsel netlik bazen bir odanın köşesinde başlar. Az eşyayla, bol ışıkla kendine ait bir durak yaratmak.',
    category: 'İçsel Netlik',
    tags: ['içsel netlik', 'yaşam ritmi', 'ritüel'],
    readTime: '5 dk okuma',
    featured: false,
    daysAgo: 6,
    cover: 'public/assets/light_hero_bg.png',
    content: `Zihnimizin durulması için mutlaka uzağa gitmemiz gerekmez. Bazen yalnızca evimizin bir köşesini, kendimize ayırdığımızı bilmemiz yeter.

## Neden bir köşe?

Beynimiz mekânla alışkanlıkları eşleştirir. Aynı yerde, aynı sakin şeyi yaptığında, orada bulunmak bile seni yavaşlatmaya başlar. Bu yüzden küçük ve sabit bir durak, dağınık bir günün ortasında bile seni kendine çağırır.

### Köşen neye benzemeli?

- Az eşya: bir oturak, bir battaniye, belki bir vazo.
- Doğal ışık: mümkünse bir pencerenin yanı.
- Ekran yok: telefon başka odada ya da sessizde.

> Bir yere ait hissettiğinde, içinde de bir yer açılır.

## Ritüeli küçük tut

Köşende sadece beş dakika geçirmek bile yeterlidir. Otur, nefesini fark et, bir soru sor: "Şu an neye ihtiyacım var?" Cevabı yazmak zorunda değilsin; yalnızca duy.

---

Tekrar ettikçe bu köşe, zihnine "burada yavaşlayabilirsin" diyen bir işarete dönüşür.`,
  },
  {
    title: 'Düşünceden Eyleme: Küçük Adımların Sessiz Gücü',
    summary:
      'Büyük kararların önünde bekleyenler için: yön bulmak, çoğu zaman tek bir küçük adımla başlar.',
    category: 'Dönüşüm',
    tags: ['dönüşüm', 'alışkanlık', 'eyleme geçmek'],
    readTime: '4 dk okuma',
    featured: false,
    daysAgo: 11,
    cover: 'public/assets/light_abstract_bg.png',
    content: `Çoğumuz için değişim, büyük bir kararın ardından gelen büyük bir hareket gibi görünür. Oysa gerçek dönüşüm çoğu zaman sessizdir ve küçük adımlarla ilerler.

## Netlik, hareketten sonra da gelir

Her şeyi çözmeden başlayamayacağını düşünmek, bekleme halini uzatır. Çoğu zaman netlik, ilk adımı attıktan sonra oluşur. Yürürken yol görünür olur.

### Adımı küçültmenin üç sorusu

- Bunu bu hafta yapabileceğim en küçük hâli nedir?
- Bu adım beni neye biraz daha yaklaştırır?
- Yapmazsam, ne kaybederim; yaparsam ne öğrenirim?

> Mükemmel plan değil, nazik bir başlangıç istiyoruz.

## Devam etmek, hızlanmaktan önemlidir

Bir adım attıktan sonra kendini yargılamak yerine gözlemle: Ne değişti, ne hissettim? Bu farkındalık, bir sonraki adımı hem daha net hem daha hafif yapar.

---

Bugün yalnızca tek bir küçük adım seç ve onu bu hafta içinde tamamla.`,
  },
];

/** Some shipped images are JPEGs saved with a .png name, so trust the bytes, not the extension. */
function detectMime(bytes: Buffer): string {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  throw new Error('Cover image must be a PNG, JPEG or WebP file.');
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Mock posts are for development only and will not run in production.');
  }

  for (const mock of MOCK_POSTS) {
    const existing = await db('blog_posts').where({ title: mock.title }).first();
    if (existing) {
      console.log(`Skipped (already exists): ${mock.title}`);
      continue;
    }

    const image = await readFile(path.resolve(mock.cover));
    const coverImage = await storeBlogImage(image, detectMime(image));
    const slug = await uniqueSlug(mock.title, async (candidate) => Boolean(await findBySlug(candidate)));

    const created = await createPost(slug, {
      title: mock.title,
      summary: mock.summary,
      content: mock.content,
      category: mock.category,
      tags: mock.tags,
      readTime: mock.readTime,
      coverImage,
      featured: mock.featured,
      published: true,
    });

    const createdAt = new Date(Date.now() - mock.daysAgo * 24 * 60 * 60 * 1000);
    await db('blog_posts').where({ id: created.id }).update({ created_at: createdAt, updated_at: createdAt });
    console.log(`Added: /blog/${slug}`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.destroy());
