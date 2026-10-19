/**
 * Normalization & Deduplication Utilities for ThinkCRM
 */

/**
 * Normalizes phone numbers for accurate identity matching.
 * Handles Indian phone formats, leading zeros, country codes (+91), spaces, dashes, parentheses.
 *
 * @param {string} rawPhone
 * @returns {{ digits: string, canonical: string, formatted: string }}
 */
export const normalizePhone = (rawPhone) => {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { digits: '', canonical: '', formatted: '' };
  }

  const digits = rawPhone.replace(/\D/g, '');

  let canonical = digits;
  if (digits.length === 12 && digits.startsWith('91')) {
    canonical = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    canonical = digits.slice(1);
  } else if (digits.length > 10) {
    canonical = digits.slice(-10);
  }

  const formatted = canonical.length === 10
    ? `+91 ${canonical.slice(0, 5)} ${canonical.slice(5)}`
    : rawPhone.trim();

  return { digits, canonical, formatted };
};

/**
 * Normalizes email address for reliable case-insensitive matching.
 *
 * @param {string} rawEmail
 * @returns {string}
 */
export const normalizeEmail = (rawEmail) => {
  if (!rawEmail || typeof rawEmail !== 'string') return '';
  return rawEmail.trim().toLowerCase();
};

/**
 * Computes case-insensitive similarity score (0.0 to 1.0) between two names.
 * Strips common honorifics (Mr, Ms, Mrs, Dr).
 *
 * @param {string} nameA
 * @param {string} nameB
 * @returns {number}
 */
export const nameSimilarity = (nameA, nameB) => {
  if (!nameA || !nameB) return 0;

  const clean = (n) =>
    n
      .toLowerCase()
      .replace(/^(mr\.|mrs\.|ms\.|dr\.|prof\.)\s+/i, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, ' ');

  const a = clean(nameA);
  const b = clean(nameB);

  if (a === b) return 1.0;
  if (!a || !b) return 0;

  // Token set intersection (e.g. "Rahul Sharma" vs "Sharma Rahul")
  const tokensA = new Set(a.split(' '));
  const tokensB = new Set(b.split(' '));

  let common = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) common++;
  }

  const total = Math.max(tokensA.size, tokensB.size);
  return common / total;
};
