import React, { useState, useEffect } from 'react';
import type { BlogPost } from '../types';
import { blogService } from '../services/blogService';
import { PostCover } from './PostCover';

interface BlogPostModalProps {
  post: BlogPost | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking: () => void;
}

export const BlogPostModal: React.FC<BlogPostModalProps> = ({
  post,
  isOpen,
  onClose,
  onOpenBooking,
}) => {
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [likeError, setLikeError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (post) {
      setLikesCount(post.likes || 0);
      setHasLiked(false);
      setLikeError('');
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const handleLike = async () => {
    if (hasLiked || likePending) return;
    setLikePending(true);
    setLikeError('');
    try {
      setLikesCount(await blogService.likePost(post.id));
      setHasLiked(true);
    } catch (error) {
      setLikeError(error instanceof Error ? error.message : 'Beğeni kaydedilemedi.');
    } finally { setLikePending(false); }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Convert markdown-style content to clean HTML structure
  const renderFormattedContent = (contentStr: string) => {
    const lines = contentStr.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-4" />;

      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={idx} className="serif-font text-2xl sm:text-3xl font-light text-white my-6 border-b border-white/10 pb-3">
            {trimmed.slice(2)}
          </h1>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="serif-font text-xl sm:text-2xl font-light text-white my-5">
            {trimmed.slice(3)}
          </h2>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="serif-font text-lg font-normal text-white/90 my-4">
            {trimmed.slice(4)}
          </h3>
        );
      }
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote key={idx} className="my-6 p-4 rounded-xl bg-white/5 border-l-2 border-white/40 italic text-white/80 text-sm sm:text-base">
            {trimmed.slice(2)}
          </blockquote>
        );
      }
      if (trimmed.startsWith('- ')) {
        return (
          <li key={idx} className="ml-5 text-white/70 text-sm sm:text-base my-1 list-disc">
            {trimmed.slice(2)}
          </li>
        );
      }
      if (trimmed === '---') {
        return <hr key={idx} className="my-8 border-white/10" />;
      }

      return (
        <p key={idx} className="text-white/75 text-sm sm:text-base leading-relaxed my-3 font-sans">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div
      id="blog-post-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-neutral-900 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl text-white flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="btn btn-secondary btn-icon btn-sm absolute top-4 right-4 z-20"
          aria-label="Kapat"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1">
          {/* Cover Header */}
          <div className="relative h-64 sm:h-80 w-full overflow-hidden">
            <PostCover src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/60 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/15 backdrop-blur-md text-white border border-white/20 mb-3">
                {post.category}
              </span>
              <h1 className="serif-font text-2xl sm:text-3xl font-light text-white leading-tight">
                {post.title}
              </h1>
            </div>
          </div>

          {/* Author & Meta Bar */}
          <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-white/50 bg-black/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-medium text-xs">
                TÊ
              </div>
              <div>
                <span className="text-white font-medium block">{post.author}</span>
                <span className="text-[10px] text-white/40">ICF Unvanlı Profesyonel Koç</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span>{post.date}</span>
              <span>•</span>
              <span>{post.readTime}</span>
              <span>•</span>
              <span>{post.views || 0} Görüntülenme</span>
            </div>
          </div>

          {/* Article Body */}
          <div className="px-6 sm:px-10 py-8">
            <div className="prose prose-invert max-w-none">
              {renderFormattedContent(post.content)}
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-2">
                <span className="text-xs text-white/40 font-medium">Etiketler:</span>
                {post.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-white/5 text-white/60 text-xs border border-white/10"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Action Bar (Like & Share) */}
            <div className="mt-8 p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
              <button
                onClick={handleLike}
                  disabled={likePending || hasLiked}
                  title={likeError || undefined}
                className={`btn btn-sm ${hasLiked ? 'btn-danger' : 'btn-secondary'}`}
              >
                <svg
                  className={`w-4 h-4 ${hasLiked ? 'fill-current' : 'none'}`}
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
                {likeError && <p role="alert" className="text-red-400 text-sm">{likeError}</p>}

              <button
                onClick={handleShare}
                className="btn btn-secondary btn-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>{copied ? 'Bağlantı Kopyalandı!' : 'Paylaş'}</span>
              </button>
            </div>

            {/* CTA Banner */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 border border-white/15 text-center">
              <h4 className="serif-font text-xl font-light text-white mb-2">
                Bu konuda zihninizi berraklaştırmak ister misiniz?
              </h4>
              <p className="text-xs text-white/60 max-w-md mx-auto mb-4 font-sans">
                Tuğba Ergüner Şimşek ile 30 dakikalık tanışma seansında hedeflerinizi konuşalım.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenBooking();
                }}
                className="btn btn-primary"
              >
                Ön Görüşme Randevusu Alın
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
