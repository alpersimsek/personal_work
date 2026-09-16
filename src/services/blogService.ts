import { BlogPost, BlogFilterOptions } from '../types';

const BLOG_STORAGE_KEY = 'tugba_coaching_blogs';

// High quality Turkish seed blog posts tailored for Tuğba Ergüner Şimşek - Yaşam Koçluğu
const SEED_BLOG_POSTS: BlogPost[] = [
  {
    id: 'blog-1',
    title: 'Bulanıklıktan Netliğe: Karar Alma Süreçlerinde İçsel Pusulanızı Keşfedin',
    slug: 'bulanikliktan-netlige-kendi-pusulanizi-kesfedin',
    summary: 'Hayatımızın en kritik dönüm noktalarında karmaşa ve zihinsel gürültü karar almamızı güçleştirebilir. İşte içsel değerlerinizle hizalanarak netlik kazanmanın 4 temel adımı.',
    category: 'İçsel Netlik',
    tags: ['Karar Alma', 'Farkındalık', 'İçsel Pusula', 'Yaşam Koçluğu'],
    author: 'Tuğba Ergüner Şimşek',
    readTime: '5 dk okuma',
    date: '15 Eylül 2026',
    coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    published: true,
    featured: true,
    likes: 42,
    views: 310,
    createdAt: '2026-09-15T10:00:00.000Z',
    updatedAt: '2026-09-15T10:00:00.000Z',
    content: `
# Bulanıklıktan Netliğe: Karar Alma Süreçlerinde İçsel Pusulanızı Keşfedin

Günümüz dünyasında sürekli bilgiye, beklentilere ve dış uyarılara maruz kalıyoruz. Kariyer değiştirmek, ilişkilerimizde sınır çizmek ya da hayatımıza yeni bir yön vermek istediğimizde karşımıza çıkan en büyük engel zihnimizdeki gürültüdür.

## 1. Zihinsel Gürültüyü Yavaşlatın
Karar alma anında hissettiğiniz karmaşanın nedeni bilgi eksikliği değil, aşırı bilgi yüklemesidir. Kendinize şu soruyu sorun:
> *"Şu an aldığım kararda başkalarının onayını mı arıyorum, yoksa kendi öz değerlerimi mi yansıtıyorum?"*

## 2. Kararı Değerler Süzgecinden Geçirin
İçsel pusulanız, temel değerlerinizle biçimlenir. Eğer 'Özgürlük' ve 'Gelişim' ana değerleriniz arasındaysa, size güvenlik hissettiren ama gelişiminizi kısıtlayan bir seçim uzun vadede huzursuzluk yaratacaktır.

## 3. Eyleme Geçilebilir Küçük Bir Adım Belirleyin
Netlik, düşünerek değil, **eyleme geçerek** oluşur. Zihninizdeki büyük resmi bir kenara bırakın ve bugün atabileceğiniz en küçük mikro adımı atın.

---
*İçsel pusulanızla yeniden bağ kurmak ve profesyonel koçluk desteği almak için ön görüşme randevusu oluşturabilirsiniz.*
`,
  },
  {
    id: 'blog-2',
    title: 'Zihinsel Gürültüyü Susturmak: Günlük Hayatta Mikro Farkındalık Pratikleri',
    slug: 'zihinsel-gurultuyu-susturmak-mikro-farkindalik',
    summary: 'Gün boyu süren zihinsel diyalogları durdurmak için saatlerce meditasyon yapmanıza gerek yok. İş ve özel hayatınızda uygulayabileceğiniz 1 dakikalık farkındalık mola teknikleri.',
    category: 'Farkındalık',
    tags: ['Mindfulness', 'Nefes', 'Stres Yönetimi', 'Denge'],
    author: 'Tuğba Ergüner Şimşek',
    readTime: '4 dk okuma',
    date: '10 Eylül 2026',
    coverImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1200&q=80',
    published: true,
    featured: false,
    likes: 28,
    views: 195,
    createdAt: '2026-09-10T14:30:00.000Z',
    updatedAt: '2026-09-10T14:30:00.000Z',
    content: `
# Zihinsel Gürültüyü Susturmak: Günlük Hayatta Mikro Farkındalık Pratikleri

Çoğu zaman 'burada' olduğumuzu sanırız ama zihnimiz ya dünün muhasebesini yapmaktadır ya da yarının kaygılarını kurgulamaktadır. 

## 1 Dakikalık "Durakla ve Hissedim" Tekniği
İş gününüzün ortasında, bilgisayar ekranından gözlerinizi çekin ve 60 saniye boyunca sadece nefesinize odaklanın:
- **4 Saniye**: Derin nefes alın.
- **4 Saniye**: Tutun.
- **6 Saniye**: Yavaşça bırakın.

Bu mikro molalar, sinir sisteminizi sakinleştirir ve bedeniniz ile zihniniz arasındaki bağı güçlendirir.
`,
  },
  {
    id: 'blog-3',
    title: 'Değişim Korkusuyla Barışmak: Konfor Alanının Ötesindeki Potansiyel',
    slug: 'degisim-korkusuyla-barismak-konfor-alani',
    summary: 'Konfor alanı güvenli hissettirir ama potansiyelimizi ortaya çıkarmamızı engeller. Değişim korkusunu felç edici bir güçten geliştirici bir yakıta dönüştürme rehberi.',
    category: 'Dönüşüm',
    tags: ['Konfor Alanı', 'Dönüşüm', 'Cesaret', 'Kişisel Gelişim'],
    author: 'Tuğba Ergüner Şimşek',
    readTime: '6 dk okuma',
    date: '04 Eylül 2026',
    coverImage: 'https://images.unsplash.com/photo-1499209974431-9dac3ada00d7?auto=format&fit=crop&w=1200&q=80',
    published: true,
    featured: false,
    likes: 56,
    views: 420,
    createdAt: '2026-09-04T09:15:00.000Z',
    updatedAt: '2026-09-04T09:15:00.000Z',
    content: `
# Değişim Korkusuyla Barışmak: Konfor Alanının Ötesindeki Potansiyel

Değişim, tanıdık olanın güvenli limanından ayrılmak demektir. Beynimiz evrimsel olarak bilinmeyeni bir 'tehdit' olarak algılamaya programlanmıştır. Ancak hayatınızdaki en büyük sıçramalar, tam da bu korkunun üzerine yürüdüğünüz anlarda gerçekleşir.

## Korkuyu Yenmek Yerine Anlamak
Korkuyu yok etmeye çalışmak yerine, ona bir alan açın. *"Bu adım beni neden korkutuyor?"* sorusunun cevabı, sizin en çok gelişmek istediğiniz alanı işaret eder.
`,
  },
  {
    id: 'blog-4',
    title: 'Duygusal Dayanıklılık: Zorlu Dönemlerde Kendi Merkezinizde Kalabilmek',
    slug: 'duygusal-dayaniklilik-kendi-merkezinizde-kalabilmek',
    summary: 'Hayatın fırtınaları karşısında devrilmeyen bir ağaç gibi esneyebilmek. İş ve özel hayat stresinde duygusal dayanıklılığı (Resilience) inşa etmenin pratik yolları.',
    category: 'Kariyer & Liderlik',
    tags: ['Duygusal Dayanıklılık', 'Stres', 'Resilience', 'Liderlik'],
    author: 'Tuğba Ergüner Şimşek',
    readTime: '5 dk okuma',
    date: '28 Ağustos 2026',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    published: true,
    featured: false,
    likes: 39,
    views: 280,
    createdAt: '2026-08-28T16:00:00.000Z',
    updatedAt: '2026-08-28T16:00:00.000Z',
    content: `
# Duygusal Dayanıklılık: Zorlu Dönemlerde Kendi Merkezinizde Kalabilmek

Duygusal dayanıklılık, hiçbir zaman üzülmemek ya da sarsılmamak demek değildir. Aksine, sarsıldıktan sonra kendi merkezinize ne kadar hızlı dönebildiğinizle ilgilidir.

## Öz Şefkat: En Büyük Gücünüz
Zor zamanlarda kendinizi eleştirmek yerine, iyi bir dostunuza göstereceğiniz anlayışı kendi varlığınıza sunun.
`,
  },
];

function getStoredPosts(): BlogPost[] {
  try {
    const raw = localStorage.getItem(BLOG_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BLOG_STORAGE_KEY, JSON.stringify(SEED_BLOG_POSTS));
      return SEED_BLOG_POSTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Fallback if localStorage corrupt
  }
  return SEED_BLOG_POSTS;
}

function savePosts(posts: BlogPost[]): void {
  try {
    localStorage.setItem(BLOG_STORAGE_KEY, JSON.stringify(posts));
  } catch {
    // Storage quota fallback
  }
}

export const blogService = {
  /**
   * Retrieves paginated & filtered published blog posts for public visitors
   */
  getPublishedPosts(options: BlogFilterOptions = {}): {
    posts: BlogPost[];
    total: number;
    totalPages: number;
    currentPage: number;
  } {
    const all = getStoredPosts().filter((p) => p.published);
    const { category = 'Tümü', searchQuery = '', page = 1, limit = 6 } = options;

    let filtered = all;

    if (category && category !== 'Tümü') {
      filtered = filtered.filter((p) => p.category === category);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const start = (currentPage - 1) * limit;
    const posts = filtered.slice(start, start + limit);

    return { posts, total, totalPages, currentPage };
  },

  /**
   * Retrieves all posts including unpublished drafts (Admin view)
   */
  getAllPosts(): BlogPost[] {
    return getStoredPosts();
  },

  /**
   * Get single blog post by slug
   */
  getPostBySlug(slug: string): BlogPost | undefined {
    const posts = getStoredPosts();
    const found = posts.find((p) => p.slug === slug || p.id === slug);
    if (found) {
      // Increment view count asynchronously
      found.views = (found.views || 0) + 1;
      savePosts(posts);
    }
    return found;
  },

  /**
   * Increment like count for a post
   */
  likePost(id: string): number {
    const posts = getStoredPosts();
    const post = posts.find((p) => p.id === id);
    if (post) {
      post.likes = (post.likes || 0) + 1;
      savePosts(posts);
      return post.likes;
    }
    return 0;
  },

  /**
   * Create a new blog post
   */
  createPost(newPostData: Partial<BlogPost>): BlogPost {
    const posts = getStoredPosts();
    const now = new Date();
    const formattedDate = now.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const slugBase = (newPostData.title || 'makale')
      .toLowerCase()
      .replace(/[^a-z0-9ğüşıöç\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    const created: BlogPost = {
      id: 'blog-' + Date.now(),
      title: newPostData.title || 'Yeni Makale',
      slug: `${slugBase}-${Date.now().toString().slice(-4)}`,
      summary: newPostData.summary || '',
      content: newPostData.content || '',
      category: newPostData.category || 'İçsel Netlik',
      tags: newPostData.tags || ['Yaşam Koçluğu'],
      author: 'Tuğba Ergüner Şimşek',
      readTime: newPostData.readTime || '4 dk okuma',
      date: formattedDate,
      coverImage:
        newPostData.coverImage ||
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
      published: newPostData.published ?? true,
      featured: newPostData.featured ?? false,
      likes: 0,
      views: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    posts.unshift(created);
    savePosts(posts);
    return created;
  },

  /**
   * Update existing blog post
   */
  updatePost(id: string, updatedData: Partial<BlogPost>): BlogPost | null {
    const posts = getStoredPosts();
    const index = posts.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const existing = posts[index];
    const updated: BlogPost = {
      ...existing,
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };

    posts[index] = updated;
    savePosts(posts);
    return updated;
  },

  /**
   * Delete blog post by id
   */
  deletePost(id: string): boolean {
    const posts = getStoredPosts();
    const filtered = posts.filter((p) => p.id !== id);
    if (filtered.length !== posts.length) {
      savePosts(filtered);
      return true;
    }
    return false;
  },

  /**
   * Toggle published status
   */
  togglePublish(id: string): boolean {
    const posts = getStoredPosts();
    const post = posts.find((p) => p.id === id);
    if (post) {
      post.published = !post.published;
      savePosts(posts);
      return post.published;
    }
    return false;
  },

  /**
   * Export all posts as JSON string for backup
   */
  exportPostsJSON(): string {
    return JSON.stringify(getStoredPosts(), null, 2);
  },

  /**
   * Import posts from JSON string
   */
  importPostsJSON(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        savePosts(parsed);
        return true;
      }
    } catch {
      // Invalid JSON
    }
    return false;
  },
};

/**
 * Client-side cover image formatter & optimizer
 * Formats any uploaded image into 16:9 HD ratio (1200x675px), auto-cropped and compressed for fast storage.
 */
export async function formatCoverImage(
  file: File,
  targetWidth = 1200,
  targetHeight = 675,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Görsel dosyası okunamadı.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Görsel yükleme hatası.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Görsel işleme hazırlanamadı.'));
        }

        // Center Crop (Object-Fit: Cover) calculation for exact 16:9 aspect ratio
        const sourceAspect = img.width / img.height;
        const targetAspect = targetWidth / targetHeight;

        let srcX = 0,
          srcY = 0,
          srcW = img.width,
          srcH = img.height;

        if (sourceAspect > targetAspect) {
          srcW = img.height * targetAspect;
          srcX = (img.width - srcW) / 2;
        } else {
          srcH = img.width / targetAspect;
          srcY = (img.height - srcH) / 2;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Background fill for transparent PNGs
        ctx.fillStyle = '#FAF9F5';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Draw cropped and scaled image onto 1200x675 canvas
        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetWidth, targetHeight);

        // Convert canvas output to compressed JPEG Data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

