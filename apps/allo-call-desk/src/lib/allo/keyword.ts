/**
 * Stand-in for Allo's keyword search: terms are AND'd, and each term
 * matches a word by prefix (`bill` matches `billing`).
 */
export function matchesKeyword(haystack: string, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return false;
  const words = haystack.toLowerCase().split(/[^a-z0-9+]+/).filter(Boolean);
  return terms.every((term) => words.some((word) => word.startsWith(term)));
}
