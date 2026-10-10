import { Router } from 'express';
import { escapeHtml } from '../seo/html.js';
import { subscribeSchema, unsubscribeSchema } from '../validation/schemas.js';
import { listAll, confirmSubscriber, unsubscribeSubscriber } from '../repositories/subscribersRepo.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { subscribeRateLimit, unsubscribeRateLimit } from '../middleware/rateLimit.js';
import { CURRENT_CONSENT_VERSION } from '../config/consent.js';
import { HttpError } from '../middleware/errorHandler.js';
import { issueNewsletterToken, discardNewsletterToken, consumeNewsletterToken, type NewsletterTokenPurpose } from '../services/newsletterTokens.js';
import { sendNewsletterActionEmail } from '../services/newsletterMail.js';

export const subscribersRouter = Router();
export const adminSubscribersRouter = Router();
const GENERIC_MESSAGE = 'Adres uygunsa doğrulama bağlantısı e-posta ile gönderildi.';
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

async function sendAction(input: { email: string; purpose: NewsletterTokenPurpose; name?: string; consentVersion?: string }): Promise<void> {
  const token = await issueNewsletterToken(input);
  if (!token) return;
  try {
    await sendNewsletterActionEmail({ email: input.email, token, purpose: input.purpose });
  } catch {
    await discardNewsletterToken(token);
    throw new HttpError(503, 'E-posta şu anda gönderilemedi. Lütfen daha sonra tekrar deneyin.');
  }
}

subscribersRouter.post('/', subscribeRateLimit, async (req, res) => {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, 'Ad, e-posta ve onay gereklidir.');
  if (parsed.data.honeypot) {
    res.status(202).json({ success: true, message: GENERIC_MESSAGE });
    return;
  }
  if (parsed.data.consentVersion !== CURRENT_CONSENT_VERSION) {
    throw new HttpError(400, 'Onay metni güncellendi. Lütfen sayfayı yenileyip tekrar deneyin.');
  }
  await sendAction({
    purpose: 'confirm',
    email: parsed.data.email.toLowerCase(),
    name: parsed.data.name,
    consentVersion: parsed.data.consentVersion,
  });
  res.status(202).json({ success: true, message: GENERIC_MESSAGE });
});

subscribersRouter.post('/unsubscribe', unsubscribeRateLimit, async (req, res) => {
  const parsed = unsubscribeSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, 'Lütfen geçerli bir e-posta adresi girin.');
  await sendAction({ purpose: 'unsubscribe', email: parsed.data.email.toLowerCase() });
  res.status(202).json({ success: true, message: GENERIC_MESSAGE });
});

function confirmationPage(purpose: NewsletterTokenPurpose, token: string, outcome?: 'success' | 'invalid'): string {
  const unsubscribe = purpose === 'unsubscribe';
  const action = unsubscribe ? '/api/subscribe/unsubscribe/confirm' : '/api/subscribe/confirm';
  const state = outcome ?? 'pending';
  const copy = state === 'success'
    ? unsubscribe
      ? { eyebrow: 'İŞLEM TAMAMLANDI', title: 'E-posta bildirimlerini durdurduk.', lead: 'Artık yeni yazılar için e-posta göndermeyeceğiz.', detail: 'Dilediğinde yeniden haberdar olmayı seçebilirsin.', action: 'Ana sayfaya dön' }
      : { eyebrow: 'İŞLEM TAMAMLANDI', title: 'Yeni yazılarımdan haberdar olacaksın.', lead: 'E-posta adresin doğrulandı. Yeni yazılarım yayınlandığında sana e-posta göndereceğim.', detail: 'Okumak istediğin zaman burada olacağım.', action: 'Ana sayfaya dön' }
    : state === 'invalid'
      ? { eyebrow: 'BAĞLANTI KULLANILAMIYOR', title: 'Bu bağlantı artık geçerli değil.', lead: 'Süresi dolmuş veya daha önce kullanılmış olabilir.', detail: 'Yeni bir bağlantı almak için ana sayfadan yeniden istekte bulunabilirsin.', action: 'Ana sayfaya dön' }
      : unsubscribe
        ? { eyebrow: 'E-POSTA TERCİHİ', title: 'E-posta bildirimlerini durduralım.', lead: 'İsteğin sana aitse aşağıdaki düğmeyle adresini doğrula.', detail: 'Onayından sonra yeni yazı e-postaları gelmeyecek.', action: 'Bildirimleri durdur' }
        : { eyebrow: 'YENİ YAZILARIMDAN HABERDAR OL', title: 'Yeni yazılarımı kaçırma.', lead: 'Yazılarımı e-posta ile almak için adresini doğrula.', detail: 'Bu son adım, e-posta adresinin sana ait olduğunu onaylar.', action: 'E-posta adresimi doğrula' };
  const title = unsubscribe ? 'E-posta tercihleri' : 'Yeni yazılar için e-posta doğrulaması';
  const icon = state === 'pending'
    ? '<path d="M5 8.5 16 16l11-7.5"/><rect x="4" y="7" width="24" height="18" rx="3"/><path d="m5 23 8-7m14 7-8-7"/>'
    : state === 'success'
      ? '<circle cx="16" cy="16" r="12"/><path d="m10.5 16 3.7 3.7 7.5-8"/>'
      : '<circle cx="16" cy="16" r="12"/><path d="M16 10v7m0 4h.01"/>';
  const form = state === 'pending'
    ? `<form method="post" action="${action}"><input type="hidden" name="token" value="${escapeHtml(token)}"><button class="verify-button" type="submit">${escapeHtml(copy.action)}<span aria-hidden="true">↗</span></button></form>`
    : `<a class="verify-button" href="${state === 'invalid' ? '/#bulten' : '/'}">${escapeHtml(copy.action)}<span aria-hidden="true">↗</span></a>`;
  const statusLabel = state === 'success' ? 'Tamamlandı' : state === 'invalid' ? 'Yeni bağlantı gerekli' : 'Onay bekliyor';

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="referrer" content="no-referrer">
  <meta name="theme-color" content="#f8f2e8">
  <title>${escapeHtml(title)} | Tuğba Ergüner Şimşek</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      color-scheme: light;
      --paper: oklch(97.5% 0.018 79);
      --paper-deep: oklch(94.5% 0.025 76);
      --ink: oklch(29% 0.035 48);
      --muted: oklch(47% 0.025 55);
      --line: oklch(84% 0.025 70);
      --earth: oklch(43% 0.085 43);
      --earth-hover: oklch(36% 0.075 43);
      --olive: oklch(43% 0.065 145);
      --clay: oklch(49% 0.105 38);
    }
    * { box-sizing: border-box; }
    html { min-width: 320px; background: var(--paper); }
    body {
      min-height: 100svh;
      margin: 0;
      color: var(--ink);
      background: var(--paper);
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    a { color: inherit; }
    .page { display: flex; min-height: 100svh; flex-direction: column; padding-inline: max(24px, env(safe-area-inset-left)) max(24px, env(safe-area-inset-right)); }
    .masthead {
      width: min(100%, 1184px);
      min-height: 94px;
      margin-inline: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--line);
    }
    .wordmark { display: inline-flex; align-items: center; gap: 12px; text-decoration: none; }
    .mark { display: block; width: 44px; height: 36px; flex: 0 0 44px; color: var(--earth); }
    .mark svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .mark path, .mark circle { fill: none; stroke: currentColor; stroke-linecap: round; }
    .wordmark-name { font-family: 'Instrument Serif', Georgia, serif; font-size: 21px; letter-spacing: -0.02em; }
    .masthead-note { color: var(--muted); font-size: 11px; letter-spacing: 0.11em; text-transform: uppercase; }
    .main {
      width: min(100%, 1056px);
      flex: 1;
      display: grid;
      grid-template-columns: minmax(0, 1.12fr) minmax(300px, 0.78fr);
      align-items: center;
      gap: clamp(44px, 9vw, 128px);
      margin: 0 auto;
      padding-block: clamp(72px, 11vh, 132px);
    }
    .intro { max-width: 590px; }
    .eyebrow { display: flex; align-items: center; gap: 10px; margin: 0 0 24px; color: var(--earth); font-size: 11px; font-weight: 700; letter-spacing: 0.14em; }
    .eyebrow-dot { width: 7px; height: 7px; border-radius: 50%; background: ${state === 'success' ? 'var(--olive)' : state === 'invalid' ? 'var(--clay)' : 'var(--earth)'}; }
    h1 { max-width: 12ch; margin: 0; font-family: 'Instrument Serif', Georgia, serif; font-size: clamp(48px, 6.1vw, 76px); font-weight: 400; line-height: 0.99; letter-spacing: -0.035em; text-wrap: balance; }
    .lead { max-width: 43ch; margin: 28px 0 0; color: var(--muted); font-size: 16px; line-height: 1.75; }
    .action-panel { padding: 32px 0 0 32px; border-top: 1px solid var(--line); }
    .status-icon { display: grid; width: 58px; height: 58px; place-items: center; margin-bottom: 30px; border-radius: 50%; background: var(--paper-deep); color: ${state === 'success' ? 'var(--olive)' : state === 'invalid' ? 'var(--clay)' : 'var(--earth)'}; }
    .status-icon svg { width: 32px; height: 32px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
    .status-label { margin: 0 0 12px; color: var(--muted); font-size: 11px; font-weight: 700; letter-spacing: 0.13em; }
    .detail { max-width: 36ch; margin: 0; color: var(--ink); font-size: 16px; line-height: 1.7; }
    .verify-button {
      width: 100%; min-height: 56px; margin-top: 30px; padding: 15px 19px;
      display: inline-flex; align-items: center; justify-content: space-between; gap: 18px;
      border: 0; border-radius: 4px; background: var(--earth); color: var(--paper);
      font: 600 14px/1.3 'Plus Jakarta Sans', system-ui, sans-serif; text-align: left; text-decoration: none;
      cursor: pointer; transition: background-color 160ms ease-out, transform 160ms ease-out;
    }
    .verify-button span { font-size: 18px; line-height: 1; }
    .verify-button:hover { background: var(--earth-hover); transform: translateY(-1px); }
    .verify-button:active { transform: translateY(0); }
    .verify-button:focus-visible, .wordmark:focus-visible, .footer-link:focus-visible { outline: 3px solid var(--clay); outline-offset: 4px; }
    .privacy-note { display: flex; align-items: flex-start; gap: 9px; margin: 18px 0 0; color: var(--muted); font-size: 12px; line-height: 1.6; }
    .privacy-note svg { flex: 0 0 16px; width: 16px; height: 16px; margin-top: 1px; fill: none; stroke: var(--olive); stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
    .footer {
      width: min(100%, 1184px); min-height: 74px; margin-inline: auto;
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      border-top: 1px solid var(--line); color: var(--muted); font-size: 12px;
    }
    .footer-link { text-underline-offset: 3px; }
    @media (max-width: 720px) {
      .page { padding-inline: max(20px, env(safe-area-inset-left)) max(20px, env(safe-area-inset-right)); }
      .masthead { min-height: 76px; }
      .masthead-note { max-width: 130px; font-size: 9px; text-align: right; line-height: 1.5; }
      .main { grid-template-columns: 1fr; gap: 42px; padding-block: 64px 72px; }
      .intro { max-width: 520px; }
      h1 { max-width: 11ch; font-size: clamp(48px, 13vw, 66px); }
      .lead { margin-top: 20px; font-size: 15px; }
      .action-panel { padding: 26px 0 0; }
      .status-icon { margin-bottom: 22px; }
      .verify-button { min-height: 58px; }
      .footer { min-height: 68px; padding-block: 12px; font-size: 11px; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="masthead">
      <a class="wordmark" href="/" aria-label="Tuğba Ergüner Şimşek ana sayfa">
        <span class="mark" aria-hidden="true"><svg viewBox="4 12 40 32">
          <defs><clipPath id="brand-mark-sun-clip"><rect x="0" y="0" width="48" height="32" /></clipPath></defs>
          <path stroke-width="1.75" d="M6 32 H42" />
          <path stroke-width="1.5" opacity=".5" d="M14 36.5 H34" />
          <path stroke-width="1.5" opacity=".3" d="M18 40.5 H30" />
          <g clip-path="url(#brand-mark-sun-clip)"><circle stroke-width="1.75" cx="24" cy="32" r="9" /><circle stroke-width="1.5" opacity=".5" cx="24" cy="32" r="4.6" /></g>
          <path stroke-width="1.75" d="M24 19 V15.5 M31.64 21.48 33.7 18.67 M16.36 21.48 14.3 18.67 M36.36 27.98 39.69 26.9 M11.64 27.98 8.31 26.9" />
        </svg></span>
        <span class="wordmark-name">Tuğba Ergüner Şimşek</span>
      </a>
      <span class="masthead-note">Kendine yeniden yaklaş</span>
    </header>
    <main class="main" id="main-content">
      <section class="intro" aria-labelledby="page-title">
        <p class="eyebrow"><span class="eyebrow-dot" aria-hidden="true"></span>${copy.eyebrow}</p>
        <h1 id="page-title">${copy.title}</h1>
        <p class="lead">${copy.lead}</p>
      </section>
      <section class="action-panel" aria-live="polite" aria-label="${statusLabel}">
        <div class="status-icon" aria-hidden="true"><svg viewBox="0 0 32 32">${icon}</svg></div>
        <p class="status-label">${statusLabel}</p>
        <p class="detail">${copy.detail}</p>
        ${form}
        ${state === 'pending' ? '<p class="privacy-note"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5 16 5v4.7c0 3.6-2.4 6.1-6 7.8-3.6-1.7-6-4.2-6-7.8V5l6-2.5Z"/><path d="m7.5 10 1.7 1.7 3.5-3.7"/></svg><span>Bu isteği sen başlatmadıysan e-postayı yok sayabilirsin.</span></p>' : ''}
      </section>
    </main>
    <footer class="footer">
      <span>© Tuğba Ergüner Şimşek</span>
      <a class="footer-link" href="/kvkk">Gizlilik ve kişisel veriler</a>
    </footer>
  </div>
</body>
</html>`;
}

function tokenFrom(value: unknown): string {
  return typeof value === 'string' && TOKEN_PATTERN.test(value) ? value : '';
}

for (const purpose of ['confirm', 'unsubscribe'] as const) {
  const route = purpose === 'confirm' ? '/confirm' : '/unsubscribe/confirm';
  subscribersRouter.get(route, (req, res) => {
    const token = tokenFrom(req.query.token);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.status(token ? 200 : 400).type('html').send(confirmationPage(purpose, token, token ? undefined : 'invalid'));
  });
  subscribersRouter.post(route, async (req, res) => {
    const token = tokenFrom(req.body?.token);
    const consumed = Boolean(token) && await consumeNewsletterToken(token, purpose, async (row, trx) => {
      if (purpose === 'confirm') {
        if (!row.name || !row.consent_version) throw new Error('Confirmation token lacks consent data');
        await confirmSubscriber(trx, { name: row.name, email: row.email, consentVersion: row.consent_version });
      } else {
        await unsubscribeSubscriber(trx, row.email);
      }
    });
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.status(consumed ? 200 : 400).type('html').send(confirmationPage(purpose, '', consumed ? 'success' : 'invalid'));
  });
}

adminSubscribersRouter.use(requireAuth, requireAdmin);
adminSubscribersRouter.get('/', async (_req, res) => res.json(await listAll()));
