import React, { useState, useEffect } from 'react';
import type { BlogPost, BlogCategory } from '../types';
import { blogService } from '../services/blogService';
import { authService } from '../services/authService';

interface BlogSectionProps {
  onSelectPost: (post: BlogPost) => void;
  onOpenLogin: () => void;
  onOpenAdmin: () => void;
  refreshTrigger?: number;
}

const CATEGORIES: (BlogCategory | 'Tümü')[] = [
  'Tümü',
  'Farkındalık',
  'Dönüşüm',
  'Kariyer & Liderlik',
  'İlişkiler',
  'İçsel Netlik',
];

export const BlogSection: React.FC<BlogSectionProps> = ({
  onSelectPost,
  onOpenLogin,
  onOpenAdmin,
  refreshTrigger = 0,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | 'Tümü'>('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [postsData, setPostsData] = useState<{
    posts: BlogPost[];
    total: number;
    totalPages: number;
    currentPage: number;
  }>({ posts: [], total: 0, totalPages: 1, currentPage: 1 });

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    let cancelled = false;
    authService.getSession().then(session => { if (!cancelled) setIsAdmin(session.isLoggedIn); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    blogService.getPublishedPosts({ category: selectedCategory, searchQuery, page: currentPage, limit: 6 })
      .then(result => { if (!cancelled) setPostsData(result); })
      .catch(error => { if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Yazılar yüklenemedi.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCategory, searchQuery, currentPage, refreshTrigger]);

  const handleCategoryChange = (cat: BlogCategory | 'Tümü') => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <section id="blog" className="py-24 relative bg-black border-t border-white/10 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/15 text-xs sm:text-sm text-white/80 font-semibold uppercase tracking-wider mb-4">
              <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>DÜŞÜNCE & FARKINDALIK</span>
            </div>

            <h2 className="serif-font text-2xl sm:text-4xl md:text-5xl font-normal text-white tracking-tight">
              Yazılar & Keşifler
            </h2>
            <p className="text-white/80 text-sm sm:text-base md:text-lg mt-3 max-w-xl font-light leading-relaxed">
              İçsel netlik, farkındalık ve yaşam dönüşümü üzerine kaleme alınan rehber yazılar.
            </p>
          </div>

          {/* Admin Management Quick Link */}
          <div className="hidden sm:flex items-center gap-3">
            {isAdmin ? (
              <button
                onClick={onOpenAdmin}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium text-white transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Yönetici Paneli (Açık)</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/40 hover:text-white/80 transition-colors flex items-center gap-1.5"
                title="Yönetici Girişi"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Yazar Girişi</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-white/10">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-white !text-neutral-950 font-bold shadow-lg scale-105 border border-white'
                    : 'bg-white/10 text-white/80 hover:text-white hover:bg-white/20 border border-white/15'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Makalelerde ara..."
              className="w-full px-4 py-2 pl-9 bg-neutral-900 border border-white/15 rounded-xl text-white placeholder-white/40 text-xs focus:outline-none focus:border-white/40 transition-all"
            />
            <svg className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Blog Post Grid */}
        {loading ? (<p role="status" className="py-12 text-center text-white/60">Yazılar yükleniyor…</p>) : loadError ? (<p role="alert" className="py-12 text-center text-red-300">{loadError}</p>) : postsData.posts.length === 0 ? (
          <div className="text-center py-20 bg-neutral-900/40 rounded-2xl border border-white/10">
            <svg className="w-12 h-12 text-white/20 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-white/60 text-sm font-light">Aradığınız kriterlere uygun makale bulunamadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {postsData.posts.map((post) => (
              <article
                key={post.id}
                onClick={() => onSelectPost(post)}
                className="group cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/25 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full shadow-sm"
              >
                {/* Image Header */}
                <div className="relative h-48 w-full overflow-hidden bg-neutral-900">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70" />

                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-medium bg-black/60 backdrop-blur-md text-white/90 border border-white/15">
                    {post.category}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-[11px] text-white/50 mb-3 font-sans">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>

                  <h3 className="serif-font text-lg font-light text-white group-hover:text-white/90 transition-colors line-clamp-2 mb-3 leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-white/60 text-xs line-clamp-3 mb-6 flex-1 font-sans leading-relaxed">
                    {post.summary}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs font-sans">
                    <span className="text-white/40 text-[11px]">Tuğba Ergüner Şimşek</span>
                    <span className="text-white/90 font-medium group-hover:text-white transition-colors inline-flex items-center gap-1">
                      Oku
                      <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {postsData.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/70 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              Önceki
            </button>

            {Array.from({ length: postsData.totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-white !text-neutral-950 font-bold shadow-md'
                    : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20 border border-white/15'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(postsData.totalPages, p + 1))}
              disabled={currentPage === postsData.totalPages}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/70 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              Sonraki
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
