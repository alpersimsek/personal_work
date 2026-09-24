import assert from 'node:assert/strict';
import test from 'node:test';
import { slugify, uniqueSlug } from '../utils/slug.js';

test('slugify joins words with hyphens and lowercases them', () => {
  assert.equal(slugify('Kendine Yeniden Yaklaş'), 'kendine-yeniden-yaklas');
});

test('slugify turns Turkish letters into ASCII', () => {
  assert.equal(slugify('İçsel Dönüşüm: Öğrenme Şüphesi, Çağrı ve Işık'), 'icsel-donusum-ogrenme-suphesi-cagri-ve-isik');
});

test('slugify drops punctuation and collapses repeated separators', () => {
  assert.equal(slugify('  Merhaba --  dünya!!  '), 'merhaba-dunya');
});

test('slugify falls back when nothing usable remains', () => {
  assert.equal(slugify('???'), 'makale');
});

test('uniqueSlug appends a counter until the slug is free', async () => {
  const taken = new Set(['ayni-baslik', 'ayni-baslik-2']);
  assert.equal(await uniqueSlug('Aynı Başlık', async (slug) => taken.has(slug)), 'ayni-baslik-3');
});
