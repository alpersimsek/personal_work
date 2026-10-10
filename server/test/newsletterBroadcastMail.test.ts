import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderBroadcast, unsubscribeUrlFor } from '../services/newsletterBroadcastMail.js';

const origin = 'https://www.example.test';
const unsubscribeUrl = unsubscribeUrlFor(origin, 'tok_en-123');

test('builds the unsubscribe url from the origin and an encoded token', () => {
  assert.equal(unsubscribeUrl, 'https://www.example.test/api/subscribe/unsubscribe/confirm?token=tok_en-123');
});

test('renders title, summary and a post link, with an unsubscribe footer', () => {
  const mail = renderBroadcast({
    post: { slug: 'yeni-yazi', title: 'Yeni Yazı', summary: 'Kısa özet', coverImage: null },
    origin, unsubscribeUrl,
  });
  assert.equal(mail.subject, 'Yeni Yazı');
  assert.match(mail.text, /Kısa özet/);
  assert.match(mail.text, /https:\/\/www\.example\.test\/blog\/yeni-yazi/);
  assert.match(mail.text, /unsubscribe\/confirm\?token=tok_en-123/);
  assert.match(mail.html, /href="https:\/\/www\.example\.test\/blog\/yeni-yazi"/);
  assert.match(mail.html, /unsubscribe\/confirm\?token=tok_en-123/);
});

test('a title with line breaks or markup cannot break the header or inject HTML', () => {
  const mail = renderBroadcast({
    post: { slug: 's', title: 'Merhaba\r\nBcc: attacker@example.test <script>alert(1)</script>', summary: '<img src=x onerror=alert(1)>', coverImage: null },
    origin, unsubscribeUrl,
  });
  assert.doesNotMatch(mail.subject, /[\r\n]/);
  assert.doesNotMatch(mail.html, /<script>/);
  assert.doesNotMatch(mail.html, /<img src=x/);
  assert.match(mail.html, /&lt;script&gt;/);
});

test('only an uploaded or http(s) cover image is embedded, never a data URL', () => {
  const base = { slug: 's', title: 'T', summary: 'S' };
  const uploaded = renderBroadcast({ post: { ...base, coverImage: '/uploads/a.jpg' }, origin, unsubscribeUrl });
  assert.match(uploaded.html, /src="https:\/\/www\.example\.test\/uploads\/a\.jpg"/);
  const remote = renderBroadcast({ post: { ...base, coverImage: 'https://cdn.example.test/a.jpg' }, origin, unsubscribeUrl });
  assert.match(remote.html, /src="https:\/\/cdn\.example\.test\/a\.jpg"/);
  const inline = renderBroadcast({ post: { ...base, coverImage: 'data:image/png;base64,AAAA' }, origin, unsubscribeUrl });
  assert.doesNotMatch(inline.html, /data:image/);
  const script = renderBroadcast({ post: { ...base, coverImage: 'javascript:alert(1)' }, origin, unsubscribeUrl });
  assert.doesNotMatch(script.html, /javascript:/);
});

test('quotes and angle brackets in title, summary and cover cannot escape an attribute or inject markup', () => {
  const hostile = '"><script>alert(1)</script>&<b onmouseover="x">';
  const mail = renderBroadcast({
    post: { slug: 's', title: hostile, summary: hostile, coverImage: 'https://cdn.example.test/a.jpg"><script>alert(2)</script>' },
    origin, unsubscribeUrl,
  });
  assert.doesNotMatch(mail.html, /<script/i);
  assert.doesNotMatch(mail.html, /<b onmouseover/);
  assert.doesNotMatch(mail.html, /"><script/);
  assert.match(mail.html, /&quot;&gt;&lt;script&gt;alert\(1\)&lt;\/script&gt;&amp;&lt;b onmouseover=&quot;x&quot;&gt;/);
  assert.match(mail.html, /src="https:\/\/cdn\.example\.test\/a\.jpg&quot;&gt;&lt;script&gt;/);
  const tags = (mail.html.match(/<[^>]+>/g) ?? []).filter((tag) => !/^<!doctype/i.test(tag));
  assert.deepEqual(
    [...new Set(tags.map((tag) => tag.match(/^<\/?([a-z0-9]+)/i)?.[1]))].sort(),
    ['a', 'body', 'div', 'h1', 'html', 'img', 'p'],
  );
});

test('a slug with quotes or spaces is percent-encoded in the post url', () => {
  const mail = renderBroadcast({
    post: { slug: 'a"b c<d>', title: 'T', summary: null, coverImage: null },
    origin, unsubscribeUrl,
  });
  const expected = 'https://www.example.test/blog/a%22b%20c%3Cd%3E';
  assert.match(mail.html, new RegExp(`href="${expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.ok(mail.text.includes(expected));
  assert.doesNotMatch(mail.html, /href="[^"]*[ <>][^"]*"/);
});
