import React, { useEffect, useState } from 'react';
import type { BlogPost } from '../types';
import { blogService } from '../services/blogService';

interface BlogSectionHomeProps {
  onSelectPost: (post: BlogPost) => void;
  onNavigateToBlog: () => void;
}

export const BlogSectionHome: React.FC<BlogSectionHomeProps> = ({
  onSelectPost,
  onNavigateToBlog,
}) => {
  // Get latest 3 published posts
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    let cancelled = false;
    blogService.getPublishedPosts({ page: 1, limit: 3 }).then(result => {
      if (!cancelled) { setPosts(result.posts); setTotal(result.total); }
    }).catch(error => { if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Yazılar yüklenemedi.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section id="blog" className="py-24 relative bg-black border-t border-white/10 overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="text-center md:text-left flex flex-col items-center md:items-start">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/15 text-xs sm:text-sm text-white/80 font-semibold uppercase tracking-wider mb-4">
              <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>DÜŞÜNCE & FARKINDALIK</span>
            </div>

            <h2 className="serif-font text-2xl sm:text-4xl md:text-5xl font-normal text-white tracking-tight">
              Son Yazılar
            </h2>
            <p className="text-white/80 text-sm sm:text-base md:text-lg mt-3 max-w-xl font-light leading-relaxed">
              İçsel netlik, farkındalık ve yaşam dönüşümü üzerine en güncel makaleler.
            </p>
          </div>

          <button
            onClick={onNavigateToBlog}
            className="self-start md:self-end px-6 py-3 rounded-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-2 group cursor-pointer shadow-md"
          >
            <span>Tüm Yazıları İncele</span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        {loading && <p role="status" className="text-white/60 mb-6">Yazılar yükleniyor…</p>}
        {loadError && <p role="alert" className="text-red-300 mb-6">{loadError}</p>}
        {!loading && !loadError && posts.length === 0 && <p className="text-white/60 mb-6">Henüz yayınlanmış yazı bulunmuyor.</p>}
        {/* 3 Latest Post Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article
              key={post.id}
              onClick={() => onSelectPost(post)}
              className="group cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/25 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full shadow-sm"
            >
              {/* Image Header */}
              <div className="relative h-52 w-full overflow-hidden bg-neutral-900">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70" />

                <span className="absolute top-3 left-3 px-3.5 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-white/90 border border-white/15">
                  {post.category}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-xs text-white/50 mb-3 font-sans">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>

                <h3 className="serif-font text-xl sm:text-2xl font-medium text-white group-hover:text-white/90 transition-colors line-clamp-2 mb-3 leading-snug">
                  {post.title}
                </h3>

                <p className="text-white/80 text-sm sm:text-base line-clamp-3 mb-6 flex-1 font-sans leading-relaxed">
                  {post.summary}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs font-sans">
                  <span className="text-white/40 text-[11px]">Tuğba Ergüner Şimşek</span>
                  <span className="text-white/90 font-medium group-hover:text-white transition-colors inline-flex items-center gap-1">
                    Devamını Oku
                    <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Mobile View All Link */}
        <div className="mt-8 text-center md:hidden">
          <button
            onClick={onNavigateToBlog}
            className="w-full py-3 rounded-xl bg-white/10 text-white text-xs font-medium border border-white/15"
          >
            Tüm Yazıları İncele ({total})
          </button>
        </div>
      </div>
    </section>
  );
};
