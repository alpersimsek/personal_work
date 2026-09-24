const TURKISH_LETTERS: Record<string, string> = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
};

const MAX_SLUG_LENGTH = 200;

/**
 * Turns a post title into a readable URL segment.
 *
 * Turkish letters become plain ASCII, spaces become hyphens and everything
 * else is dropped, e.g. "Kendine Dönüş Yolculuğu" becomes
 * "kendine-donus-yolculugu".
 */
export function slugify(title: string): string {
  const slug = title
    .replace(/İ/g, 'i')
    .toLowerCase()
    .replace(/[çğıöşü]/g, (letter) => TURKISH_LETTERS[letter])
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '');
  return slug || 'makale';
}

/** Appends -2, -3, ... to a slug until `isTaken` reports it as free. */
export async function uniqueSlug(title: string, isTaken: (slug: string) => Promise<boolean>): Promise<string> {
  const base = slugify(title);
  let candidate = base;
  for (let suffix = 2; await isTaken(candidate); suffix += 1) {
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}
