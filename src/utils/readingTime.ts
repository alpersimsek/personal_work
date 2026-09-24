/** Silent-reading pace used for the estimate, in words per minute (Turkish prose). */
export const WORDS_PER_MINUTE = 200;

const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

/**
 * Counts the words in an article.
 *
 * Markdown marks (`#`, `>`, `-`, `---`, `*`) are not letters or digits, so they
 * are never counted; a hyphenated or apostrophe word such as "Tuğba'nın" is one.
 */
export function countWords(text: string): number {
  return text.match(WORD_PATTERN)?.length ?? 0;
}

/** Whole minutes to read `wordCount` words, never less than one. */
export function estimateReadingMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

/** The label shown on posts, e.g. "4 dk okuma". */
export function formatReadingTime(minutes: number): string {
  return `${minutes} dk okuma`;
}

/** Reading-time label for an article's text. */
export function readingTimeLabel(text: string): string {
  return formatReadingTime(estimateReadingMinutes(countWords(text)));
}
