export const SPANISH_STOP_WORDS = new Set([
  'de',
  'la',
  'las',
  'el',
  'los',
  'en',
  'con',
  'sin',
  'para',
  'por',
  'del',
  'y',
  'o',
  'a',
  'un',
  'una',
  'al',
  'tu',
  'mi',
  'su',
  'se',
  'es',
  'off',
  'app',
  'pay',
  'visa',
  'mastercard',
  'banco',
  'tarjeta'
]);

export function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function singularizeSpanishToken(token) {
  if (token.length <= 4) return token;
  if (token.endsWith('es') && token.length > 5) return token.slice(0, -2);
  if (token.endsWith('s') && token.length > 4) return token.slice(0, -1);
  return token;
}

export function getNormalizedSearchWords(value) {
  const normalized = normalizeSearchText(value);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
}

export function getSignificantSearchTokens(value, options = {}) {
  const { singularize = false } = options;
  return getNormalizedSearchWords(value)
    .map((token) => (singularize ? singularizeSpanishToken(token) : token))
    .filter((token) => token && !SPANISH_STOP_WORDS.has(token));
}

export function buildSearchPhraseVariants(value) {
  const normalized = normalizeSearchText(value);
  if (!normalized) return [];

  const words = getNormalizedSearchWords(normalized);
  const variants = new Set([normalized]);
  const significantWords = words.filter((token) => !SPANISH_STOP_WORDS.has(token));
  const singularWords = words.map((token) => singularizeSpanishToken(token));
  const singularSignificantWords = singularWords.filter((token) => !SPANISH_STOP_WORDS.has(token));

  if (singularWords.length > 0) {
    variants.add(singularWords.join(' '));
  }
  if (significantWords.length > 0) {
    variants.add(significantWords.join(' '));
  }
  if (singularSignificantWords.length > 0) {
    variants.add(singularSignificantWords.join(' '));
  }

  return Array.from(variants).filter(Boolean);
}

export function tokenizeSearchText(value) {
  const normalized = normalizeSearchText(value);
  if (!normalized) return [];

  const baseTokens = normalized.split(' ').filter(Boolean);
  const expandedTokens = new Set();
  for (const token of baseTokens) {
    expandedTokens.add(token);
    expandedTokens.add(singularizeSpanishToken(token));
  }
  return Array.from(expandedTokens).filter(Boolean);
}

export function uniqueStrings(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function slugify(value) {
  return normalizeSearchText(value).replace(/\s+/g, '-');
}
