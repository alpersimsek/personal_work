import { escapeHtml } from '../seo/html.js';

export interface BroadcastPost {
  slug: string;
  title: string;
  /** The stored label, e.g. "4 dk okuma". */
  readTime: string | null;
}

export function unsubscribeUrlFor(origin: string, token: string): string {
  return `${origin}/api/subscribe/unsubscribe/confirm?token=${encodeURIComponent(token)}`;
}

/** Whole minutes from a stored label such as "4 dk okuma", or null when none. */
function readMinutes(readTime: string | null): number | null {
  const minutes = Number(readTime?.match(/\d+/)?.[0]);
  return Number.isInteger(minutes) && minutes > 0 ? minutes : null;
}

export function renderBroadcast(input: { post: BroadcastPost; origin: string; unsubscribeUrl: string }): {
  subject: string;
  text: string;
  html: string;
} {
  const { post, origin, unsubscribeUrl } = input;
  const title = post.title.replace(/[\r\n]+/g, ' ').trim();
  const subject = `Yeni Blog Yazım ${title} yayında`;
  const postUrl = `${origin}/blog/${encodeURIComponent(post.slug)}`;
  const minutes = readMinutes(post.readTime);
  const announcement = `Yeni blog yazım “${title}” yayında, ${minutes ? `${minutes} dakika müsaitliğin var ise ` : ''}linki aşağıda.`;

  const text = [
    announcement,
    `Okumak için: ${postUrl}`,
    `Bu e-postaları almak istemiyorsanız aboneliğinizi buradan sonlandırabilirsiniz: ${unsubscribeUrl}`,
  ].join('\n\n');

  const html = `<!doctype html><html lang="tr"><body style="margin:0;background:#f8f2e8;font-family:Arial,Helvetica,sans-serif;color:#2b211b">
<div style="max-width:560px;margin:0 auto;padding:24px">
<img src="${escapeHtml(`${origin}/newsletter-logo.png`)}" alt="" width="120" style="display:block;margin-bottom:24px">
<p style="font-size:18px;line-height:1.6;margin:0 0 24px">${escapeHtml(announcement)}</p>
<p style="margin:0 0 32px"><a href="${escapeHtml(postUrl)}" style="background:#6b3f2a;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">Okumak için tıklayın</a></p>
<p style="font-size:12px;line-height:1.5;color:#6b5f57;margin:0">Bu e-postaları almak istemiyorsanız <a href="${escapeHtml(unsubscribeUrl)}" style="color:#6b5f57">aboneliğinizi sonlandırabilirsiniz</a>.</p>
</div></body></html>`;

  return { subject, text, html };
}
