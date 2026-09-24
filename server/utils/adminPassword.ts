const MIN_LENGTH = 12;

/** Passwords known to be public, e.g. once committed to the repository's history. */
const COMPROMISED = new Set(['ulkute2391!']);

/**
 * Returns why a password is unacceptable for an admin account, or undefined
 * when it is fine. Deliberately simple: length and known-bad values matter
 * more than composition rules.
 */
export function adminPasswordProblem(password: string, username: string): string | undefined {
  if (COMPROMISED.has(password.toLowerCase())) return 'Bu şifre daha önce açığa çıktı, kullanılamaz.';
  if (password.length < MIN_LENGTH) return `Şifre en az ${MIN_LENGTH} karakter olmalıdır.`;
  if (password !== password.trim()) return 'Şifre boşlukla başlayıp bitemez.';
  if (password.toLowerCase().includes(username.toLowerCase())) return 'Şifre kullanıcı adını içeremez.';
  if (new Set(password).size < 6) return 'Şifre çok tekrarlı.';
  if (!/[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(password) || !/[0-9\W_]/.test(password)) {
    return 'Şifre harf ile birlikte rakam veya sembol içermelidir.';
  }
  return undefined;
}
