export const LANDING_BANK_DEFINITIONS = [
  { slug: 'galicia', name: 'Banco Galicia', aliases: ['galicia'] },
  { slug: 'santander', name: 'Banco Santander', aliases: ['santander', 'rio'] },
  { slug: 'bbva', name: 'BBVA', aliases: ['bbva', 'frances', 'banco frances'] },
  { slug: 'macro', name: 'Banco Macro', aliases: ['macro'] },
  { slug: 'nacion', name: 'Banco Nacion', aliases: ['nacion', 'bna', 'banco nacion'] },
  { slug: 'icbc', name: 'ICBC', aliases: ['icbc'] },
];

export const LANDING_CATEGORY_DEFINITIONS = [
  { slug: 'gastronomia', category: 'gastronomia', name: 'Gastronomia' },
  { slug: 'moda', category: 'moda', name: 'Moda' },
  { slug: 'shopping', category: 'shopping', name: 'Supermercado y shopping' },
  { slug: 'hogar', category: 'hogar', name: 'Hogar' },
  { slug: 'deportes', category: 'deportes', name: 'Deportes' },
  { slug: 'belleza', category: 'belleza', name: 'Belleza' },
];

export const LANDING_CITY_DEFINITIONS = [
  { slug: 'buenos-aires', name: 'Buenos Aires', aliases: ['buenos aires', 'provincia de buenos aires'] },
  { slug: 'caba', name: 'CABA', aliases: ['caba', 'ciudad autonoma de buenos aires', 'cdad autonoma de buenos aires', 'capital federal'] },
  { slug: 'cordoba', name: 'Cordoba', aliases: ['cordoba', 'cordoba capital'] },
  { slug: 'rosario', name: 'Rosario', aliases: ['rosario', 'santa fe'] },
  { slug: 'mendoza', name: 'Mendoza', aliases: ['mendoza'] },
  { slug: 'la-plata', name: 'La Plata', aliases: ['la plata'] },
  { slug: 'mar-del-plata', name: 'Mar del Plata', aliases: ['mar del plata'] },
  { slug: 'tucuman', name: 'Tucuman', aliases: ['tucuman', 'san miguel de tucuman'] },
];

function normalizeLandingValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveLandingBank(value) {
  const normalized = normalizeLandingValue(value);
  if (!normalized) return null;

  return LANDING_BANK_DEFINITIONS.find((bank) => (
    bank.slug === value ||
    normalizeLandingValue(bank.slug) === normalized ||
    bank.aliases.some((alias) => normalizeLandingValue(alias) === normalized)
  )) || null;
}

export function resolveLandingCategory(value) {
  const normalized = normalizeLandingValue(value);
  if (!normalized) return null;

  return LANDING_CATEGORY_DEFINITIONS.find((category) => (
    category.slug === value ||
    normalizeLandingValue(category.slug) === normalized ||
    normalizeLandingValue(category.category) === normalized
  )) || null;
}

export function resolveLandingCity(value) {
  const normalized = normalizeLandingValue(value);
  if (!normalized) return null;

  return LANDING_CITY_DEFINITIONS.find((city) => (
    city.slug === value ||
    normalizeLandingValue(city.slug) === normalized ||
    city.aliases.some((alias) => normalizeLandingValue(alias) === normalized)
  )) || null;
}

export function getLandingSeoPath(bank, category, city) {
  const basePath = `/descuentos/${bank.slug}/${category.slug}`;
  return city ? `${basePath}/${city.slug}` : basePath;
}

export function compactLandingBankName(bankName) {
  return String(bankName || '').replace(/^Banco\s+/i, '').trim();
}

export function normalizeLandingSearchText(value) {
  return normalizeLandingValue(value);
}
