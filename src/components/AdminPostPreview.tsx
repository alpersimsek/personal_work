import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { BlogPost } from '../types';
import { BlogDetailPage } from '../pages/BlogDetailPage';

interface AdminPostPreviewProps {
  post: BlogPost;
  /** True when the post is live; false for a draft nobody else can see yet. */
  isPublished: boolean;
  /** True when the preview shows edits that are not saved over the live version. */
  showsUnsavedChanges: boolean;
  busy: boolean;
  onClose: () => void;
  onPublish: () => void;
}

const noop = () => {};

/**
 * Full-screen preview of an article exactly as visitors will see it.
 *
 * A slim bar on top says what state the article is in and offers the two next
 * steps: go back to editing, or publish it right from here.
 */
export const AdminPostPreview: React.FC<AdminPostPreviewProps> = ({
  post,
  isPublished,
  showsUnsavedChanges,
  busy,
  onClose,
  onPublish,
}) => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  const status = !isPublished
    ? 'Taslak olarak kaydedildi. Henüz yalnızca sen görebilirsin.'
    : showsUnsavedChanges
      ? 'Yayındaki makalede kaydetmediğin değişiklikleri görüyorsun. Henüz canlıya alınmadı.'
      : 'Bu makale yayında.';

  return (
    <div role="dialog" aria-modal="true" aria-label="Makale önizlemesi" className="fixed inset-0 z-[60] flex flex-col bg-black">
      <div className="shrink-0 border-b border-neutral-200 bg-white text-neutral-900">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 rounded-md bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-800">
              Önizleme
            </span>
            <p className="text-xs text-neutral-600 sm:text-sm">{status}</p>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
              <ArrowLeft size={15} />
              <span>Editöre dön</span>
            </button>
            {!isPublished && (
              <button type="button" onClick={onPublish} disabled={busy} className="btn btn-primary btn-sm">
                {busy ? 'Yayınlanıyor…' : 'Yayına al'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <BlogDetailPage post={post} isPreview onNavigateBack={onClose} onOpenBooking={noop} onSelectPost={noop} />
      </div>
    </div>
  );
};
