const SPANISH_STOP_WORDS = new Set([
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
  'tarjeta',
]);

export function normalizeSearchText(value: string | number | null | undefined): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function singularizeSpanishToken(token: string): string {
  if (token.length <= 4) return token;
  if (token.endsWith('es') && token.length > 5) return token.slice(0, -2);
  if (token.endsWith('s') && token.length > 4) return token.slice(0, -1);
  return token;
}

function getNormalizedSearchWords(value: string): string[] {
  const normalized = normalizeSearchText(value);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
}

export function buildSearchPhraseVariants(value: string | number | null | undefined): string[] {
  const normalized = normalizeSearchText(value);
  if (!normalized) return [];

  const words = getNormalizedSearchWords(normalized);
  const variants = new Set<string>([normalized]);
  const significantWords = words.filter((token) => !SPANISH_STOP_WORDS.has(token));
  const singularWords = words.map((token) => singularizeSpanishToken(token));
  const singularSignificantWords = singularWords.filter((token) => !SPANISH_STOP_WORDS.has(token));

  if (singularWords.length > 0) variants.add(singularWords.join(' '));
  if (significantWords.length > 0) variants.add(significantWords.join(' '));
  if (singularSignificantWords.length > 0) variants.add(singularSignificantWords.join(' '));

  return Array.from(variants).filter(Boolean);
}

export function matchesSearchPhrase(candidate: string | number | null | undefined, query: string): boolean {
  const candidateVariants = buildSearchPhraseVariants(candidate);
  const queryVariants = buildSearchPhraseVariants(query);
  if (candidateVariants.length === 0 || queryVariants.length === 0) return false;

  return queryVariants.some((queryVariant) =>
    candidateVariants.some((candidateVariant) => candidateVariant.includes(queryVariant)),
  );
}
