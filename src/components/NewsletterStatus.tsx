import React, { useCallback, useEffect, useState } from 'react';
import { BlogPost } from '../types';
import { blogService, NewsletterStatusData } from '../services/blogService';

interface Props {
  post: BlogPost;
  onChanged: () => void;
  onNotice: (type: 'success' | 'error', text: string) => void;
}

type NewsletterCounts = NewsletterStatusData['counts'];

/**
 * Decides the badge text for a post's newsletter.
 *
 * A post that was already sent keeps showing its progress even if the
 * newsletter was cancelled afterwards, so `newsletterSentAt` is checked
 * before `newsletterEnabled`.
 */
export function newsletterLabel(
  post: Pick<BlogPost, 'published' | 'newsletterEnabled' | 'newsletterScheduledAt' | 'newsletterSentAt'>,
  counts: NewsletterCounts | null | undefined,
): string | null {
  if (!post.published) return null;
  if (post.newsletterSentAt) {
    if (!counts) return 'Bülten: gönderildi';
    const total = counts.pending + counts.sending + counts.sent + counts.failed + counts.skipped;
    if (total === 0) return 'Bülten: gönderildi';
    return `Bülten: ${counts.sent}/${total} gönderildi`;
  }
  if (!post.newsletterEnabled) return 'Bülten: kapalı';
  if (post.newsletterScheduledAt) return 'Bülten: zamanlandı';
  return 'Bülten: bekliyor';
}

/** Newsletter state and actions for one article in the admin list. */
export const NewsletterStatus: React.FC<Props> = ({ post, onChanged, onNotice }) => {
  const [status, setStatus] = useState<NewsletterStatusData | null>(null);
  const [busy, setBusy] = useState(false);
  const showsProgress = post.published && Boolean(post.newsletterSentAt);

  const load = useCallback(async (isStale: () => boolean = () => false) => {
    if (!showsProgress) {
      setStatus(null);
      return;
    }
    try {
      const next = await blogService.getNewsletterStatus(post.id);
      if (!isStale()) setStatus(next);
    } catch {
      if (!isStale()) setStatus(null);
    }
  }, [post.id, showsProgress]);

  useEffect(() => {
    let ignore = false;
    void load(() => ignore);
    return () => { ignore = true; };
  }, [load]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await action();
      onNotice('success', success);
      onChanged();
      await load();
    } catch (error) {
      onNotice('error', error instanceof Error ? error.message : 'İşlem tamamlanamadı.');
    } finally {
      setBusy(false);
    }
  };

  const counts = status?.counts;
  const retryable = status?.retryableFailed ?? 0;
  const label = newsletterLabel(post, counts);

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-neutral-600">
      {label && <span className="px-2.5 py-0.5 rounded font-semibold bg-neutral-100 border border-neutral-200">{label}</span>}
      {post.published && post.newsletterEnabled && !post.newsletterSentAt && post.newsletterScheduledAt && (
        <button type="button" disabled={busy} className="btn btn-secondary btn-sm"
          aria-label={`Gönderimi iptal et: ${post.title}`}
          onClick={() => void run(() => blogService.cancelNewsletter(post.id), 'Bülten gönderimi iptal edildi.')}>
          Gönderimi iptal et
        </button>
      )}
      {showsProgress && retryable > 0 && (
        <button type="button" disabled={busy} className="btn btn-secondary btn-sm"
          aria-label={`${retryable} başarısız gönderimi yeniden dene: ${post.title}`}
          onClick={() => void run(() => blogService.retryNewsletter(post.id), 'Başarısız gönderimler yeniden denenecek.')}>
          {retryable} başarısız gönderimi yeniden dene
        </button>
      )}
      <button type="button" disabled={busy} className="btn btn-ghost btn-sm"
        aria-label={`Test e-postası gönder: ${post.title}`}
        onClick={() => void run(() => blogService.sendNewsletterTest(post.id), 'Test e-postası size gönderildi.')}>
        Test e-postası gönder
      </button>
    </div>
  );
};
