import { normalizeSearchText } from './normalize.js';

export const DEFAULT_SEARCH_INDEX_NAME = 'search_entities_v1';

export function getSearchIndexName() {
  return process.env.MEILISEARCH_INDEX || DEFAULT_SEARCH_INDEX_NAME;
}

export const INTENT_TAXONOMY = {
  dessert_icecream: {
    displayLabel: 'Heladerias y postres',
    synonyms: [
      'heladeria',
      'heladerias',
      'helado',
      'helados',
      'postre',
      'postres',
      'ice cream',
      'gelato'
    ],
    categoryRefs: ['gastronomia']
  },
  gastronomy_general: {
    displayLabel: 'Gastronomia',
    synonyms: [
      'gastronomia',
      'gastronomico',
      'comida',
      'restaurante',
      'restaurantes',
      'cafeteria',
      'cafeterias'
    ],
    categoryRefs: ['gastronomia']
  }
};

// Optional curated aliases for true merchant-name variants only.
// Do not include intent/category/product terms here.
export const MERCHANT_ALIASES = {};

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

export const SEARCH_SYNONYMS = {
  heladeria: ['heladerias', 'helado', 'helados', 'gelato', 'ice cream'],
  helados: ['helado', 'heladeria', 'gelato'],
  postre: ['postres', 'helado', 'helados'],
  postres: ['postre', 'helado', 'helados'],
  gastronomia: ['gastronomico', 'comida', 'restaurante', 'restaurantes']
};

export function resolveIntentTagsFromTokens(tokens) {
  const normalizedTokens = tokens.map((token) => normalizeSearchText(token)).filter(Boolean);
  const tagSet = new Set();

  for (const [intentKey, intentMeta] of Object.entries(INTENT_TAXONOMY)) {
    const normalizedSynonyms = intentMeta.synonyms.map((term) => normalizeSearchText(term));
    if (normalizedTokens.some((token) => normalizedSynonyms.includes(token))) {
      tagSet.add(intentKey);
    }
  }

  return Array.from(tagSet);
}
