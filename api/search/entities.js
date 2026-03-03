import {
  INTENT_TAXONOMY,
  MERCHANT_ALIASES,
  SEARCH_SYNONYMS,
  SPANISH_STOP_WORDS,
  resolveIntentTagsFromTokens
} from './dictionaries.js';
import { normalizeSearchText, slugify, tokenizeSearchText, uniqueStrings } from './normalize.js';

const MAX_PRODUCT_TAGS_PER_MERCHANT = 40;
const MAX_MERCHANT_REFS_PER_ENTITY = 150;

const CATEGORY_TO_INTENT_TAGS = {
  gastronomia: ['gastronomy_general', 'dessert_icecream']
};

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function sanitizeToken(token) {
  const normalized = normalizeSearchText(token);
  if (!normalized) return '';
  if (normalized.length <= 2) return '';
  if (SPANISH_STOP_WORDS.has(normalized)) return '';
  return normalized;
}

function buildProductTags(benefit) {
  const text = [
    benefit?.benefitTitle,
    benefit?.description
  ]
    .filter(Boolean)
    .join(' ');
  const tokens = tokenizeSearchText(text)
    .map(sanitizeToken)
    .filter(Boolean);
  return uniqueStrings(tokens);
}

function resolveMerchantAliases(merchantName, merchantKey, productTags, intentTags) {
  const aliases = new Set();
  const nameTokens = tokenizeSearchText(merchantName);
  nameTokens.forEach((token) => aliases.add(token));
  aliases.add(merchantKey);

  if (merchantName && merchantName.length >= 4) {
    const compact = normalizeSearchText(merchantName).replace(/\s+/g, '');
    aliases.add(compact);
    aliases.add(compact.slice(0, 4));
  }

  const manualAliases = MERCHANT_ALIASES[merchantKey] || [];
  manualAliases.forEach((alias) => aliases.add(normalizeSearchText(alias)));

  // Reinforce merchant intent searchability using learned tags.
  for (const intentTag of intentTags) {
    const intent = INTENT_TAXONOMY[intentTag];
    if (!intent) continue;
    intent.synonyms.forEach((term) => aliases.add(normalizeSearchText(term)));
  }

  productTags.forEach((tag) => {
    if (tag.length >= 4) aliases.add(tag);
  });

  return Array.from(aliases).filter(Boolean);
}

function buildMerchantBusinessSkeleton(merchantName, merchantSlug, representativeBenefit) {
  return {
    id: merchantSlug,
    name: merchantName,
    category: representativeBenefit?.categories?.[0] || 'otros',
    description: representativeBenefit?.description || '',
    rating: 5,
    location: representativeBenefit?.locations || [],
    image: '',
    benefits: []
  };
}

function enrichMerchantAccumulator(accumulator, benefit) {
  const categories = toArray(benefit.categories).map((category) => normalizeSearchText(category));
  categories.forEach((category) => {
    if (!category) return;
    accumulator.categories.add(category);
    const linkedIntentTags = CATEGORY_TO_INTENT_TAGS[category] || [];
    linkedIntentTags.forEach((intentTag) => accumulator.intentTags.add(intentTag));
  });

  const bank = normalizeSearchText(benefit.bank);
  if (bank) {
    accumulator.banks.add(bank);

    const withoutPrefix = bank.replace(/^banco\s+/, '').trim();
    if (withoutPrefix) {
      accumulator.banks.add(withoutPrefix);
    }

    for (const token of bank.split(' ')) {
      if (token && token.length > 2 && token !== 'banco') {
        accumulator.banks.add(token);
      }
    }
  }

  const locations = toArray(benefit.locations).filter(Boolean);
  for (const location of locations) {
    const key = location.formattedAddress || `${location.lat},${location.lng}`;
    if (!key || accumulator.locationKeys.has(key)) continue;
    accumulator.locationKeys.add(key);
    accumulator.locations.push(location);
  }

  accumulator.maxDiscount = Math.max(
    accumulator.maxDiscount,
    Number.isFinite(benefit.discountPercentage) ? Number(benefit.discountPercentage) : 0
  );
  accumulator.popularity += 1;
  accumulator.online = accumulator.online || Boolean(benefit.online);

  const rewardRate = Number.isFinite(benefit.discountPercentage)
    ? `${Number(benefit.discountPercentage)}%`
    : benefit.installments
      ? `${benefit.installments} cuotas s/int`
      : 'Beneficio';
  const benefitSummary = {
    id: benefit.id || benefit._id?.toString?.() || null,
    bankName: benefit.bank || 'Banco',
    cardName: Array.isArray(benefit.cardTypes) && benefit.cardTypes.length > 0
      ? (benefit.cardTypes[0]?.name || 'Tarjeta de credito')
      : 'Tarjeta de credito',
    cardTypes: Array.isArray(benefit.cardTypes) ? benefit.cardTypes.map((card) => card?.name).filter(Boolean) : [],
    benefit: benefit.benefitTitle || 'Beneficio',
    rewardRate,
    tipo: 'descuento',
    cuando: Array.isArray(benefit.availableDays) ? benefit.availableDays.join(', ') : '',
    valor: Number.isFinite(benefit.discountPercentage) ? `${Number(benefit.discountPercentage)}%` : undefined,
    tope: Array.isArray(benefit.caps) && benefit.caps.length > 0 ? benefit.caps[0]?.amount : null,
    condicion: benefit.termsAndConditions || '',
    requisitos: Array.isArray(benefit.cardTypes) ? benefit.cardTypes.map((card) => card?.name).filter(Boolean) : [],
    usos: benefit.online ? ['online', 'presencial'] : ['presencial'],
    textoAplicacion: benefit.link || undefined,
    description: benefit.description || '',
    installments: benefit.installments || null,
    validUntil: benefit.validUntil || null,
    caps: benefit.caps || [],
    otherDiscounts: benefit.otherDiscounts || [],
    subscription: benefit.subscription || null
  };
  const dedupeKey = `${benefitSummary.bankName}|${benefitSummary.benefit}|${benefitSummary.rewardRate}`;
  if (!accumulator.benefitKeys.has(dedupeKey)) {
    accumulator.benefitKeys.add(dedupeKey);
    accumulator.benefits.push(benefitSummary);
  }

  const productTags = buildProductTags(benefit);
  productTags.forEach((tag) => accumulator.productTagCounts.set(tag, (accumulator.productTagCounts.get(tag) || 0) + 1));

  const freeTextTokens = tokenizeSearchText(`${benefit.benefitTitle || ''} ${benefit.description || ''}`);
  const intentTags = resolveIntentTagsFromTokens([...freeTextTokens, ...categories]);
  intentTags.forEach((intentTag) => accumulator.intentTags.add(intentTag));
}

function buildMerchantDocument(accumulator) {
  const merchantSlug = slugify(accumulator.merchantName);
  const sortedProductTags = Array.from(accumulator.productTagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_PRODUCT_TAGS_PER_MERCHANT)
    .map(([tag]) => tag);

  const intentTags = uniqueStrings(Array.from(accumulator.intentTags));
  const manualAliases = uniqueStrings(
    (MERCHANT_ALIASES[accumulator.merchantKey] || []).map((alias) => normalizeSearchText(alias))
  );
  const aliases = resolveMerchantAliases(
    accumulator.merchantName,
    accumulator.merchantKey,
    sortedProductTags,
    intentTags
  );

  const business = buildMerchantBusinessSkeleton(
    accumulator.merchantName,
    merchantSlug,
    accumulator.representativeBenefit
  );
  business.location = accumulator.locations;
  business.category = (Array.from(accumulator.categories)[0] || business.category || 'otros');
  business.description = accumulator.description || business.description || '';
  business.benefits = accumulator.benefits;

  return {
    entityId: `merchant_${merchantSlug}`,
    entityType: 'merchant',
    merchantId: merchantSlug,
    merchantName: accumulator.merchantName,
    aliases,
    manualAliases,
    intentTags,
    productTags: sortedProductTags,
    categories: uniqueStrings(Array.from(accumulator.categories)),
    banks: uniqueStrings(Array.from(accumulator.banks)),
    maxDiscount: accumulator.maxDiscount,
    online: accumulator.online,
    locations: accumulator.locations.slice(0, 15),
    popularity: accumulator.popularity,
    description: accumulator.description || '',
    searchText: uniqueStrings([
      accumulator.merchantName,
      ...aliases,
      ...intentTags,
      ...sortedProductTags
    ]).join(' '),
    business
  };
}

function buildProductDocuments(merchantDocuments) {
  const productMap = new Map();

  for (const merchant of merchantDocuments) {
    for (const productTag of merchant.productTags || []) {
      if (!productMap.has(productTag)) {
        productMap.set(productTag, {
          entityId: `product_${productTag}`,
          entityType: 'product',
          productTerm: productTag,
          intentTags: new Set(),
          merchantRefs: new Set(),
          categories: new Set(),
          popularity: 0
        });
      }

      const entry = productMap.get(productTag);
      merchant.intentTags.forEach((tag) => entry.intentTags.add(tag));
      merchant.categories.forEach((category) => entry.categories.add(category));
      entry.merchantRefs.add(merchant.merchantId);
      entry.popularity += merchant.popularity || 1;
    }
  }

  return Array.from(productMap.values())
    .map((entry) => ({
      entityId: entry.entityId,
      entityType: entry.entityType,
      productTerm: entry.productTerm,
      intentTags: Array.from(entry.intentTags),
      merchantRefs: Array.from(entry.merchantRefs).slice(0, MAX_MERCHANT_REFS_PER_ENTITY),
      categories: Array.from(entry.categories),
      popularity: entry.popularity,
      searchText: `${entry.productTerm} ${Array.from(entry.intentTags).join(' ')}`
    }))
    .sort((a, b) => b.popularity - a.popularity);
}

function buildIntentDocuments(merchantDocuments) {
  const intentDocs = [];
  for (const [intentKey, intentMeta] of Object.entries(INTENT_TAXONOMY)) {
    const merchantRefs = merchantDocuments
      .filter((merchant) => (merchant.intentTags || []).includes(intentKey))
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, MAX_MERCHANT_REFS_PER_ENTITY)
      .map((merchant) => merchant.merchantId);

    intentDocs.push({
      entityId: `intent_${intentKey}`,
      entityType: 'intent',
      intentKey,
      displayLabel: intentMeta.displayLabel,
      synonyms: intentMeta.synonyms.map((term) => normalizeSearchText(term)).filter(Boolean),
      merchantRefs,
      categoryRefs: intentMeta.categoryRefs || [],
      popularity: merchantRefs.length,
      searchText: `${intentMeta.displayLabel} ${intentMeta.synonyms.join(' ')}`
    });
  }
  return intentDocs;
}

export function buildSearchDataset(benefits) {
  const merchantMap = new Map();

  for (const benefit of benefits || []) {
    const merchantName = benefit?.merchant?.name;
    const merchantKey = normalizeSearchText(merchantName);
    if (!merchantName || !merchantKey) continue;

    if (!merchantMap.has(merchantKey)) {
      merchantMap.set(merchantKey, {
        merchantKey,
        merchantName: merchantName.trim(),
        representativeBenefit: benefit,
        description: benefit.description || '',
        categories: new Set(),
        banks: new Set(),
        intentTags: new Set(),
        productTagCounts: new Map(),
        benefits: [],
        benefitKeys: new Set(),
        locations: [],
        locationKeys: new Set(),
        maxDiscount: 0,
        popularity: 0,
        online: false
      });
    }

    const entry = merchantMap.get(merchantKey);
    if (benefit.description && benefit.description.length > entry.description.length) {
      entry.description = benefit.description;
    }
    enrichMerchantAccumulator(entry, benefit);
  }

  const merchantDocuments = Array.from(merchantMap.values())
    .map(buildMerchantDocument)
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  const productDocuments = buildProductDocuments(merchantDocuments);
  const intentDocuments = buildIntentDocuments(merchantDocuments);

  return {
    merchantDocuments,
    productDocuments,
    intentDocuments,
    allDocuments: [...merchantDocuments, ...productDocuments, ...intentDocuments]
  };
}

export function buildMeiliSynonyms() {
  const synonyms = { ...SEARCH_SYNONYMS };

  for (const intentMeta of Object.values(INTENT_TAXONOMY)) {
    const normalized = intentMeta.synonyms
      .map((term) => normalizeSearchText(term))
      .filter(Boolean);
    for (const term of normalized) {
      const existing = new Set(synonyms[term] || []);
      normalized.forEach((candidate) => {
        if (candidate !== term) existing.add(candidate);
      });
      synonyms[term] = Array.from(existing);
    }
  }

  for (const [merchantKey, aliases] of Object.entries(MERCHANT_ALIASES)) {
    const normalizedAliases = aliases.map((alias) => normalizeSearchText(alias)).filter(Boolean);
    const existing = new Set(synonyms[merchantKey] || []);
    normalizedAliases.forEach((alias) => {
      if (alias !== merchantKey) existing.add(alias);
    });
    synonyms[merchantKey] = Array.from(existing);
  }

  return synonyms;
}
