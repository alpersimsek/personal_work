import { BlogPost, BlogFilterOptions } from '../types';

interface ApiBlogPost {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  read_time: string;
  cover_image: string;
  published: boolean;
  featured: boolean;
  likes: number;
  views: number;
  created_at: string;
  updated_at: string;
}

function toBlogPost(row: ApiBlogPost): BlogPost {
  return {
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    summary: row.summary ?? '',
    category: row.category ?? 'Farkındalık',
    tags: row.tags ?? [],
    author: row.author ?? 'Tuğba Ergüner Şimşek',
    readTime: row.read_time ?? '5 dk okuma',
    date: new Date(row.created_at).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    coverImage: row.cover_image ?? '',
    published: Boolean(row.published),
    featured: Boolean(row.featured),
    likes: row.likes,
    views: row.views,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    content: row.content ?? '',
  };
}

async function parseJsonOrThrow(response: Response): Promise<any> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Bir hata oluştu.');
  }
  return data;
}

export const blogService = {
  async getPublishedPosts(options: BlogFilterOptions = {}): Promise<{
    posts: BlogPost[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const params = new URLSearchParams();
    if (options.category && options.category !== 'Tümü') params.set('category', options.category);
    if (options.searchQuery) params.set('searchQuery', options.searchQuery);
    params.set('page', String(options.page ?? 1));
    params.set('limit', String(options.limit ?? 6));

    const response = await fetch(`/api/posts?${params.toString()}`);
    const data = await parseJsonOrThrow(response);
    return {
      posts: data.posts.map(toBlogPost),
      total: data.total,
      totalPages: data.totalPages,
      currentPage: data.currentPage,
    };
  },

  async getAllPosts(): Promise<BlogPost[]> {
    const response = await fetch('/api/admin/posts', { credentials: 'include' });
    const data = await parseJsonOrThrow(response);
    return data.map(toBlogPost);
  },

  async getPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const response = await fetch(`/api/posts/${encodeURIComponent(slug)}`);
    if (response.status === 404) return undefined;
    const data = await parseJsonOrThrow(response);
    return toBlogPost(data);
  },

  async likePost(id: string): Promise<number> {
    const response = await fetch(`/api/posts/${encodeURIComponent(id)}/like`, { method: 'POST' });
    const data = await parseJsonOrThrow(response);
    return data.likes;
  },

  async createPost(newPostData: Partial<BlogPost>): Promise<BlogPost> {
    const response = await fetch('/api/admin/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newPostData),
    });
    const data = await parseJsonOrThrow(response);
    return toBlogPost(data);
  },

  async updatePost(id: string, updatedData: Partial<BlogPost>): Promise<BlogPost | null> {
    const response = await fetch(`/api/admin/posts/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updatedData),
    });
    if (response.status === 404) return null;
    const data = await parseJsonOrThrow(response);
    return toBlogPost(data);
  },

  async deletePost(id: string): Promise<boolean> {
    const response = await fetch(`/api/admin/posts/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
    if (response.status === 404) return false;
    await parseJsonOrThrow(response);
    return true;
  },

  async togglePublish(id: string): Promise<boolean> {
    const response = await fetch(`/api/admin/posts/${encodeURIComponent(id)}/publish`, { method: 'PATCH', credentials: 'include' });
    const data = await parseJsonOrThrow(response);
    return data.published;
  },
};

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

