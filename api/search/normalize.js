export function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function singularizeSpanishToken(token) {
  if (token.length <= 4) return token;
  if (token.endsWith('es') && token.length > 5) return token.slice(0, -2);
  if (token.endsWith('s') && token.length > 4) return token.slice(0, -1);
  return token;
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
