import { test } from 'node:test';
import assert from 'node:assert/strict';

// The helper lives with the frontend; load it at runtime so the server build
// does not need to reach outside its own folder.
const readingTime = await import(new URL('../../src/utils/readingTime.ts', import.meta.url).href);
const { countWords, estimateReadingMinutes, formatReadingTime, readingTimeLabel, WORDS_PER_MINUTE } = readingTime;

const words = (count: number) => Array.from({ length: count }, (_, index) => `kelime${index}`).join(' ');

test('countWords counts Turkish words, digits and punctuation-joined words once', () => {
  assert.equal(countWords('Tuğba’nın şu günlerde 3 yeni yazısı var.'), 7);
  assert.equal(countWords('içsel-netlik ve farkındalık'), 3);
  assert.equal(countWords(''), 0);
  assert.equal(countWords('   \n\n  '), 0);
});

test('countWords ignores markdown marks and rules', () => {
  const markdown = '# Başlık\n\n## Alt başlık\n\n> Alıntı cümlesi\n\n- madde bir\n- madde iki\n\n---\n\nSon paragraf.';
  assert.equal(countWords(markdown), 11);
});

test('estimateReadingMinutes rounds up and never returns less than one minute', () => {
  assert.equal(estimateReadingMinutes(0), 1);
  assert.equal(estimateReadingMinutes(1), 1);
  assert.equal(estimateReadingMinutes(WORDS_PER_MINUTE), 1);
  assert.equal(estimateReadingMinutes(WORDS_PER_MINUTE + 1), 2);
  assert.equal(estimateReadingMinutes(WORDS_PER_MINUTE * 5), 5);
});

test('the label uses the same wording the site already shows', () => {
  assert.equal(formatReadingTime(4), '4 dk okuma');
  assert.equal(readingTimeLabel(words(WORDS_PER_MINUTE * 3 - 10)), '3 dk okuma');
  assert.equal(readingTimeLabel(''), '1 dk okuma');
});
