import React, { useState, useEffect, useLayoutEffect } from 'react';
import type { BlogPost, BlogCategory } from '../types';
import { blogService } from '../services/blogService';
import { authService } from '../services/authService';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import '../styles/blog.css';
import { PostCover } from '../components/PostCover';
import { followInPage } from '../utils/followInPage';

interface BlogPageProps {
  onSelectPost: (post: BlogPost) => void;
  onOpenBooking: () => void;
  onNavigateHome: (sectionHref?: string) => void;
  onNavigateAdmin: () => void;
  onOpenLogin: () => void;
}

const CATEGORIES: (BlogCategory | 'Tümü')[] = [
  'Tümü',
  'Farkındalık',
  'Dönüşüm',
  'Kariyer & Liderlik',
  'İlişkiler',
  'İçsel Netlik',
];

export const BlogPage: React.FC<BlogPageProps> = ({
  onSelectPost,
  onOpenBooking,
  onNavigateHome,
  onNavigateAdmin,
  onOpenLogin,
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

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
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
  }, [selectedCategory, searchQuery, currentPage]);

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    let cancelled = false;
    authService.getSession().then(session => { if (!cancelled) setIsAdmin(session.isLoggedIn); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleCategoryChange = (cat: BlogCategory | 'Tümü') => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col w-full selection:bg-white/20">
      {/* Main Container */}
      <main className="flex-1 pt-28 sm:pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10">
            <div>
              <span className="text-xs sm:text-base uppercase tracking-widest text-white/50 font-medium block mb-2">
                Tuğba Ergüner Şimşek • Yayın Arşivi
              </span>
              <h1 className="serif-font text-3xl sm:text-6xl md:text-7xl font-light text-white tracking-tight">
                Tüm Yazılar & Keşifler
              </h1>
              <p className="text-white/60 text-sm sm:text-xl lg:text-base xl:text-lg mt-2 max-w-2xl lg:max-w-none lg:whitespace-nowrap font-sans font-light">
                Farkındalık, dönüşüm ve içsel netlik üzerine hazırlanan tüm makaleleri keşfedin.
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              {isAdmin ? (
                <button
                  onClick={onNavigateAdmin}
                  className="btn btn-primary"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Yazar Paneline Git</span>
                </button>
              ) : (
                <button
                  onClick={onOpenLogin}
                  className="btn btn-secondary"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Yazar Girişi</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className="btn btn-chip" data-active={selectedCategory === cat}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Makalelerde ara..."
              className="w-full px-4 py-2.5 pl-10 bg-neutral-900 border border-white/15 rounded-xl text-white placeholder-white/40 text-base focus:outline-none focus:border-white/40 transition-all shadow-inner"
            />
            <svg className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Blog Post Grid */}
        {loading ? (<p role="status" className="py-12 text-center text-white/60">Yazılar yükleniyor…</p>) : loadError ? (<p role="alert" className="py-12 text-center text-red-300">{loadError}</p>) : postsData.posts.length === 0 ? (
          <div className="text-center py-24 bg-neutral-900/40 rounded-2xl border border-white/10">
            <p className="text-white/60 text-lg font-light">Aradığınız kriterlere uygun makale bulunamadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {postsData.posts.map((post) => (
              <article
                key={post.id}
                className="group relative cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/25 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full shadow-sm"
              >
                {/* Image Header */}
                <div className="relative h-56 w-full overflow-hidden bg-neutral-900">
                  <PostCover src={post.coverImage} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70" />

                  <span className="absolute top-3.5 left-3.5 px-3.5 py-1 rounded-full text-sm font-medium bg-black/60 backdrop-blur-md text-white/90 border border-white/15">
                    {post.category}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-sm text-white/50 mb-3 font-sans">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>

                  <h3 className="serif-font text-2xl font-light text-white group-hover:text-white/90 transition-colors line-clamp-2 mb-3 leading-snug">
<a
  href={`/blog/${encodeURIComponent(post.slug)}`}
  onClick={followInPage(() => onSelectPost(post))}
  className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
>
  {post.title}
</a>
</h3>

                  <p className="text-white/60 text-base line-clamp-3 mb-6 flex-1 font-sans leading-relaxed">
                    {post.summary}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10 text-base font-sans">
                    <span className="text-white/40 text-sm">Tuğba Ergüner Şimşek</span>
                    <span className="text-white/90 font-medium group-hover:text-white transition-colors inline-flex items-center gap-1">
                      Makaleyi Oku
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="flex items-center justify-center gap-2 mt-14">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-chip"
            >
              Önceki
            </button>

            {Array.from({ length: postsData.totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className="btn btn-chip btn-square" data-active={currentPage === pageNum}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(postsData.totalPages, p + 1))}
              disabled={currentPage === postsData.totalPages}
              className="btn btn-chip"
            >
              Sonraki
            </button>
          </div>
        )}
      </main>

      <Footer onOpenBooking={onOpenBooking} onNavigateHome={onNavigateHome} onNavigateBlog={() => window.scrollTo({ top: 0, behavior: 'smooth' })} onOpenLogin={onOpenLogin} />
    </div>
  );
};
