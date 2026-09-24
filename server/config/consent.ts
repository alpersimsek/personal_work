/**
 * Version of the newsletter notice and consent wording currently on the site.
 *
 * Must equal KVKK_VERSION in src/legal/kvkk.ts (a test enforces this). Sign-ups
 * must send it, and it is stored with each subscriber as proof of which text
 * they agreed to. Bump both together whenever the wording changes.
 */
export const CURRENT_CONSENT_VERSION = '2026-09-24';
