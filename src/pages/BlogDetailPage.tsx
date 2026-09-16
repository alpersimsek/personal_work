import React, { useState, useEffect } from 'react';
import type { BlogPost } from '../types';
import { blogService } from '../services/blogService';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import '../styles/blog.css';

interface BlogDetailPageProps {
  post: BlogPost | null;
  onNavigateBack: () => void;
  onOpenBooking: () => void;
  onSelectPost: (post: BlogPost) => void;
}

export const BlogDetailPage: React.FC<BlogDetailPageProps> = ({
  post,
  onNavigateBack,
  onOpenBooking,
  onSelectPost,
}) => {
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (post) {
      setLikesCount(post.likes || 0);
      setHasLiked(false);

      // Fetch related posts in same category
      const { posts: allPublished } = blogService.getPublishedPosts({ limit: 10 });
      const related = allPublished
        .filter((p) => p.id !== post.id && (p.category === post.category || true))
        .slice(0, 2);
      setRelatedPosts(related);
    }
  }, [post]);

  if (!post) {
    return (
      <div className="bg-black text-white min-h-screen flex flex-col justify-between blog-scope">
        <Navbar onOpenBooking={onOpenBooking} />
        <div className="text-center py-32">
          <p className="text-white/60">Makale bulunamadı veya kaldırılmış olabilir.</p>
          <button
            onClick={onNavigateBack}
            className="mt-4 px-6 py-2 rounded-xl bg-white text-black text-xs font-medium"
          >
            Blog Listesine Dön
          </button>
        </div>
        <Footer onOpenBooking={onOpenBooking} />
      </div>
    );
  }

  const handleLike = () => {
    if (!hasLiked) {
      const updatedLikes = blogService.likePost(post.id);
      setLikesCount(updatedLikes);
      setHasLiked(true);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderFormattedContent = (contentStr: string) => {
    const lines = contentStr.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-5" />;

      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={idx} className="blog-title text-3xl sm:text-4xl lg:text-5xl font-light text-white my-8 border-b border-white/10 pb-4 tracking-tight">
            {trimmed.slice(2)}
          </h1>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="blog-title text-2xl sm:text-3xl font-light text-white my-6 tracking-tight">
            {trimmed.slice(3)}
          </h2>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="blog-title text-xl sm:text-2xl font-normal text-white/95 my-5">
            {trimmed.slice(4)}
          </h3>
        );
      }
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote key={idx} className="blog-quote text-lg sm:text-xl italic text-white/90 bg-white/5 border-l-2 border-white/30 p-6 rounded-2xl my-8 leading-relaxed shadow-sm">
            {trimmed.slice(2)}
          </blockquote>
        );
      }
      if (trimmed.startsWith('- ')) {
        return (
          <li key={idx} className="blog-body-p text-white/85 text-base sm:text-lg my-2.5 list-disc leading-relaxed ml-6">
            {trimmed.slice(2)}
          </li>
        );
      }
      if (trimmed === '---') {
        return <hr key={idx} className="my-10 border-white/10" />;
      }

      return (
        <p key={idx} className="blog-body-p text-white/85 text-base sm:text-lg leading-relaxed sm:leading-loose my-5 tracking-wide">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col w-full selection:bg-white/20 font-sans blog-scope">
      <Navbar onOpenBooking={onOpenBooking} />

      <main className="flex-1 pt-28 sm:pt-32 pb-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        {/* Back Link */}
        <button
          onClick={onNavigateBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white transition-colors mb-8 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Tüm Yazılara Dön</span>
        </button>

        {/* Article Header & Title Box */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-white border border-white/15 shadow-sm">
              {post.category}
            </span>
          </div>

          <h1 className="serif-font text-3xl sm:text-4xl lg:text-5xl font-light text-white leading-tight tracking-tight mb-6">
            {post.title}
          </h1>

          {/* Author & Metadata Bar */}
          <div className="px-6 sm:px-8 py-4 bg-neutral-900 border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs text-white/60 font-medium mb-6 shadow-sm font-sans">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                TÊ
              </div>
              <div>
                <span className="text-white font-semibold block text-sm">{post.author}</span>
                <span className="text-[11px] text-white/40 font-normal">ICF Unvanlı Profesyonel Koç</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-white/60">
              <span>{post.date}</span>
              <span>•</span>
              <span>{post.readTime}</span>
              <span>•</span>
              <span>{post.views || 0} Görüntülenme</span>
            </div>
          </div>

          {/* Cover Image Container */}
          <div className="w-full aspect-[16/9] max-h-[480px] rounded-3xl overflow-hidden border border-white/10 shadow-xl bg-neutral-900">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </header>

        {/* Article Content Card */}
        <div className="bg-neutral-900/40 border border-white/10 rounded-3xl p-6 sm:p-12 mb-12 shadow-xl backdrop-blur-sm">
          <div className="prose prose-invert max-w-none">
            {renderFormattedContent(post.content)}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center gap-2 font-sans">
              <span className="text-xs text-white/40 font-semibold">Etiketler:</span>
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-white/5 text-white/70 text-xs font-medium border border-white/10"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Like & Share Action Bar */}
          <div className="mt-8 p-4 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-between font-sans">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                hasLiked
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-xs'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
              }`}
            >
              <svg
                className={`w-4 h-4 ${hasLiked ? 'fill-rose-400 text-rose-400' : 'none'}`}
                fill={hasLiked ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>{hasLiked ? 'Beğenildi!' : 'Faydalı Buldum'} ({likesCount})</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-xs font-semibold transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>{copied ? 'Bağlantı Kopyalandı!' : 'Makaleyi Paylaş'}</span>
            </button>
          </div>

          {/* CTA Box */}
          <div className="mt-10 p-8 rounded-2xl bg-gradient-to-r from-white/10 via-white/5 to-transparent border border-white/15 text-center">
            <h4 className="serif-font text-2xl font-light text-white mb-2">
              Bu konuda zihninizi berraklaştırmak ister misiniz?
            </h4>
            <p className="text-xs sm:text-sm text-white/60 max-w-md mx-auto mb-6 font-sans leading-relaxed">
              Tuğba Ergüner Şimşek ile 15 dakikalık tanışma seansında hedeflerinizi konuşalım.
            </p>
            <button
              onClick={onOpenBooking}
              className="px-8 py-3.5 rounded-xl bg-white text-black hover:bg-neutral-200 font-semibold text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer"
            >
              Ön Görüşme Randevusu Alın
            </button>
          </div>
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <div className="mt-12 font-sans">
            <h3 className="serif-font text-2xl font-light text-white mb-6">
              Diğer Keşfedebileceğiniz Yazılar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedPosts.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectPost(rel)}
                  className="group cursor-pointer bg-neutral-900 border border-white/10 hover:border-white/30 rounded-2xl p-5 transition-all flex items-center gap-4 shadow-sm"
                >
                  <img
                    src={rel.coverImage}
                    alt={rel.title}
                    className="w-20 h-20 rounded-xl object-cover shrink-0 border border-white/10"
                  />
                  <div>
                    <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider block mb-1">
                      {rel.category}
                    </span>
                    <h4 className="serif-font text-sm font-medium text-white group-hover:text-white line-clamp-2">
                      {rel.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer onOpenBooking={onOpenBooking} />
    </div>
  );
};
