import { escapeHtml } from '../seo/html.js';

export interface BroadcastPost {
  slug: string;
  title: string;
  summary: string | null;
  coverImage: string | null;
}

export function unsubscribeUrlFor(origin: string, token: string): string {
  return `${origin}/api/subscribe/unsubscribe/confirm?token=${encodeURIComponent(token)}`;
}

/** Mail clients cannot show inline data URLs, and other schemes are unsafe. */
function coverUrl(origin: string, coverImage: string | null): string | null {
  if (!coverImage) return null;
  if (coverImage.startsWith('/uploads/')) return `${origin}${coverImage}`;
  return /^https?:\/\//i.test(coverImage) ? coverImage : null;
}

export function renderBroadcast(input: { post: BroadcastPost; origin: string; unsubscribeUrl: string }): {
  subject: string;
  text: string;
  html: string;
} {
  const { post, origin, unsubscribeUrl } = input;
  const subject = post.title.replace(/[\r\n]+/g, ' ').trim();
  const postUrl = `${origin}/blog/${encodeURIComponent(post.slug)}`;
  const summary = post.summary?.trim() ?? '';
  const cover = coverUrl(origin, post.coverImage);

  const text = [
    subject,
    summary,
    `Yazının devamı: ${postUrl}`,
    `Bu e-postaları almak istemiyorsanız aboneliğinizi buradan sonlandırabilirsiniz: ${unsubscribeUrl}`,
  ].filter(Boolean).join('\n\n');

  const html = `<!doctype html><html lang="tr"><body style="margin:0;background:#f8f2e8;font-family:Arial,Helvetica,sans-serif;color:#2b211b">
<div style="max-width:560px;margin:0 auto;padding:24px">
<img src="${escapeHtml(`${origin}/newsletter-logo.png`)}" alt="" width="120" style="display:block;margin-bottom:24px">
${cover ? `<img src="${escapeHtml(cover)}" alt="" width="512" style="display:block;width:100%;height:auto;border-radius:8px;margin-bottom:20px">` : ''}
<h1 style="font-size:24px;line-height:1.3;margin:0 0 12px">${escapeHtml(subject)}</h1>
${summary ? `<p style="font-size:16px;line-height:1.6;margin:0 0 24px">${escapeHtml(summary)}</p>` : ''}
<p style="margin:0 0 32px"><a href="${escapeHtml(postUrl)}" style="background:#6b3f2a;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">Yazıyı oku</a></p>
<p style="font-size:12px;line-height:1.5;color:#6b5f57;margin:0">Bu e-postaları almak istemiyorsanız <a href="${escapeHtml(unsubscribeUrl)}" style="color:#6b5f57">aboneliğinizi sonlandırabilirsiniz</a>.</p>
</div></body></html>`;

  return { subject, text, html };
}
