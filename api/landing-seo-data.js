const LANDING_STOP_WORDS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y']);
const EXCLUDED_CATEGORY_SLUGS = new Set(['all']);

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function uniqueStrings(values) {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));
}

export function normalizeLandingSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugifyLandingValue(value) {
  return normalizeLandingSearchText(value)
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatLandingName(value) {
  const raw = String(value || '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!raw) return '';

  return raw.split(' ').map((word, index) => {
    if (/^[A-Z0-9]{2,}$/.test(word) || /[A-Z][a-z]+[A-Z]/.test(word)) {
      return word;
    }

    const lower = word.toLowerCase();
    if (index > 0 && LANDING_STOP_WORDS.has(lower)) {
      return lower;
    }

    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join(' ');
}

function getInitialsAlias(value) {
  const initials = normalizeLandingSearchText(value)
    .split(' ')
    .filter((word) => word && !LANDING_STOP_WORDS.has(word))
    .map((word) => word[0])
    .join('');

  return initials.length >= 3 && initials.length <= 6 ? initials : '';
}

export function compactLandingBankName(bankName) {
  return String(bankName || '').replace(/^Banco\s+/i, '').trim();
}

function createAliases(...values) {
  const aliases = new Set();

  for (const value of values) {
    const normalized = normalizeLandingSearchText(value);
    if (normalized) aliases.add(normalized);

    const slug = slugifyLandingValue(value);
    if (slug) aliases.add(slug);

    const initials = getInitialsAlias(value);
    if (initials) aliases.add(initials);
  }

  return Array.from(aliases);
}

function definitionMatches(definition, value) {
  const normalized = normalizeLandingSearchText(value);
  const slug = slugifyLandingValue(value);
  if (!normalized && !slug) return false;

  const candidates = [
    definition.slug,
    definition.name,
    definition.category,
    ...(definition.aliases || []),
  ];

  return candidates.some((candidate) => (
    normalizeLandingSearchText(candidate) === normalized ||
    slugifyLandingValue(candidate) === slug
  ));
}

function resolveExistingLandingDefinition(value, definitions = []) {
  if (!normalizeLandingSearchText(value)) return null;
  return definitions.find((definition) => definitionMatches(definition, value)) || null;
}

function getDefinitionNameScore(name) {
  const value = String(name || '');
  let score = 0;
  if (/^Banco\s/i.test(value)) score += 4;
  if (/^[A-Z0-9]{2,}$/.test(value.replace(/\s+/g, ''))) score += 3;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 2;
  if (value.includes(' ')) score += 1;
  return score;
}

function mergeDefinition(map, definition) {
  if (!definition?.slug) return;

  const existing = map.get(definition.slug);
  if (!existing) {
    map.set(definition.slug, {
      ...definition,
      aliases: uniqueStrings(definition.aliases || []),
    });
    return;
  }

  const existingScore = getDefinitionNameScore(existing.name);
  const incomingScore = getDefinitionNameScore(definition.name);
  const name = incomingScore > existingScore ? definition.name : existing.name;

  map.set(definition.slug, {
    ...existing,
    name,
    aliases: uniqueStrings([
      ...(existing.aliases || []),
      ...(definition.aliases || []),
      definition.name,
    ]),
  });
}

function seedDefinitionMap(map, definitions) {
  for (const definition of toArray(definitions)) {
    mergeDefinition(map, definition);
  }
}

export function buildLandingBankDefinition(value) {
  const name = formatLandingName(value);
  if (!name) return null;

  const compactName = compactLandingBankName(name);
  const slug = slugifyLandingValue(compactName || name);
  if (!slug) return null;

  return {
    slug,
    name,
    aliases: createAliases(value, name, compactName, slug),
  };
}

export function buildLandingCategoryDefinition(value) {
  const category = slugifyLandingValue(value);
  if (!category || EXCLUDED_CATEGORY_SLUGS.has(category)) return null;

  return {
    slug: category,
    category,
    name: formatLandingName(value),
    aliases: createAliases(value, category),
  };
}

export function buildLandingCityDefinition(value) {
  const name = formatLandingName(value);
  const slug = slugifyLandingValue(value);
  if (!name || !slug) return null;

  return {
    slug,
    name,
    aliases: createAliases(value, name, slug),
  };
}

const CLIENT_LANDING_BANK_DEFINITIONS = [
  { slug: 'galicia', name: 'Banco Galicia', aliases: createAliases('galicia', 'Banco Galicia') },
  { slug: 'santander', name: 'Banco Santander', aliases: createAliases('santander', 'rio', 'Banco Santander', 'Banco Santander Rio', 'Banco Santander Río') },
  { slug: 'bbva', name: 'BBVA', aliases: createAliases('bbva', 'frances', 'banco frances', 'Banco Francés') },
  { slug: 'macro', name: 'Banco Macro', aliases: createAliases('macro', 'Banco Macro') },
  { slug: 'nacion', name: 'Banco Nacion', aliases: createAliases('nacion', 'bna', 'banco nacion', 'Banco Nación') },
  { slug: 'icbc', name: 'ICBC', aliases: createAliases('icbc', 'ICBC') },
];

export function resolveLandingBank(value, definitions = []) {
  return resolveExistingLandingDefinition(value, definitions) || buildLandingBankDefinition(value);
}

export function resolveLandingCategory(value, definitions = []) {
  return resolveExistingLandingDefinition(value, definitions) || buildLandingCategoryDefinition(value);
}

export function resolveLandingCity(value, definitions = []) {
  return resolveExistingLandingDefinition(value, definitions) || buildLandingCityDefinition(value);
}

function getSearchProfileBankNames(merchant) {
  return toArray(merchant?.searchProfile?.benefits)
    .flatMap((benefit) => String(benefit?.bankName || '').split(','))
    .map((value) => value.trim());
}

export function getLandingBankValuesFromMerchant(merchant) {
  return uniqueStrings(getSearchProfileBankNames(merchant));
}

export function getLandingCategoryValuesFromMerchant(merchant) {
  return uniqueStrings(toArray(merchant?.categories))
    .filter((category) => !EXCLUDED_CATEGORY_SLUGS.has(slugifyLandingValue(category)));
}

export function getLandingCityValuesFromMerchant(merchant) {
  const values = [];

  for (const location of toArray(merchant?.locations)) {
    const components = location?.addressComponents || {};
    values.push(
      components.locality,
      components.sublocality,
      components.adminAreaLevel2,
      components.adminAreaLevel1,
    );
  }

  return uniqueStrings(values);
}

export function buildLandingBankDefinitionsFromMerchants(merchants, seedDefinitions = []) {
  const map = new Map();
  seedDefinitionMap(map, seedDefinitions);
  for (const merchant of toArray(merchants)) {
    for (const value of getLandingBankValuesFromMerchant(merchant)) {
      mergeDefinition(map, buildLandingBankDefinition(value));
    }
  }
  return Array.from(map.values()).sort((a, b) => a.slug.localeCompare(b.slug));
}

export function buildLandingCategoryDefinitionsFromMerchants(merchants, seedDefinitions = []) {
  const map = new Map();
  seedDefinitionMap(map, seedDefinitions);
  for (const merchant of toArray(merchants)) {
    for (const value of getLandingCategoryValuesFromMerchant(merchant)) {
      mergeDefinition(map, buildLandingCategoryDefinition(value));
    }
  }
  return Array.from(map.values()).sort((a, b) => a.slug.localeCompare(b.slug));
}

export function buildLandingCityDefinitionsFromMerchants(merchants, seedDefinitions = []) {
  const map = new Map();
  seedDefinitionMap(map, seedDefinitions);
  for (const merchant of toArray(merchants)) {
    for (const value of getLandingCityValuesFromMerchant(merchant)) {
      mergeDefinition(map, buildLandingCityDefinition(value));
    }
  }
  return Array.from(map.values()).sort((a, b) => a.slug.localeCompare(b.slug));
}

export function resolveLandingBankFromMerchants(value, merchants, options = {}) {
  const seedDefinitions = options.includeClientDefinitions ? CLIENT_LANDING_BANK_DEFINITIONS : options.seedDefinitions;
  return resolveExistingLandingDefinition(value, buildLandingBankDefinitionsFromMerchants(merchants, seedDefinitions));
}

export function resolveLandingCategoryFromMerchants(value, merchants) {
  return resolveExistingLandingDefinition(value, buildLandingCategoryDefinitionsFromMerchants(merchants));
}

export function resolveLandingCityFromMerchants(value, merchants) {
  return resolveExistingLandingDefinition(value, buildLandingCityDefinitionsFromMerchants(merchants));
}

export function getLandingCategoryMatchValues(category) {
  return uniqueStrings([
    category?.category,
    category?.slug,
    ...(category?.aliases || []),
  ]).filter((value) => !EXCLUDED_CATEGORY_SLUGS.has(slugifyLandingValue(value)));
}

export function getLandingSeoPath(bank, category, city) {
  const basePath = `/descuentos/${bank.slug}/${category.slug}`;
  return city ? `${basePath}/${city.slug}` : basePath;
}

function addRouteCandidate(map, key, route) {
  const existing = map.get(key);
  if (existing) {
    existing.count += 1;
    return;
  }

  map.set(key, {
    ...route,
    count: 1,
  });
}

function buildDefinitionsForMerchant(merchant) {
  const bankMap = new Map();
  for (const value of getLandingBankValuesFromMerchant(merchant)) {
    mergeDefinition(bankMap, buildLandingBankDefinition(value));
  }

  const categoryMap = new Map();
  for (const value of getLandingCategoryValuesFromMerchant(merchant)) {
    mergeDefinition(categoryMap, buildLandingCategoryDefinition(value));
  }

  const cityMap = new Map();
  for (const value of getLandingCityValuesFromMerchant(merchant)) {
    mergeDefinition(cityMap, buildLandingCityDefinition(value));
  }

  return {
    banks: Array.from(bankMap.values()),
    categories: Array.from(categoryMap.values()),
    cities: Array.from(cityMap.values()),
  };
}

function routeSort(a, b) {
  if (b.count !== a.count) return b.count - a.count;
  return a.path.localeCompare(b.path);
}

function getAllowedSlugSet(values) {
  if (!values) return null;
  const slugs = toArray(values).map((value) => slugifyLandingValue(value)).filter(Boolean);
  return slugs.length > 0 ? new Set(slugs) : null;
}

function filterDefinitionsByAllowedSlugs(definitions, allowedSlugs) {
  if (!allowedSlugs) return definitions;
  return definitions.filter((definition) => allowedSlugs.has(definition.slug));
}

export function buildLandingSeoRoutesFromMerchants(merchants, options = {}) {
  const minMerchantCount = Math.max(1, Number.parseInt(String(options.minMerchantCount || 3), 10));
  const maxCityRoutesPerCombination = Math.max(
    0,
    Number.parseInt(String(options.maxCityRoutesPerCombination || 5), 10),
  );
  const allowedBankSlugs = getAllowedSlugSet(options.allowedBankSlugs);
  const allowedCategorySlugs = getAllowedSlugSet(options.allowedCategorySlugs);
  const allowedCitySlugs = getAllowedSlugSet(options.allowedCitySlugs);
  const nationalRoutes = new Map();
  const cityRoutes = new Map();

  for (const merchant of toArray(merchants)) {
    const merchantDefinitions = buildDefinitionsForMerchant(merchant);
    const definitions = {
      banks: filterDefinitionsByAllowedSlugs(merchantDefinitions.banks, allowedBankSlugs),
      categories: filterDefinitionsByAllowedSlugs(merchantDefinitions.categories, allowedCategorySlugs),
      cities: filterDefinitionsByAllowedSlugs(merchantDefinitions.cities, allowedCitySlugs),
    };
    if (definitions.banks.length === 0 || definitions.categories.length === 0) continue;

    for (const bank of definitions.banks) {
      for (const category of definitions.categories) {
        const nationalKey = `${bank.slug}:${category.slug}`;
        addRouteCandidate(nationalRoutes, nationalKey, {
          path: getLandingSeoPath(bank, category),
          changefreq: 'weekly',
          priority: '0.8',
        });

        for (const city of definitions.cities) {
          const cityKey = `${bank.slug}:${category.slug}:${city.slug}`;
          addRouteCandidate(cityRoutes, cityKey, {
            path: getLandingSeoPath(bank, category, city),
            changefreq: 'weekly',
            priority: '0.7',
            parentKey: nationalKey,
          });
        }
      }
    }
  }

  const selectedCityRoutes = [];
  const cityRoutesByParent = new Map();
  for (const route of Array.from(cityRoutes.values()).filter((route) => route.count >= minMerchantCount).sort(routeSort)) {
    const siblings = cityRoutesByParent.get(route.parentKey) || [];
    if (siblings.length >= maxCityRoutesPerCombination) continue;
    siblings.push(route);
    cityRoutesByParent.set(route.parentKey, siblings);
    selectedCityRoutes.push(route);
  }

  return [
    ...Array.from(nationalRoutes.values()).filter((route) => route.count >= minMerchantCount),
    ...selectedCityRoutes,
  ]
    .sort(routeSort)
    .map(({ parentKey, count, ...route }) => route);
}
