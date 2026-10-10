import nodemailer, { type Transporter } from 'nodemailer';
import { readFile } from 'node:fs/promises';
import { escapeHtml } from '../seo/html.js';
import type { NewsletterTokenPurpose } from './newsletterTokens.js';

let injectedTransport: Pick<Transporter, 'sendMail'> | undefined;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function mailbox(value: string): string | null {
  const displayAddress = value.match(/<([^<>]+)>$/)?.[1];
  const address = displayAddress ?? value;
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(address) ? address : null;
}

export function assertNewsletterMailConfiguration(): void {
  const user = required('NEWSLETTER_SMTP_USER');
  const password = required('NEWSLETTER_SMTP_APP_PASSWORD').replaceAll(' ', '');
  const from = required('NEWSLETTER_FROM');
  if (!mailbox(user) || /[\r\n]/.test(from) || !mailbox(from)) {
    throw new Error('Newsletter sender addresses are invalid');
  }
  if (!/^[A-Za-z0-9]{16}$/.test(password)) {
    throw new Error('NEWSLETTER_SMTP_APP_PASSWORD must be a 16-character Google App Password');
  }
}

export function mailTransport(): Pick<Transporter, 'sendMail'> {
  if (injectedTransport) return injectedTransport;
  assertNewsletterMailConfiguration();
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: required('NEWSLETTER_SMTP_USER'),
      pass: required('NEWSLETTER_SMTP_APP_PASSWORD').replaceAll(' ', ''),
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
}

export function setNewsletterMailTransportForTests(value?: Pick<Transporter, 'sendMail'>): void {
  if (process.env.NODE_ENV !== 'test') throw new Error('Mail transport injection is test-only');
  injectedTransport = value;
}

export function publicOrigin(): string {
  const raw = required('PUBLIC_SITE_URL').replace(/\/+$/, '');
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) {
    throw new Error('PUBLIC_SITE_URL is invalid');
  }
  return url.origin;
}

export function newsletterFrom(): string {
  return required('NEWSLETTER_FROM');
}

export async function sendNewsletterActionEmail(input: {
  email: string;
  token: string;
  purpose: NewsletterTokenPurpose;
}): Promise<void> {
  const endpoint = input.purpose === 'confirm' ? 'confirm' : 'unsubscribe/confirm';
  const action = input.purpose === 'confirm' ? 'E-posta adresimi doğrula' : 'E-posta bildirimlerini durdur';
  const heading = input.purpose === 'confirm' ? 'Yeni yazılar için e-posta adresinizi doğrulayın' : 'Yeni yazı e-postalarını durdurma isteğinizi onaylayın';
  const explanation = input.purpose === 'confirm'
    ? 'Yeni blog yazılarımdan ve paylaşımlarımdan e-posta ile haberdar olmak için adresinizi doğrulayın.'
    : 'Yeni yazılarla ilgili e-posta bildirimlerini durdurmak için aşağıdaki bağlantıyı açıp isteğinizi onaylayın.';
  const preheader = input.purpose === 'confirm'
    ? 'Yeni yazılarım yayınlandığında e-posta ile haberdar olun.'
    : 'Yeni yazı e-postalarını durdurma isteğinizi tamamlayın.';
  const url = `${publicOrigin()}/api/subscribe/${endpoint}?token=${encodeURIComponent(input.token)}`;
  const ignoreNote = 'Bu isteği siz yapmadıysanız bu iletiyi yok sayabilirsiniz; herhangi bir işlem yapılmaz.';
  const expiryNote = 'Güvenliğiniz için bu bağlantı 30 dakika geçerlidir ve yalnızca bir kez kullanılabilir.';
  const text = `${heading}\n\n${explanation}\n\n${action}: ${url}\n\n${ignoreNote}\n${expiryNote}\n\nTuğba Ergüner Şimşek`;
  const htmlUrl = escapeHtml(url);
  const htmlAction = escapeHtml(action);
  const brandMark = await readFile(new URL('../../public/newsletter-logo.png', import.meta.url));
  await mailTransport().sendMail({
    from: required('NEWSLETTER_FROM'),
    to: input.email,
    subject: heading,
    text,
    attachments: [{ filename: 'newsletter-logo.png', content: brandMark, contentType: 'image/png', cid: 'newsletter-brand-mark', contentDisposition: 'inline' }],
    html: `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background-color:#f5efe6;font-family:Arial,Helvetica,sans-serif;color:#3c2921;-webkit-text-size-adjust:100%;">
<div style="display:none;font-size:1px;line-height:1px;color:#f5efe6;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}&#847; &nbsp; &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#f5efe6;"><tr><td align="center" style="padding:36px 16px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background-color:#fffdf9;border:1px solid #eadfd4;border-radius:18px;overflow:hidden;">
<tr><td style="padding:26px 36px 22px;border-bottom:1px solid #eee5dc;"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td valign="middle" style="padding-right:14px;"><img src="cid:newsletter-brand-mark" width="48" height="48" alt="" style="display:block;width:48px;height:48px;border:0;border-radius:12px;"></td><td valign="middle"><div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.3;letter-spacing:.2px;color:#3c2921;">Tuğba Ergüner Şimşek</div><div style="margin-top:7px;font-size:11px;line-height:1.4;letter-spacing:1.8px;text-transform:uppercase;color:#8a6b58;">Yeni yazılar</div></td></tr></table></td></tr>
<tr><td style="padding:38px 36px 18px;"><h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:normal;line-height:1.2;color:#3c2921;">${escapeHtml(heading)}</h1><p style="margin:0;font-size:16px;line-height:1.7;color:#65564d;">${escapeHtml(explanation)}</p></td></tr>
<tr><td align="left" style="padding:14px 36px 28px;"><a href="${htmlUrl}" style="display:inline-block;padding:15px 22px;background-color:#704a39;border:1px solid #704a39;border-radius:8px;color:#ffffff;font-size:15px;font-weight:bold;line-height:1.2;text-decoration:none;">${htmlAction}</a></td></tr>
<tr><td style="padding:0 36px 30px;"><p style="margin:0;font-size:13px;line-height:1.65;color:#75675e;">Buton açılmazsa <a href="${htmlUrl}" style="color:#704a39;font-weight:bold;text-decoration:underline;">doğrulama bağlantısını buradan açın</a>.</p></td></tr>
<tr><td style="padding:22px 36px;background-color:#f8f3ed;border-top:1px solid #eee5dc;"><p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#65564d;">${escapeHtml(ignoreNote)}</p><p style="margin:0;font-size:12px;line-height:1.6;color:#8a7a70;">${escapeHtml(expiryNote)}</p></td></tr>
<tr><td align="center" style="padding:20px 24px 24px;font-size:11px;line-height:1.5;color:#9a8c82;">Bu ileti, e-posta adresinizle başlatılan bir istek üzerine gönderildi.</td></tr>
</table></td></tr></table></body></html>`,
  });
}
