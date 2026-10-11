import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderBroadcast, unsubscribeUrlFor } from '../services/newsletterBroadcastMail.js';

const origin = 'https://www.example.test';
const unsubscribeUrl = unsubscribeUrlFor(origin, 'tok_en-123');

test('builds the unsubscribe url from the origin and an encoded token', () => {
  assert.equal(unsubscribeUrl, 'https://www.example.test/api/subscribe/unsubscribe/confirm?token=tok_en-123');
});

test('subject, announcement with reading time, post button and unsubscribe footer', () => {
  const mail = renderBroadcast({
    post: { slug: 'yeni-yazi', title: 'Yeni Yazı', readTime: '4 dk okuma' },
    origin, unsubscribeUrl,
  });
  assert.equal(mail.subject, 'Yeni Blog Yazım Yeni Yazı yayında');
  assert.match(mail.text, /Yeni blog yazım “Yeni Yazı” yayında, 4 dakika müsaitliğin var ise linki aşağıda\./);
  assert.match(mail.text, /https:\/\/www\.example\.test\/blog\/yeni-yazi/);
  assert.match(mail.text, /unsubscribe\/confirm\?token=tok_en-123/);
  assert.match(mail.html, /Yeni blog yazım “Yeni Yazı” yayında, 4 dakika müsaitliğin var ise linki aşağıda\./);
  assert.match(mail.html, /href="https:\/\/www\.example\.test\/blog\/yeni-yazi"[^>]*>Okumak için tıklayın</);
  assert.match(mail.html, /unsubscribe\/confirm\?token=tok_en-123/);
});

test('without a usable read time the reading-time phrase is left out', () => {
  for (const readTime of [null, '', 'kısa', '0 dk okuma']) {
    const mail = renderBroadcast({ post: { slug: 's', title: 'T', readTime }, origin, unsubscribeUrl });
    assert.match(mail.text, /Yeni blog yazım “T” yayında, linki aşağıda\./);
    assert.doesNotMatch(mail.text, /dakika/);
  }
});

test('a title with line breaks cannot break the header', () => {
  const mail = renderBroadcast({
    post: { slug: 's', title: 'Merhaba\r\nBcc: attacker@example.test', readTime: null },
    origin, unsubscribeUrl,
  });
  assert.doesNotMatch(mail.subject, /[\r\n]/);
  assert.equal(mail.subject, 'Yeni Blog Yazım Merhaba Bcc: attacker@example.test yayında');
});

test('a hostile title and read time cannot inject markup into the body', () => {
  const hostile = '"><script>alert(1)</script>&<b onmouseover="x">';
  const mail = renderBroadcast({
    post: { slug: 's', title: hostile, readTime: `<script>alert()</script> 3 dk` },
    origin, unsubscribeUrl,
  });
  assert.doesNotMatch(mail.html, /<script/i);
  assert.doesNotMatch(mail.html, /<b onmouseover/);
  assert.match(mail.text, /3 dakika müsaitliğin var ise/);
  const tags = (mail.html.match(/<[^>]+>/g) ?? []).filter((tag) => !/^<!doctype/i.test(tag));
  assert.deepEqual(
    [...new Set(tags.map((tag) => tag.match(/^<\/?([a-z0-9]+)/i)?.[1]))].sort(),
    ['a', 'body', 'div', 'html', 'img', 'p'],
  );
});

test('a slug with quotes or spaces is percent-encoded in the post url', () => {
  const mail = renderBroadcast({
    post: { slug: 'a"b c<d>', title: 'T', readTime: null },
    origin, unsubscribeUrl,
  });
  const expected = 'https://www.example.test/blog/a%22b%20c%3Cd%3E';
  assert.match(mail.html, new RegExp(`href="${expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.ok(mail.text.includes(expected));
  assert.doesNotMatch(mail.html, /href="[^"]*[ <>][^"]*"/);
});
