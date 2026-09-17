import React, { useState, useEffect, useLayoutEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import type { BlogPost } from '../types';
import { blogService } from '../services/blogService';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ConsultationModal } from '../components/ConsultationModal';
import '../styles/blog.css';

interface BlogDetailPageProps {
  post: BlogPost | null;
  onNavigateBack: () => void;
  onOpenBooking: () => void;
  onSelectPost: (post: BlogPost) => void;
  onNavigateHome?: (sectionHref?: string) => void;
}

export const BlogDetailPage: React.FC<BlogDetailPageProps> = ({
  post,
  onNavigateBack,
  onOpenBooking,
  onSelectPost,
  onNavigateHome,
}) => {
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [post]);

  useEffect(() => {
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

  const handleOpenBookingModal = () => {
    setBookingModalOpen(true);
  };

  if (!post) {
    return (
      <div className="bg-black text-white min-h-screen flex flex-col justify-between blog-scope">
        <div className="text-center py-32">
          <p className="text-white/60">Makale bulunamadı veya kaldırılmış olabilir.</p>
          <button
            onClick={onNavigateBack}
            className="mt-4 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold cursor-pointer shadow-sm transition-all"
          >
            Blog Listesine Dön
          </button>
        </div>
        <Footer onOpenBooking={handleOpenBookingModal} onNavigateHome={onNavigateHome} onNavigateBlog={onNavigateBack} />
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
          <h1 key={idx} className="blog-title text-4xl sm:text-5xl font-light text-white my-8 border-b border-white/10 pb-4 tracking-tight">
            {trimmed.slice(2)}
          </h1>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="blog-title text-3xl sm:text-4xl font-light text-white my-6 tracking-tight">
            {trimmed.slice(3)}
          </h2>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="blog-title text-2xl sm:text-3xl font-normal text-white/95 my-5">
            {trimmed.slice(4)}
          </h3>
        );
      }
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote key={idx} className="blog-quote text-xl sm:text-2xl italic text-white/95 bg-white/[0.05] border-l-4 border-white/40 p-6 rounded-2xl my-8 leading-relaxed shadow-sm">
            {trimmed.slice(2)}
          </blockquote>
        );
      }
      if (trimmed.startsWith('- ')) {
        return (
          <li key={idx} className="blog-body-p text-white/80 text-lg sm:text-xl my-2.5 list-disc leading-relaxed ml-6 font-sans">
            {trimmed.slice(2)}
          </li>
        );
      }
      if (trimmed === '---') {
        return <hr key={idx} className="my-10 border-white/10" />;
      }

      return (
        <p key={idx} className="blog-body-p text-white/80 text-lg sm:text-xl leading-relaxed sm:leading-loose my-5 font-sans">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col w-full selection:bg-white/20 font-sans blog-scope">
      <main className="flex-1 pt-28 sm:pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        {/* Back Link */}
        <motion.button
          onClick={onNavigateBack}
          whileHover={{ scale: 1.02, x: -3 }}
          whileTap={{ scale: 0.95 }}
          className="liquid-glass rounded-full px-5 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20 hover:border-white/40 shadow-lg text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-2.5 group cursor-pointer mb-8 select-none"
        >
          <ArrowLeft size={16} className="text-white/80 group-hover:text-white transition-transform group-hover:-translate-x-1" />
          <span>Tüm Yazılara Dön</span>
        </motion.button>

        {/* Article Header & Title Box */}
        <header className="mb-8">
          <h1 className="serif-font text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-tight tracking-tight mb-6">
            {post.title}
          </h1>

          {/* Author & Metadata Bar */}
          <div className="px-6 sm:px-8 py-4 bg-white/[0.04] border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-sm text-white/60 font-medium mb-6 shadow-sm font-sans backdrop-blur-md">
            <div className="flex items-center gap-3.5">
              <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/90 border border-white/15 backdrop-blur-md shadow-xs shrink-0">
                {post.category}
              </span>
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
                TÊ
              </div>
              <div>
                <span className="text-white font-semibold block text-base">{post.author}</span>
                <span className="text-xs text-white/50 font-normal">ICF Unvanlı Profesyonel Koç</span>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium text-white/50">
              <span>{post.date}</span>
              <span>•</span>
              <span>{post.readTime}</span>
              <span>•</span>
              <span>{post.views || 0} Görüntülenme</span>
            </div>
          </div>

          {/* Cover Image Container */}
          <div className="w-full aspect-[16/9] max-h-[480px] rounded-3xl overflow-hidden border border-white/15 shadow-lg bg-neutral-900">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </header>

        {/* Article Content Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 sm:p-12 mb-12 shadow-md backdrop-blur-sm">
          <div className="prose max-w-none">
            {renderFormattedContent(post.content)}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center gap-2 font-sans">
              <span className="text-xs sm:text-sm text-white/50 font-semibold">Etiketler:</span>
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-white/5 text-white/70 text-xs sm:text-sm font-medium border border-white/10"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Like & Share Action Bar */}
          <div className="mt-8 p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between font-sans">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                hasLiked
                  ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>{copied ? 'Bağlantı Kopyalandı!' : 'Makaleyi Paylaş'}</span>
            </button>
          </div>

          {/* CTA Box */}
          <div className="mt-10 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/15 text-center shadow-lg backdrop-blur-md">
            <h4 className="serif-font text-3xl sm:text-4xl font-light text-white mb-2">
              Bu konuda zihninizi berraklaştırmak ister misiniz?
            </h4>
            <p className="text-sm sm:text-base text-white/70 max-w-lg mx-auto mb-6 font-sans leading-relaxed">
              Tuğba Ergüner Şimşek ile 15 dakikalık tanışma seansında hedeflerinizi konuşalım.
            </p>
            <button
              onClick={handleOpenBookingModal}
              className="px-8 py-3.5 rounded-full bg-white text-black hover:bg-white/90 font-semibold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md cursor-pointer inline-flex items-center justify-center gap-2.5"
            >
              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-black font-semibold">Ön Görüşme Randevusu Alın</span>
            </button>
          </div>
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <div className="mt-12 font-sans">
            <h3 className="serif-font text-3xl font-light text-white mb-6">
              Diğer Keşfedebileceğiniz Yazılar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedPosts.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectPost(rel)}
                  className="group cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/25 rounded-2xl p-5 transition-all flex items-center gap-4 shadow-sm"
                >
                  <img
                    src={rel.coverImage}
                    alt={rel.title}
                    className="w-20 h-20 rounded-xl object-cover shrink-0 border border-white/15"
                  />
                  <div>
                    <span className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1">
                      {rel.category}
                    </span>
                    <h4 className="serif-font text-base sm:text-lg font-normal text-white group-hover:text-white/80 line-clamp-2">
                      {rel.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer onOpenBooking={handleOpenBookingModal} onNavigateHome={onNavigateHome} onNavigateBlog={onNavigateBack} />

      {/* Consultation Booking Modal - 100% Viewport Centered */}
      <ConsultationModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        initialTopic="netlik"
        initialNote={`"${post.title}" başlıklı makalenizi okudum ve bu konuda ön görüşme randevusu almak istiyorum.`}
      />
    </div>
  );
};
