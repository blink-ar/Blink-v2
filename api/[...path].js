import { MongoClient, ObjectId } from 'mongodb';
import { buildSearchDatasetFromMerchantDocs } from './search/entities.js';
import { resolveIntentTagsFromTokens } from './search/dictionaries.js';
import { meiliSearch, isMeilisearchConfigured } from './search/meilisearch.js';
import { normalizeSearchText, tokenizeSearchText } from './search/normalize.js';

const DEFAULT_COLLECTION = 'confirmed_benefits';
const ALLOWED_COLLECTIONS = new Set([
  'processed_benefits',
  'confirmed_benefits',
  'benefits',
  'bank_subscriptions'
]);

const MERCHANT_ASSETS_COLLECTION = 'merchant_assets';
const BANK_CARDS_COLLECTION = 'bank_cards';
const DEFAULT_BUSINESS_IMAGE =
  'https://images.pexels.com/photos/4386158/pexels-photo-4386158.jpeg?auto=compress&cs=tinysrgb&w=400';

const MONGODB_URI_READ_ONLY = process.env.MONGODB_URI_READ_ONLY;
const DATABASE_NAME = process.env.DATABASE_NAME || 'benefitsV3';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

const globalState = globalThis;
if (!globalState.__blinkMongo) {
  globalState.__blinkMongo = {
    clientPromise: null,
    dbPromise: null
  };
}
if (!globalState.__blinkBankCards) {
  globalState.__blinkBankCards = {
    mapPromise: null,
    loadedAt: 0
  };
}

function json(res, statusCode, payload) {
  res.status(statusCode);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(payload));
}

// Cache-Control directives
const CC_METADATA = 's-maxage=43200, stale-while-revalidate=86400, max-age=3600';  // 12h CDN, 1h browser
const CC_CONTENT  = 's-maxage=3600, stale-while-revalidate=7200, max-age=300';     // 1h CDN, 5m browser
const CC_LOCATION = 'private, max-age=60';                                          // browser-only, 1m

function setCacheControl(res, directive) {
  res.setHeader('Cache-Control', directive);
}

/**
 * Decode a geohash string to its center lat/lng.
 * Returns null if the input is invalid.
 */
function decodeGeohash(hash) {
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let even = true;
  const lat = [-90, 90];
  const lng = [-180, 180];
  for (const c of hash) {
    const bits = BASE32.indexOf(c);
    if (bits === -1) return null;
    for (let i = 4; i >= 0; i--) {
      const bit = (bits >> i) & 1;
      if (even) { const m = (lng[0] + lng[1]) / 2; if (bit) lng[0] = m; else lng[1] = m; }
      else      { const m = (lat[0] + lat[1]) / 2; if (bit) lat[0] = m; else lat[1] = m; }
      even = !even;
    }
  }
  return { latitude: (lat[0] + lat[1]) / 2, longitude: (lng[0] + lng[1]) / 2 };
}

function getParsedUrl(req) {
  const protoHeader = req.headers['x-forwarded-proto'];
  const protocol = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader || 'https';
  const host = req.headers.host || 'localhost';
  return new URL(req.url || '/', `${protocol}://${host}`);
}

function resolveRequestPath(url) {
  if (url.pathname !== '/api/[...path]') {
    return url.pathname;
  }

  const rewrittenPath = url.searchParams.get('path');
  if (!rewrittenPath) {
    return '/api';
  }

  const normalized = rewrittenPath
    .split('/')
    .map((segment) => decodeURIComponent(segment))
    .filter(Boolean)
    .join('/');

  return `/api/${normalized}`;
}

function getCollectionName(searchParams) {
  const collection = searchParams.get('collection');
  if (collection && ALLOWED_COLLECTIONS.has(collection)) {
    return collection;
  }
  return DEFAULT_COLLECTION;
}

function toPositiveInt(value, fallback, max) {
  const parsed = Number.parseInt(value || '', 10);
  const safe = Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  return typeof max === 'number' ? Math.min(safe, max) : safe;
}

function formatLocalDateOnly(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

function shouldIncludeExpired(searchParams) {
  return searchParams.get('includeExpired') === 'true';
}

function getActiveBenefitsMatch(searchParams, now = new Date()) {
  if (shouldIncludeExpired(searchParams)) {
    return null;
  }

  const todayLocal = formatLocalDateOnly(now);
  return {
    $expr: {
      $let: {
        vars: {
          validUntilValue: {
            $ifNull: ['$validUntil', null]
          },
          parsedValidUntil: {
            $convert: {
              input: '$validUntil',
              to: 'date',
              onError: null,
              onNull: null
            }
          }
        },
        in: {
          $or: [
            { $eq: ['$$validUntilValue', null] },
            { $eq: ['$$validUntilValue', ''] },
            {
              $and: [
                { $eq: [{ $type: '$$validUntilValue' }, 'string'] },
                { $regexMatch: { input: '$$validUntilValue', regex: /^\d{4}-\d{2}-\d{2}$/ } },
                { $gte: ['$$validUntilValue', todayLocal] }
              ]
            },
            { $gte: ['$$parsedValidUntil', now] }
          ]
        }
      }
    }
  };
}

function applyActiveBenefitsFilter(query, searchParams) {
  const activeMatch = getActiveBenefitsMatch(searchParams);
  if (!activeMatch) {
    return;
  }

  if (Array.isArray(query.$and)) {
    query.$and.push(activeMatch);
    return;
  }

  query.$and = [activeMatch];
}

function serializeDocWithId(doc) {
  return {
    ...doc,
    id: doc?._id?.toString?.() || doc?.id || null
  };
}

function pickBusinessImage(asset) {
  if (asset?.coverUrl) return asset.coverUrl;
  if (asset?.imageUrl) return asset.imageUrl;
  if (asset?.logoUrl) return asset.logoUrl;
  return DEFAULT_BUSINESS_IMAGE;
}

function dedupeLocations(locations) {
  const uniqueLocations = [];
  const seenKeys = new Set();
  for (const location of Array.isArray(locations) ? locations : []) {
    if (!location) continue;
    const key = location.placeId || location.formattedAddress || `${location.lat},${location.lng}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    uniqueLocations.push(location);
  }
  return uniqueLocations;
}

function buildUsableGeoMatch() {
  return {
    $or: [
      { 'geoPoints.0': { $exists: true } },
      { 'geoPoints.coordinates.0': { $exists: true } }
    ]
  };
}

function buildMissingGeoMatch() {
  return {
    $nor: [
      { 'geoPoints.0': { $exists: true } },
      { 'geoPoints.coordinates.0': { $exists: true } }
    ]
  };
}

function combineQueriesWithAnd(...conditions) {
  const filtered = conditions.filter((condition) => condition && Object.keys(condition).length > 0);
  if (filtered.length === 0) {
    return {};
  }
  if (filtered.length === 1) {
    return filtered[0];
  }
  return {
    $and: filtered
  };
}

function rehydrateBenefitDoc(benefit, merchant) {
  if (!merchant) {
    return serializeDocWithId(benefit);
  }

  return serializeDocWithId({
    ...benefit,
    merchant: {
      name: merchant.merchantName || benefit?.merchant?.name || 'Unknown Merchant'
    },
    categories: Array.isArray(merchant.categories) ? merchant.categories : benefit.categories || [],
    locations: Array.isArray(merchant.locations) ? merchant.locations : benefit.locations || [],
    merchantId: merchant.merchantId || benefit.merchantId || null,
    merchantSnapshot: merchant.merchantId
      ? {
          merchantId: merchant.merchantId,
          merchantKey: merchant.merchantKey,
          merchantName: merchant.merchantName,
          kind: merchant.kind || 'merchant'
        }
      : benefit.merchantSnapshot
  });
}

async function loadMerchantMapByIds(db, merchantIds) {
  const ids = Array.from(new Set((merchantIds || []).filter(Boolean)));
  if (ids.length === 0) {
    return new Map();
  }

  const merchants = await db.collection(MERCHANT_ASSETS_COLLECTION)
    .find(
      {
        merchantId: { $in: ids }
      },
      {
        projection: {
          _id: 0,
          merchantId: 1,
          merchantKey: 1,
          merchantName: 1,
          kind: 1,
          aliases: 1,
          categories: 1,
          locations: 1,
          geoPoints: 1,
          banks: 1,
          subscriptionIds: 1,
          hasOnlineBenefits: 1,
          benefitCount: 1,
          activeBenefitCount: 1,
          maxDiscountPercentage: 1,
          searchProfile: 1,
          imageUrl: 1,
          logoUrl: 1,
          coverUrl: 1,
          isActive: 1
        }
      }
    )
    .toArray();

  return new Map(merchants.map((merchant) => [merchant.merchantId, merchant]));
}

async function resolveCardNameLookup(db, benefits) {
  const cardIds = Array.from(
    new Set(
      (benefits || [])
        .flatMap((benefit) => (Array.isArray(benefit?.cardTypes) ? benefit.cardTypes : []))
        .filter((value) => typeof value === 'string' && ObjectId.isValid(value))
    )
  );

  if (cardIds.length === 0) {
    return new Map();
  }

  const cacheTtlMs = 60 * 60 * 1000;
  const bankCardsCache = globalState.__blinkBankCards;
  const shouldRefresh = !bankCardsCache.mapPromise || (Date.now() - bankCardsCache.loadedAt) > cacheTtlMs;

  if (shouldRefresh) {
    bankCardsCache.loadedAt = Date.now();
    bankCardsCache.mapPromise = db.collection(BANK_CARDS_COLLECTION)
      .find({}, { projection: { issuer: 1, tier: 1 } })
      .toArray()
      .then((cards) => new Map(
        cards.map((card) => {
          const name = [card.issuer, card.tier].filter(Boolean).join(' ').trim() || 'Tarjeta de credito';
          return [card._id.toString(), name];
        })
      ))
      .catch((error) => {
        bankCardsCache.mapPromise = null;
        bankCardsCache.loadedAt = 0;
        throw error;
      });
  }

  const allCardNames = await bankCardsCache.mapPromise;
  return new Map(cardIds.map((cardId) => [cardId, allCardNames.get(cardId)]).filter(([, name]) => Boolean(name)));
}

function formatBenefitValue(benefit) {
  if (Number.isFinite(benefit?.discountPercentage) && Number(benefit.discountPercentage) > 0) {
    return `${Number(benefit.discountPercentage)}%`;
  }
  if (Number.isFinite(benefit?.installments) && Number(benefit.installments) > 0) {
    return `${Number(benefit.installments)} cuotas s/int`;
  }
  if (typeof benefit?.otherDiscounts === 'string' && benefit.otherDiscounts.trim()) {
    return benefit.otherDiscounts.trim();
  }
  return null;
}

function buildBusinessBenefitSummary(benefit, cardNameLookup) {
  const cardNames = Array.from(
    new Set(
      (Array.isArray(benefit?.cardTypes) ? benefit.cardTypes : [])
        .map((cardId) => cardNameLookup.get(cardId))
        .filter(Boolean)
    )
  );
  const value = formatBenefitValue(benefit);

  return {
    id: benefit?.id || benefit?._id?.toString?.() || null,
    bankName: benefit?.bank || 'Banco',
    cardName: cardNames[0] || 'Tarjeta de credito',
    cardTypes: cardNames,
    benefit: benefit?.benefitTitle || 'Beneficio',
    rewardRate: value || 'Beneficio',
    tipo: 'descuento',
    cuando: Array.isArray(benefit?.availableDays) ? benefit.availableDays.join(', ') : '',
    valor: value,
    tope:
      Array.isArray(benefit?.caps) && benefit.caps.length > 0 && Number.isFinite(benefit.caps[0]?.amount)
        ? benefit.caps[0].amount
        : null,
    condicion: benefit?.termsAndConditions || null,
    requisitos: cardNames.length > 0 ? cardNames : ['Tarjeta de credito'],
    usos: benefit?.online ? ['online', 'presencial'] : ['presencial'],
    textoAplicacion: benefit?.link || null,
    description: benefit?.description || '',
    installments: Number.isFinite(benefit?.installments) ? Number(benefit.installments) : null,
    validUntil: benefit?.validUntil || null,
    caps: Array.isArray(benefit?.caps) ? benefit.caps : [],
    otherDiscounts: benefit?.otherDiscounts || null,
    subscription: benefit?.subscription || null
  };
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

function formatDistanceText(distance) {
  if (!Number.isFinite(distance)) return null;
  if (distance < 1) return `${Math.round(distance * 1000)}m`;
  if (distance < 10) return `${Math.round(distance * 10) / 10}km`;
  return `${Math.round(distance)}km`;
}

const LOCAL_DISTANCE_RADIUS_KM = Number.parseFloat(process.env.SEARCH_LOCAL_DISTANCE_RADIUS_KM || '80');
const DISTANT_RESULT_CUTOFF_KM = Number.parseFloat(process.env.SEARCH_DISTANT_RESULT_CUTOFF_KM || '120');
const MIN_NEARBY_RESULTS_FOR_DISTANCE_PRUNING = Number.parseInt(
  process.env.SEARCH_MIN_NEARBY_RESULTS_FOR_DISTANCE_PRUNING || '3',
  10
);
const MERCHANT_EXACT_RESCUE_LIMIT = 25;
const MERCHANT_PREFIX_RESCUE_LIMIT = 150;
const MERCHANT_SEARCH_RESCUE_PROJECTION = {
  _id: 0,
  merchantId: 1,
  merchantName: 1,
  merchantKey: 1,
  categories: 1,
  banks: 1,
  locations: 1,
  maxDiscountPercentage: 1,
  hasOnlineBenefits: 1,
  activeBenefitCount: 1,
  benefitCount: 1,
  searchProfile: 1,
  imageUrl: 1,
  logoUrl: 1,
  coverUrl: 1
};

function isFiniteDistanceKm(value) {
  return Number.isFinite(value);
}

function applyLocalDistanceGuardrail(merchantHits, filters) {
  if (!Number.isFinite(filters?.lat) || !Number.isFinite(filters?.lng)) {
    return merchantHits;
  }

  const withDistance = (merchantHits || []).filter((hit) => isFiniteDistanceKm(hit?.business?.distance));
  if (withDistance.length === 0) return merchantHits;

  const nearbyCount = withDistance.filter((hit) => hit.business.distance <= LOCAL_DISTANCE_RADIUS_KM).length;
  if (nearbyCount < MIN_NEARBY_RESULTS_FOR_DISTANCE_PRUNING) {
    return merchantHits;
  }

  return merchantHits.filter((hit) => {
    const distance = hit?.business?.distance;
    if (!isFiniteDistanceKm(distance)) return true;
    return distance <= DISTANT_RESULT_CUTOFF_KM;
  });
}

function enrichBusinessWithDistance(business, userLat, userLng) {
  if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
    return business;
  }

  const locations = Array.isArray(business.location) ? business.location : [];
  const validDistances = locations
    .filter((location) => Number.isFinite(location?.lat) && Number.isFinite(location?.lng))
    .map((location) => haversineKm(userLat, userLng, Number(location.lat), Number(location.lng)));

  if (validDistances.length === 0) return business;
  const distance = Math.min(...validDistances);
  return {
    ...business,
    distance,
    distanceText: formatDistanceText(distance),
    isNearby: distance <= 50
  };
}

function parseSearchFilters(searchParams) {
  const bank = searchParams.get('bank') || undefined;
  const category = searchParams.get('category') || undefined;
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const lat = latParam != null ? Number.parseFloat(latParam) : null;
  const lng = lngParam != null ? Number.parseFloat(lngParam) : null;
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);
  return {
    bank,
    category,
    lat: hasLocation ? lat : null,
    lng: hasLocation ? lng : null
  };
}

function buildExpandedQueryTokens(query) {
  const normalized = normalizeSearchText(query);
  const tokens = tokenizeSearchText(query);
  return Array.from(new Set([normalized, ...tokens].filter(Boolean)));
}

function buildActiveMerchantSearchQuery(filters, searchParams) {
  const query = {
    isActive: { $ne: false },
    merchantId: { $exists: true, $type: 'string' },
    ...(shouldIncludeExpired(searchParams)
      ? { benefitCount: { $gt: 0 } }
      : { activeBenefitCount: { $gt: 0 } })
  };

  if (filters.category && filters.category !== 'all') {
    query.categories = { $in: [filters.category] };
  }

  if (filters.bank) {
    const bankPatterns = filters.bank
      .split(',')
      .map((bank) => bank.trim())
      .filter(Boolean)
      .map((bank) => new RegExp(escapeRegex(bank), 'i'));
    if (bankPatterns.length > 0) {
      query.banks = { $in: bankPatterns };
    }
  }

  return query;
}

function buildMerchantNameRescueClauses(pattern) {
  return [
    { merchantName: { $regex: pattern } },
    { merchantKey: { $regex: pattern } },
    { aliases: { $elemMatch: { $regex: pattern } } },
    { 'searchProfile.aliases': { $elemMatch: { $regex: pattern } } }
  ];
}

function mergeMerchantDocsById(merchantLists) {
  const mergedByMerchantId = new Map();
  for (const merchants of merchantLists || []) {
    for (const merchant of Array.isArray(merchants) ? merchants : []) {
      const merchantId = merchant?.merchantId;
      if (!merchantId || mergedByMerchantId.has(merchantId)) continue;
      mergedByMerchantId.set(merchantId, merchant);
    }
  }
  return Array.from(mergedByMerchantId.values());
}

async function loadMerchantNameRescueDocs(db, normalizedQuery, filters, searchParams) {
  if (!normalizedQuery) {
    return [];
  }

  const merchantCollection = db.collection(MERCHANT_ASSETS_COLLECTION);
  const baseQuery = buildActiveMerchantSearchQuery(filters, searchParams);
  const exactPattern = new RegExp(`^${escapeRegex(normalizedQuery)}$`, 'i');
  const prefixPattern = new RegExp(`^${escapeRegex(normalizedQuery)}`, 'i');

  const exactMatches = await merchantCollection
    .find(
      combineQueriesWithAnd(baseQuery, {
        $or: buildMerchantNameRescueClauses(exactPattern)
      }),
      {
        projection: MERCHANT_SEARCH_RESCUE_PROJECTION
      }
    )
    .sort({ activeBenefitCount: -1, benefitCount: -1, merchantName: 1 })
    .limit(MERCHANT_EXACT_RESCUE_LIMIT)
    .toArray();

  if (normalizedQuery.length < 2) {
    return exactMatches;
  }

  const exactIds = exactMatches.map((merchant) => merchant.merchantId).filter(Boolean);
  const prefixMatches = await merchantCollection
    .find(
      combineQueriesWithAnd(
        baseQuery,
        exactIds.length > 0 ? { merchantId: { $nin: exactIds } } : null,
        {
          $or: buildMerchantNameRescueClauses(prefixPattern)
        }
      ),
      {
        projection: MERCHANT_SEARCH_RESCUE_PROJECTION
      }
    )
    .sort({ activeBenefitCount: -1, benefitCount: -1, merchantName: 1 })
    .limit(MERCHANT_PREFIX_RESCUE_LIMIT)
    .toArray();

  return mergeMerchantDocsById([exactMatches, prefixMatches]);
}

function buildMeiliFilter(entityType, filters) {
  const clauses = [`entityType = "${entityType}"`];
  if (filters.category && filters.category !== 'all') {
    clauses.push(`categories = "${normalizeSearchText(filters.category)}"`);
  }

  if (filters.bank) {
    const banks = filters.bank
      .split(',')
      .map((value) => normalizeSearchText(value))
      .filter(Boolean);
    if (banks.length > 0) {
      const bankClause = banks.map((bank) => `banks = "${bank}"`).join(' OR ');
      clauses.push(`(${bankClause})`);
    }
  }

  return clauses.join(' AND ');
}

function buildMerchantSeedFilter(seedMerchantIds, filters) {
  const ids = (seedMerchantIds || []).filter(Boolean);
  if (ids.length === 0) {
    return buildMeiliFilter('merchant', filters);
  }

  const escapedIds = ids.map((id) => `"${String(id).replace(/"/g, '\\"')}"`).join(', ');
  return `${buildMeiliFilter('merchant', filters)} AND merchantId IN [${escapedIds}]`;
}

function buildMerchantCategoryFilter(seedCategories, filters) {
  const categories = (seedCategories || [])
    .map((value) => normalizeSearchText(value))
    .filter(Boolean);
  if (categories.length === 0) {
    return buildMeiliFilter('merchant', filters);
  }

  const categoryClause = categories.map((category) => `categories = "${category}"`).join(' OR ');
  return `${buildMeiliFilter('merchant', filters)} AND (${categoryClause})`;
}

function mergeMerchantHitCandidates(hitLists) {
  const mergedByMerchantId = new Map();
  for (const hits of hitLists || []) {
    for (const hit of Array.isArray(hits) ? hits : []) {
      const merchantId = hit?.merchantId || hit?.entityId;
      if (!merchantId) continue;
      if (!mergedByMerchantId.has(merchantId)) {
        mergedByMerchantId.set(merchantId, hit);
      }
    }
  }
  return Array.from(mergedByMerchantId.values());
}

function collectSeedMerchantIds(intentHits, productHits, maxIds = 350) {
  const out = [];
  const seen = new Set();

  const pushId = (id) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    out.push(id);
  };

  for (const hit of Array.isArray(intentHits) ? intentHits : []) {
    for (const id of Array.isArray(hit?.merchantRefs) ? hit.merchantRefs : []) {
      pushId(id);
      if (out.length >= maxIds) return out;
    }
  }

  for (const hit of Array.isArray(productHits) ? productHits : []) {
    for (const id of Array.isArray(hit?.merchantRefs) ? hit.merchantRefs : []) {
      pushId(id);
      if (out.length >= maxIds) return out;
    }
  }

  return out;
}

function buildProductCategorySignalMap(productHits) {
  const signalByCategory = new Map();
  const products = Array.isArray(productHits) ? productHits : [];

  for (let productRank = 0; productRank < products.length; productRank += 1) {
    const hit = products[productRank];
    const categories = Array.isArray(hit?.categories) ? hit.categories : [];
    const productScore = Number(hit?._rankingScore || 0.5);
    const productWeight = Math.max(0.25, 1 - productRank * 0.15) * Math.max(0.4, productScore);

    for (const category of categories) {
      const normalized = normalizeSearchText(category);
      if (!normalized) continue;
      const boost = 120 * productWeight;
      signalByCategory.set(normalized, (signalByCategory.get(normalized) || 0) + boost);
    }
  }

  return signalByCategory;
}

function getTopCategoriesBySignal(signalByCategory, maxCategories = 4, minSignal = 20) {
  return Array.from(signalByCategory.entries())
    .filter(([, signal]) => signal >= minSignal)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxCategories)
    .map(([category]) => category);
}

function getCategorySignalBoostForMerchant(hit, categorySignalMap) {
  const categories = Array.isArray(hit?.categories) ? hit.categories : [];
  let boost = 0;
  for (const category of categories) {
    const normalized = normalizeSearchText(category);
    boost += categorySignalMap.get(normalized) || 0;
  }
  return Math.min(boost, 220);
}

function buildIntentReferenceBoostMap(intentHits) {
  const boostByMerchant = new Map();
  const intents = Array.isArray(intentHits) ? intentHits : [];

  for (let intentRank = 0; intentRank < intents.length; intentRank += 1) {
    const hit = intents[intentRank];
    const merchantRefs = Array.isArray(hit?.merchantRefs) ? hit.merchantRefs : [];
    const intentScore = Number(hit?._rankingScore || 0.5);
    const intentWeight = Math.max(0.25, 1 - intentRank * 0.2) * Math.max(0.4, intentScore);

    for (let refRank = 0; refRank < merchantRefs.length; refRank += 1) {
      const merchantId = merchantRefs[refRank];
      if (!merchantId) continue;

      const positionBoost = Math.max(0, 260 - refRank * 10);
      if (positionBoost <= 0) break;

      const boost = positionBoost * intentWeight;
      boostByMerchant.set(merchantId, (boostByMerchant.get(merchantId) || 0) + boost);
    }
  }

  return boostByMerchant;
}

function buildProductReferenceBoostMap(productHits) {
  const boostByMerchant = new Map();
  const products = Array.isArray(productHits) ? productHits : [];

  for (let productRank = 0; productRank < products.length; productRank += 1) {
    const hit = products[productRank];
    const merchantRefs = Array.isArray(hit?.merchantRefs) ? hit.merchantRefs : [];
    const productScore = Number(hit?._rankingScore || 0.5);
    const productWeight = Math.max(0.25, 1 - productRank * 0.15) * Math.max(0.4, productScore);

    for (let refRank = 0; refRank < merchantRefs.length; refRank += 1) {
      const merchantId = merchantRefs[refRank];
      if (!merchantId) continue;

      const positionBoost = Math.max(0, 220 - refRank * 9);
      if (positionBoost <= 0) break;

      const boost = positionBoost * productWeight;
      boostByMerchant.set(merchantId, (boostByMerchant.get(merchantId) || 0) + boost);
    }
  }

  return boostByMerchant;
}

function scoreMerchantHit(hit, normalizedQuery, expandedTokens, intentTags) {
  const reasons = [];
  let score = Number(hit?._rankingScore || 0) * 100;

  const merchantName = normalizeSearchText(hit.merchantName || '');
  const aliases = (Array.isArray(hit.aliases) ? hit.aliases : []).map((value) => normalizeSearchText(value));
  const aliasSet = new Set(aliases);
  const manualAliasSet = new Set(
    (Array.isArray(hit.manualAliases) ? hit.manualAliases : []).map((value) => normalizeSearchText(value))
  );
  const productTags = (Array.isArray(hit.productTags) ? hit.productTags : []).map((value) => normalizeSearchText(value));
  const intentHitTags = Array.isArray(hit.intentTags) ? hit.intentTags : [];

  if (merchantName && merchantName === normalizedQuery) {
    score += 1000;
    reasons.push('merchant_exact');
  } else if (merchantName && merchantName.startsWith(normalizedQuery)) {
    score += 450;
    reasons.push('merchant_prefix');
  }

  if (aliasSet.has(normalizedQuery)) {
    score += 700;
    reasons.push('alias_exact');
  }
  if (manualAliasSet.has(normalizedQuery)) {
    score += 2200;
    reasons.push('manual_alias_exact');
  }

  const aliasOverlap = expandedTokens.filter((token) => aliasSet.has(token)).length;
  if (aliasOverlap > 0) {
    score += aliasOverlap * 80;
    reasons.push('alias_overlap');
  }
  const manualAliasOverlap = expandedTokens.filter((token) => manualAliasSet.has(token)).length;
  if (manualAliasOverlap > 0) {
    score += manualAliasOverlap * 180;
    reasons.push('manual_alias_overlap');
  }

  const productOverlap = expandedTokens.filter((token) => productTags.includes(token)).length;
  if (productOverlap > 0) {
    score += productOverlap * 45;
    reasons.push('product_tag_overlap');
  }

  const intentOverlap = intentTags.filter((tag) => intentHitTags.includes(tag)).length;
  if (intentOverlap > 0) {
    score += intentOverlap * 95;
    reasons.push('intent_overlap');
  }

  score += Number(hit.popularity || 0) * 0.6;
  score += Number(hit.maxDiscount || 0) * 0.4;

  return {
    score,
    reasons
  };
}

function mapMerchantHitToResponse(hit, scoreMeta, filters) {
  const business = {
    ...(hit.business || {
      id: hit.merchantId || normalizeSearchText(hit.merchantName).replace(/\s+/g, '-'),
      name: hit.merchantName,
      category: hit.categories?.[0] || 'otros',
      description: hit.description || '',
      rating: 5,
      location: hit.locations || [],
      image: '',
      benefits: []
    }),
    benefits: Array.isArray(hit.business?.benefits) ? hit.business.benefits : [],
    location: Array.isArray(hit.business?.location) ? hit.business.location : (Array.isArray(hit.locations) ? hit.locations : []),
    image: hit.business?.image || ''
  };

  const withDistance = enrichBusinessWithDistance(business, filters.lat, filters.lng);

  return {
    entityId: hit.entityId,
    merchantId: hit.merchantId,
    merchantName: hit.merchantName,
    aliases: hit.aliases || [],
    intentTags: hit.intentTags || [],
    productTags: hit.productTags || [],
    categories: hit.categories || [],
    banks: hit.banks || [],
    score: scoreMeta.score,
    reasons: scoreMeta.reasons,
    business: withDistance
  };
}

function mapIntentHit(hit) {
  return {
    entityId: hit.entityId,
    intentKey: hit.intentKey,
    displayLabel: hit.displayLabel,
    synonyms: hit.synonyms || [],
    merchantRefs: hit.merchantRefs || [],
    categoryRefs: hit.categoryRefs || [],
    score: Number(hit._rankingScore || 0)
  };
}

function mapProductHit(hit) {
  return {
    entityId: hit.entityId,
    productTerm: hit.productTerm,
    intentTags: hit.intentTags || [],
    merchantRefs: hit.merchantRefs || [],
    categories: hit.categories || [],
    score: Number(hit._rankingScore || 0)
  };
}

async function searchFromMongoFallback(db, collectionName, query, limitNum, offsetNum, filters, searchParams) {
  const expandedTokens = buildExpandedQueryTokens(query);
  const regexSource = expandedTokens.map(escapeRegex).join('|') || escapeRegex(query);
  const regex = new RegExp(regexSource, 'i');

  const merchantQuery = combineQueriesWithAnd(
    buildActiveMerchantSearchQuery(filters, searchParams),
    {
      $or: [
        { merchantName: { $regex: regex } },
        { aliases: { $regex: regex } },
        { categories: { $regex: regex } },
        { banks: { $regex: regex } },
        { 'searchProfile.description': { $regex: regex } },
        { 'searchProfile.productTags': { $regex: regex } },
        { 'searchProfile.benefits.benefit': { $regex: regex } },
        { 'searchProfile.benefits.description': { $regex: regex } }
      ]
    }
  );

  const fallbackMerchants = await db.collection(MERCHANT_ASSETS_COLLECTION)
    .find(merchantQuery)
    .limit(600)
    .toArray();
  const rescueMerchants = await loadMerchantNameRescueDocs(
    db,
    normalizeSearchText(query),
    filters,
    searchParams
  );

  const dataset = buildSearchDatasetFromMerchantDocs(
    mergeMerchantDocsById([fallbackMerchants, rescueMerchants])
  );
  const normalizedQuery = normalizeSearchText(query);
  const intentTags = resolveIntentTagsFromTokens(expandedTokens);

  const merchantHits = dataset.merchantDocuments
    .map((hit) => {
      const scoreMeta = scoreMerchantHit(hit, normalizedQuery, expandedTokens, intentTags);
      return mapMerchantHitToResponse(hit, scoreMeta, filters);
    })
    .sort((a, b) => b.score - a.score);

  const distanceAwareMerchants = applyLocalDistanceGuardrail(merchantHits, filters);
  const pagedMerchants = distanceAwareMerchants.slice(offsetNum, offsetNum + limitNum);
  const intentHits = dataset.intentDocuments
    .filter((intent) => intentTags.includes(intent.intentKey))
    .slice(0, 12)
    .map((intent) => ({
      entityId: intent.entityId,
      intentKey: intent.intentKey,
      displayLabel: intent.displayLabel,
      synonyms: intent.synonyms || [],
      merchantRefs: intent.merchantRefs || [],
      categoryRefs: intent.categoryRefs || [],
      score: 1
    }));
  const productHits = dataset.productDocuments
    .filter((product) => expandedTokens.includes(product.productTerm))
    .slice(0, 12)
    .map((product) => ({
      entityId: product.entityId,
      productTerm: product.productTerm,
      intentTags: product.intentTags || [],
      merchantRefs: product.merchantRefs || [],
      categories: product.categories || [],
      score: 1
    }));

  return {
    source: 'mongodb_fallback',
    expandedTokens,
    merchants: pagedMerchants,
    intents: intentHits,
    products: productHits,
    totalMerchants: distanceAwareMerchants.length
  };
}

async function handleSearch(req, res, url, db) {
  const searchParams = url.searchParams;
  const q = searchParams.get('q');
  if (!q || !q.trim()) {
    return json(res, 400, {
      success: false,
      error: 'Missing required query param: q'
    });
  }

  const collectionName = getCollectionName(searchParams);
  const limitNum = Math.min(Math.max(toPositiveInt(searchParams.get('limit'), 20), 1), 100);
  const offsetNum = Math.max(toPositiveInt(searchParams.get('offset'), 0), 0);
  const sectionLimit = Math.min(Math.max(toPositiveInt(searchParams.get('sectionLimit'), 12), 1), 30);
  const filters = parseSearchFilters(searchParams);
  const debugMode = searchParams.get('debug') === '1' || process.env.SEARCH_DEBUG === 'true';

  const normalized = normalizeSearchText(q);
  const expandedTokens = buildExpandedQueryTokens(q);
  const expandedQuery = expandedTokens.join(' ');
  const intentTags = resolveIntentTagsFromTokens(expandedTokens);

  const debug = {
    normalized,
    expandedTokens,
    mode: 'meilisearch'
  };

  try {
    if (!isMeilisearchConfigured()) {
      throw new Error('Meilisearch is not configured');
    }

    // Fetch a wider candidate window, then apply business-aware rescoring.
    // This is needed so strong alias/intent matches (e.g. FREDDO for gastronomy terms)
    // are still considered even if raw lexical rank is lower.
    const merchantSearch = await meiliSearch(expandedQuery, {
      limit: Math.min(limitNum + offsetNum + 400, 1000),
      filter: buildMeiliFilter('merchant', filters),
      showRankingScore: true
    });
    const intentSearch = await meiliSearch(expandedQuery, {
      limit: sectionLimit,
      filter: buildMeiliFilter('intent', filters),
      showRankingScore: true
    });
    const productSearch = await meiliSearch(expandedQuery, {
      limit: sectionLimit,
      filter: buildMeiliFilter('product', filters),
      showRankingScore: true
    });

    const seedMerchantIds = collectSeedMerchantIds(intentSearch.hits || [], productSearch.hits || []);
    const merchantBaseHits = Array.isArray(merchantSearch.hits) ? merchantSearch.hits : [];
    const rescueMerchantDocs = await loadMerchantNameRescueDocs(db, normalized, filters, searchParams);
    const rescueMerchantHits = buildSearchDatasetFromMerchantDocs(rescueMerchantDocs).merchantDocuments;
    let merchantCandidateHits = mergeMerchantHitCandidates([merchantBaseHits, rescueMerchantHits]);

    if (seedMerchantIds.length > 0) {
      const currentIds = new Set(merchantCandidateHits.map((hit) => hit?.merchantId).filter(Boolean));
      const missingSeedIds = seedMerchantIds.filter((id) => !currentIds.has(id));

      if (missingSeedIds.length > 0) {
        const seededMerchantSearch = await meiliSearch('', {
          limit: Math.min(missingSeedIds.length, 350),
          filter: buildMerchantSeedFilter(missingSeedIds, filters),
          showRankingScore: true
        });

        merchantCandidateHits = mergeMerchantHitCandidates([
          merchantCandidateHits,
          Array.isArray(seededMerchantSearch.hits) ? seededMerchantSearch.hits : []
        ]);
      }
    }

    const productCategorySignalMap = buildProductCategorySignalMap(productSearch.hits || []);
    const topSeedCategories = getTopCategoriesBySignal(productCategorySignalMap);
    const shouldExpandByCategory =
      topSeedCategories.length > 0 && merchantCandidateHits.length < Math.max(limitNum + offsetNum + 80, 120);

    if (shouldExpandByCategory) {
      const categoryExpansionSearch = await meiliSearch('', {
        limit: 300,
        filter: buildMerchantCategoryFilter(topSeedCategories, filters),
        showRankingScore: true
      });

      merchantCandidateHits = mergeMerchantHitCandidates([
        merchantCandidateHits,
        Array.isArray(categoryExpansionSearch.hits) ? categoryExpansionSearch.hits : []
      ]);
    }

    const intentReferenceBoost = buildIntentReferenceBoostMap(intentSearch.hits || []);
    const productReferenceBoost = buildProductReferenceBoostMap(productSearch.hits || []);
    const scoredMerchantHits = merchantCandidateHits
      .map((hit) => {
        const scoreMeta = scoreMerchantHit(hit, normalized, expandedTokens, intentTags);
        const intentBoost = intentReferenceBoost.get(hit.merchantId) || 0;
        if (intentBoost > 0) {
          scoreMeta.score += intentBoost;
          scoreMeta.reasons.push('intent_ref_boost');
        }
        const productBoost = productReferenceBoost.get(hit.merchantId) || 0;
        if (productBoost > 0) {
          scoreMeta.score += productBoost;
          scoreMeta.reasons.push('product_ref_boost');
        }
        const categoryBoost = getCategorySignalBoostForMerchant(hit, productCategorySignalMap);
        if (categoryBoost > 0) {
          scoreMeta.score += categoryBoost;
          scoreMeta.reasons.push('product_category_boost');
        }
        return mapMerchantHitToResponse(hit, scoreMeta, filters);
      })
      .sort((a, b) => b.score - a.score);

    const distanceAwareMerchants = applyLocalDistanceGuardrail(scoredMerchantHits, filters);
    const merchants = distanceAwareMerchants.slice(offsetNum, offsetNum + limitNum);
    const intents = (intentSearch.hits || []).map(mapIntentHit);
    const products = (productSearch.hits || []).map(mapProductHit);
    const totalMerchants = distanceAwareMerchants.length;

    return json(res, 200, {
      success: true,
      source: 'meilisearch',
      query: {
        q,
        normalized,
        expanded: expandedTokens,
        limit: limitNum,
        offset: offsetNum,
        filters: {
          ...(filters.bank && { bank: filters.bank }),
          ...(filters.category && { category: filters.category })
        }
      },
      intents,
      merchants,
      products,
      pagination: {
        totalMerchants,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + merchants.length < totalMerchants
      },
      ...(debugMode && {
        debug: {
          ...debug,
          meiliEstimatedTotal: merchantSearch.estimatedTotalHits || null,
          meiliDistancePrunedTotal: distanceAwareMerchants.length,
          meiliRescuedByNameCount: rescueMerchantHits.length,
          meiliCategoryExpanded: shouldExpandByCategory,
          meiliCategorySeeds: topSeedCategories
        }
      })
    });
  } catch (error) {
    console.error('[Search] Meilisearch unavailable, falling back to Mongo regex search:', error);
    debug.mode = 'mongodb_fallback';
    debug.error = error instanceof Error ? error.message : 'unknown';

    const fallback = await searchFromMongoFallback(
      db,
      collectionName,
      q,
      limitNum,
      offsetNum,
      filters,
      searchParams
    );

    return json(res, 200, {
      success: true,
      source: fallback.source,
      query: {
        q,
        normalized,
        expanded: fallback.expandedTokens,
        limit: limitNum,
        offset: offsetNum,
        filters: {
          ...(filters.bank && { bank: filters.bank }),
          ...(filters.category && { category: filters.category })
        }
      },
      intents: fallback.intents,
      merchants: fallback.merchants,
      products: fallback.products,
      pagination: {
        totalMerchants: fallback.totalMerchants,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + fallback.merchants.length < fallback.totalMerchants
      },
      ...(debugMode && { debug })
    });
  }
}

async function getDb() {
  if (!MONGODB_URI_READ_ONLY) {
    throw new Error('MONGODB_URI_READ_ONLY environment variable is required');
  }

  if (!globalState.__blinkMongo.clientPromise) {
    const client = new MongoClient(MONGODB_URI_READ_ONLY);
    globalState.__blinkMongo.clientPromise = client.connect();
  }

  if (!globalState.__blinkMongo.dbPromise) {
    globalState.__blinkMongo.dbPromise = globalState.__blinkMongo.clientPromise.then((client) => client.db(DATABASE_NAME));
  }

  return globalState.__blinkMongo.dbPromise;
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string') {
    if (!req.body.trim()) return {};
    return JSON.parse(req.body);
  }

  if (Buffer.isBuffer(req.body)) {
    const raw = req.body.toString('utf8');
    if (!raw.trim()) return {};
    return JSON.parse(raw);
  }

  return {};
}

async function fetchGooglePlaceDetails(placeId) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key not configured');
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set(
    'fields',
    'place_id,name,formatted_address,geometry,types,address_components,rating,user_ratings_total,price_level,opening_hours'
  );
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Place Details API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.status !== 'OK' || !data.result) {
    return null;
  }

  const result = data.result;
  const location = result.geometry?.location;
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    return null;
  }

  const addressComponents = {};
  if (Array.isArray(result.address_components)) {
    for (const component of result.address_components) {
      for (const type of component.types || []) {
        if (type === 'street_number') addressComponents.streetNumber = component.long_name;
        if (type === 'route') addressComponents.route = component.long_name;
        if (type === 'neighborhood') addressComponents.neighborhood = component.long_name;
        if (type === 'sublocality') addressComponents.sublocality = component.long_name;
        if (type === 'locality') addressComponents.locality = component.long_name;
        if (type === 'administrative_area_level_1') addressComponents.adminAreaLevel1 = component.long_name;
        if (type === 'administrative_area_level_2') addressComponents.adminAreaLevel2 = component.long_name;
        if (type === 'postal_code') addressComponents.postalCode = component.long_name;
        if (type === 'country') {
          addressComponents.country = component.long_name;
          addressComponents.countryCode = component.short_name;
        }
      }
    }
  }

  return {
    placeId: result.place_id,
    lat: location.lat,
    lng: location.lng,
    geohash: undefined,
    formattedAddress: result.formatted_address,
    name: result.name,
    addressComponents,
    types: result.types,
    source: 'name',
    provider: 'google',
    confidence: 1,
    raw: JSON.stringify(result),
    meta: JSON.stringify({
      rating: result.rating,
      user_ratings_total: result.user_ratings_total,
      price_level: result.price_level,
      opening_hours: result.opening_hours
    }),
    updatedAt: new Date().toISOString()
  };
}

async function resolveMerchantIdsForBenefitQuery(db, { category, search }) {
  if (!category && !search) {
    return null;
  }

  const merchantQuery = {
    merchantId: { $exists: true, $type: 'string' },
    isActive: { $ne: false }
  };

  if (category && category !== 'all') {
    merchantQuery.categories = { $in: [category] };
  }

  if (search) {
    merchantQuery.$or = [
      { merchantName: { $regex: search, $options: 'i' } },
      { aliases: { $regex: search, $options: 'i' } }
    ];
  }

  const merchantIds = await db.collection(MERCHANT_ASSETS_COLLECTION).distinct('merchantId', merchantQuery);
  return merchantIds.length > 0 ? merchantIds : [];
}

async function handleGetBenefits(req, res, url, db) {
  const searchParams = url.searchParams;
  const collectionName = getCollectionName(searchParams);
  const includeExpired = shouldIncludeExpired(searchParams);

  const category = searchParams.get('category');
  const bank = searchParams.get('bank');
  const network = searchParams.get('network');
  const online = searchParams.get('online');
  const search = searchParams.get('search');
  const limitNum = toPositiveInt(searchParams.get('limit'), 50, 100);
  const offsetNum = toPositiveInt(searchParams.get('offset'), 0);

  const query = {};

  if (bank) {
    query.bank = { $regex: bank, $options: 'i' };
  }

  if (network) {
    query.network = { $regex: network, $options: 'i' };
  }

  if (online !== null) {
    query.online = online === 'true';
  }

  if (search) {
    query.$or = [
      { benefitTitle: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const merchantIds = await resolveMerchantIdsForBenefitQuery(db, { category, search });
  if (Array.isArray(merchantIds)) {
    if (merchantIds.length === 0) {
      return json(res, 200, {
        success: true,
        benefits: [],
        pagination: {
          total: 0,
          limit: limitNum,
          offset: offsetNum,
          hasMore: false
        },
        filters: {
          category,
          bank,
          network,
          online,
          search,
          includeExpired
        }
      });
    }
    query.merchantId = { $in: merchantIds };
  }

  applyActiveBenefitsFilter(query, searchParams);

  const collection = db.collection(collectionName);
  const [benefits, total] = await Promise.all([
    collection.find(query).sort({ _id: -1 }).skip(offsetNum).limit(limitNum).toArray(),
    collection.countDocuments(query)
  ]);
  const merchantMap = await loadMerchantMapByIds(
    db,
    benefits.map((benefit) => benefit.merchantId).filter(Boolean)
  );

  setCacheControl(res, CC_CONTENT);
  return json(res, 200, {
    success: true,
    benefits: benefits.map((benefit) => rehydrateBenefitDoc(benefit, merchantMap.get(benefit.merchantId))),
    pagination: {
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total
    },
    filters: {
      category,
      bank,
      network,
      online,
      search,
      includeExpired
    }
  });
}

async function handleGetBenefitById(req, res, url, db, id) {
  const searchParams = url.searchParams;
  const collectionName = getCollectionName(searchParams);
  const collection = db.collection(collectionName);

  let query;
  try {
    query = { _id: new ObjectId(id) };
  } catch {
    query = { id };
  }

  const activeMatch = getActiveBenefitsMatch(searchParams);
  const finalQuery = activeMatch ? { $and: [query, activeMatch] } : query;

  const benefit = await collection.findOne(finalQuery);
  if (!benefit) {
    return json(res, 404, {
      error: 'Benefit not found',
      id
    });
  }

  const merchantMap = await loadMerchantMapByIds(db, [benefit.merchantId].filter(Boolean));
  setCacheControl(res, CC_CONTENT);
  return json(res, 200, {
    success: true,
    benefit: rehydrateBenefitDoc(benefit, merchantMap.get(benefit.merchantId))
  });
}

async function handleGetCategories(req, res, url, db) {
  const searchParams = url.searchParams;
  const collectionName = getCollectionName(searchParams);
  const activeMatch = getActiveBenefitsMatch(searchParams);

  const categories = await db.collection(collectionName)
    .aggregate([
      ...(activeMatch ? [{ $match: activeMatch }] : []),
      { $unwind: '$categories' },
      { $group: { _id: '$categories', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    .toArray();

  setCacheControl(res, CC_METADATA);
  return json(res, 200, {
    success: true,
    categories: categories.map((cat) => ({
      name: cat._id,
      count: cat.count
    }))
  });
}

async function handleGetBanks(req, res, url, db) {
  const searchParams = url.searchParams;
  const collectionName = getCollectionName(searchParams);
  const activeMatch = getActiveBenefitsMatch(searchParams);

  const banks = await db.collection(collectionName)
    .aggregate([
      ...(activeMatch ? [{ $match: activeMatch }] : []),
      { $group: { _id: '$bank', count: { $sum: 1 } } },
      { $match: { count: { $gte: 5 } } },
      { $sort: { count: -1 } }
    ])
    .toArray();

  setCacheControl(res, CC_METADATA);
  return json(res, 200, {
    success: true,
    banks: banks.map((bank) => ({
      name: bank._id,
      count: bank.count
    }))
  });
}

async function handleGetNetworks(req, res, url, db) {
  const searchParams = url.searchParams;
  const collectionName = getCollectionName(searchParams);
  const activeMatch = getActiveBenefitsMatch(searchParams);

  const networks = await db.collection(collectionName)
    .aggregate([
      ...(activeMatch ? [{ $match: activeMatch }] : []),
      { $group: { _id: '$network', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
    .toArray();

  setCacheControl(res, CC_METADATA);
  return json(res, 200, {
    success: true,
    networks: networks.map((network) => ({
      name: network._id,
      count: network.count
    }))
  });
}

async function handleGetStats(req, res, url, db) {
  const searchParams = url.searchParams;
  const collectionName = getCollectionName(searchParams);
  const collection = db.collection(collectionName);
  const activeMatch = getActiveBenefitsMatch(searchParams) || {};

  const [
    totalBenefits,
    onlineBenefits,
    physicalBenefits,
    topCategories,
    topBanks
  ] = await Promise.all([
    collection.countDocuments(activeMatch),
    collection.countDocuments({ ...activeMatch, online: true }),
    collection.countDocuments({ ...activeMatch, online: false }),
    collection
      .aggregate([
        ...(Object.keys(activeMatch).length > 0 ? [{ $match: activeMatch }] : []),
        { $unwind: '$categories' },
        { $group: { _id: '$categories', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
      .toArray(),
    collection
      .aggregate([
        ...(Object.keys(activeMatch).length > 0 ? [{ $match: activeMatch }] : []),
        { $group: { _id: '$bank', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
      .toArray()
  ]);

  setCacheControl(res, CC_CONTENT);
  return json(res, 200, {
    success: true,
    stats: {
      totalBenefits,
      onlineBenefits,
      physicalBenefits,
      topCategories: topCategories.map((cat) => ({
        category: cat._id,
        count: cat.count
      })),
      topBanks: topBanks.map((bank) => ({
        bank: bank._id,
        count: bank.count
      }))
    }
  });
}

async function handleGetNearbyBenefits(req, res, url, db) {
  const searchParams = url.searchParams;
  const collectionName = getCollectionName(searchParams);
  const includeExpired = shouldIncludeExpired(searchParams);

  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radiusMeters = toPositiveInt(searchParams.get('radius'), 5000);
  const category = searchParams.get('category');
  const limitNum = Math.min(toPositiveInt(searchParams.get('limit'), 20), 50);

  if (!lat || !lng) {
    return json(res, 400, {
      error: 'Missing required parameters: lat, lng'
    });
  }

  const latitude = Number.parseFloat(lat);
  const longitude = Number.parseFloat(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return json(res, 400, {
      error: 'Invalid coordinates: lat and lng must be numbers'
    });
  }

  const baseMatch = {};
  const activeMatch = getActiveBenefitsMatch(searchParams);
  if (activeMatch) {
    Object.assign(baseMatch, activeMatch);
  }
  if (category && category !== 'all') {
    baseMatch.categories = { $in: [category] };
  }

  const nearbyPipeline = [
    ...(Object.keys(baseMatch).length > 0 ? [{ $match: baseMatch }] : []),
    { $unwind: '$locations' },
    {
      $match: {
        'locations.lat': { $type: 'number' },
        'locations.lng': { $type: 'number' }
      }
    },
    {
      $addFields: {
        _distanceMeters: {
          $multiply: [
            6371000,
            {
              $acos: {
                $add: [
                  {
                    $multiply: [
                      { $sin: { $degreesToRadians: latitude } },
                      { $sin: { $degreesToRadians: '$locations.lat' } }
                    ]
                  },
                  {
                    $multiply: [
                      { $cos: { $degreesToRadians: latitude } },
                      { $cos: { $degreesToRadians: '$locations.lat' } },
                      {
                        $cos: {
                          $degreesToRadians: { $subtract: ['$locations.lng', longitude] }
                        }
                      }
                    ]
                  }
                ]
              }
            }
          ]
        }
      }
    },
    {
      $match: {
        _distanceMeters: { $lte: radiusMeters }
      }
    },
    {
      $sort: {
        _distanceMeters: 1
      }
    },
    {
      $group: {
        _id: '$_id',
        doc: { $first: '$$ROOT' },
        distance: { $min: '$_distanceMeters' }
      }
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$doc',
            { distanceMeters: '$distance' }
          ]
        }
      }
    },
    {
      $project: {
        _distanceMeters: 0
      }
    },
    { $limit: limitNum }
  ];

  const nearbyBenefits = await db.collection(collectionName)
    .aggregate(nearbyPipeline)
    .toArray();

  const filtered = nearbyBenefits.map(serializeDocWithId);

  setCacheControl(res, CC_LOCATION);
  return json(res, 200, {
    success: true,
    benefits: filtered,
    count: filtered.length,
    searchParams: {
      lat: latitude,
      lng: longitude,
      radius: radiusMeters,
      category,
      includeExpired
    }
  });
}

async function handleGetBusinesses(req, res, url, db) {
  const searchParams = url.searchParams;
  const collectionName = getCollectionName(searchParams);
  const includeExpired = shouldIncludeExpired(searchParams);

  const category = searchParams.get('category');
  const bank = searchParams.get('bank');
  const subscription = searchParams.get('subscription');
  const search = searchParams.get('search');
  const onlineOnly = searchParams.get('online') === 'true';
  const limitNum = Math.min(Math.max(toPositiveInt(searchParams.get('limit'), 20), 1), 100);
  const offsetNum = Math.max(toPositiveInt(searchParams.get('offset'), 0), 0);

  // Exact lat/lng (precise sort, bypasses CDN) takes priority over geohash (CDN-cached, approximate)
  const rawLat = searchParams.get('lat');
  const rawLng = searchParams.get('lng');
  const exactLat = rawLat ? Number.parseFloat(rawLat) : null;
  const exactLng = rawLng ? Number.parseFloat(rawLng) : null;
  const hasExact = exactLat !== null && exactLng !== null && Number.isFinite(exactLat) && Number.isFinite(exactLng);

  const geohash = searchParams.get('geohash');
  const decoded = !hasExact && geohash ? decodeGeohash(geohash) : null;

  const userLat = hasExact ? exactLat : (decoded?.latitude ?? null);
  const userLng = hasExact ? exactLng : (decoded?.longitude ?? null);
  const hasLocation = userLat !== null && userLng !== null;

  const bankFilter = bank
    ? bank
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
    : null;

  const merchantQuery = {
    isActive: { $ne: false },
    merchantId: { $exists: true, $type: 'string' },
    ...(includeExpired ? { benefitCount: { $gt: 0 } } : { activeBenefitCount: { $gt: 0 } })
  };

  if (category && category !== 'all') {
    merchantQuery.categories = { $in: [category] };
  }
  if (bankFilter && bankFilter.length > 0) {
    merchantQuery.banks = { $in: bankFilter.map((value) => new RegExp(escapeRegex(value), 'i')) };
  }
  if (subscription) {
    merchantQuery.subscriptionIds = subscription;
  }
  if (onlineOnly) {
    merchantQuery.hasOnlineBenefits = true;
  }
  if (search) {
    const normalizedSearch = normalizeSearchText(search);
    const searchTerms = Array.from(
      new Set([
        search,
        normalizedSearch,
        ...tokenizeSearchText(search),
        ...tokenizeSearchText(normalizedSearch)
      ].filter(Boolean))
    );

    merchantQuery.$or = searchTerms.flatMap((term) => {
      const pattern = new RegExp(escapeRegex(term), 'i');
      return [
        { merchantName: pattern },
        { merchantKey: pattern },
        { aliases: { $elemMatch: { $regex: pattern } } },
        { categories: { $elemMatch: { $regex: pattern } } },
        { banks: { $elemMatch: { $regex: pattern } } },
        { 'searchProfile.searchText': pattern },
        { 'searchProfile.description': pattern }
      ];
    });
  }

  const merchantCollection = db.collection(MERCHANT_ASSETS_COLLECTION);
  const totalPromise = merchantCollection.countDocuments(merchantQuery);
  const merchantProjection = {
    _id: 0,
    merchantId: 1,
    merchantName: 1,
    categories: 1,
    locations: 1,
    hasOnlineBenefits: 1,
    'searchProfile.description': 1,
    imageUrl: 1,
    logoUrl: 1,
    coverUrl: 1
  };
  const benefitSummaryProjection = {
    _id: 1,
    id: 1,
    merchantId: 1,
    bank: 1,
    benefitTitle: 1,
    availableDays: 1,
    discountPercentage: 1,
    caps: 1,
    online: 1,
    otherDiscounts: 1,
    installments: 1,
    description: 1,
    termsAndConditions: 1,
    link: 1,
    validUntil: 1,
    cardTypes: 1,
    subscription: 1
  };

  let pagedMerchants = [];
  if (hasLocation) {
    try {
      const usableGeoMatch = buildUsableGeoMatch();
      const withGeoQuery = combineQueriesWithAnd(merchantQuery, usableGeoMatch);
      const withoutGeoQuery = combineQueriesWithAnd(merchantQuery, buildMissingGeoMatch());
      const withGeo = limitNum > 0
        ? await merchantCollection
          .aggregate([
            {
              $geoNear: {
                near: { type: 'Point', coordinates: [userLng, userLat] },
                distanceField: 'distanceMeters',
                spherical: true,
                key: 'geoPoints',
                query: withGeoQuery
              }
            },
            { $skip: offsetNum },
            { $limit: limitNum },
            {
              $project: {
                ...merchantProjection,
                distanceMeters: 1
              }
            }
          ])
          .toArray()
        : [];

      let withoutGeoOffset = 0;
      if (offsetNum > 0 && withGeo.length < limitNum) {
        const withGeoCount = await merchantCollection.countDocuments(withGeoQuery);
        withoutGeoOffset = Math.max(offsetNum - withGeoCount, 0);
      }

      const withoutGeoLimit = Math.max(limitNum - withGeo.length, 0);
      const withoutGeo = withoutGeoLimit > 0
        ? await merchantCollection
          .find(withoutGeoQuery, { projection: merchantProjection })
          .sort({ merchantName: 1 })
          .skip(withoutGeoOffset)
          .limit(withoutGeoLimit)
          .toArray()
        : [];

      const merchantsWithDistance = withGeo.map((merchant) => ({
        ...merchant,
        distance: Number(merchant.distanceMeters) / 1000,
        distanceText: formatDistanceText(Number(merchant.distanceMeters) / 1000),
        isNearby: Number(merchant.distanceMeters) / 1000 <= 50
      }));
      const merchantsWithoutDistance = withoutGeo.map((merchant) => ({
        ...merchant,
        distance: null,
        distanceText: null,
        isNearby: false
      }));
      pagedMerchants = [...merchantsWithDistance, ...merchantsWithoutDistance];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const missingGeoIndex = message.includes('unable to find index for $geoNear query');
      if (!missingGeoIndex) {
        throw error;
      }

      console.warn('[businesses] Falling back to in-memory distance sort because geoPoints is not indexed');

      const merchants = await merchantCollection
        .find(merchantQuery, { projection: merchantProjection })
        .toArray();

      pagedMerchants = merchants
        .map((merchant) => {
          const validDistances = (Array.isArray(merchant.locations) ? merchant.locations : [])
            .filter((location) => Number.isFinite(Number(location?.lat)) && Number.isFinite(Number(location?.lng)))
            .map((location) => haversineKm(
              userLat,
              userLng,
              Number(location.lat),
              Number(location.lng)
            ));

          if (validDistances.length === 0) {
            return {
              ...merchant,
              distance: null,
              distanceText: null,
              isNearby: false
            };
          }

          const distance = Math.min(...validDistances);
          return {
            ...merchant,
            distance,
            distanceText: formatDistanceText(distance),
            isNearby: distance <= 50
          };
        })
        .sort((left, right) => {
          const leftDistance = Number.isFinite(left.distance) ? left.distance : Number.POSITIVE_INFINITY;
          const rightDistance = Number.isFinite(right.distance) ? right.distance : Number.POSITIVE_INFINITY;
          if (leftDistance !== rightDistance) {
            return leftDistance - rightDistance;
          }
          return String(left.merchantName || '').localeCompare(String(right.merchantName || ''));
        })
        .slice(offsetNum, offsetNum + limitNum);
    }
  } else {
    pagedMerchants = await merchantCollection
      .find(merchantQuery, {
        projection: merchantProjection
      })
      .sort({ merchantName: 1 })
      .skip(offsetNum)
      .limit(limitNum)
      .toArray();
  }

  const merchantIds = pagedMerchants.map((merchant) => merchant.merchantId).filter(Boolean);
  const benefitQuery = {
    merchantId: { $in: merchantIds }
  };

  if (bankFilter && bankFilter.length > 0) {
    benefitQuery.bank = { $in: bankFilter.map((value) => new RegExp(escapeRegex(value), 'i')) };
  }
  if (subscription) {
    benefitQuery.subscription = subscription;
  }
  if (onlineOnly) {
    benefitQuery.online = true;
  }
  applyActiveBenefitsFilter(benefitQuery, searchParams);

  const rawBenefits = merchantIds.length > 0
    ? await db.collection(collectionName)
      .find(benefitQuery, { projection: benefitSummaryProjection })
      .sort({ bank: 1, benefitTitle: 1 })
      .toArray()
    : [];
  const cardNameLookup = await resolveCardNameLookup(db, rawBenefits);
  const benefitsByMerchant = new Map();
  for (const benefit of rawBenefits) {
    const key = benefit.merchantId;
    if (!key) continue;
    if (!benefitsByMerchant.has(key)) {
      benefitsByMerchant.set(key, []);
    }
    benefitsByMerchant.get(key).push(buildBusinessBenefitSummary(benefit, cardNameLookup));
  }

  const businesses = pagedMerchants
    .map((merchant) => ({
      id: merchant.merchantId,
      name: merchant.merchantName,
      category: Array.isArray(merchant.categories) && merchant.categories.length > 0
        ? merchant.categories[0]
        : 'otros',
      description: merchant.searchProfile?.description || '',
      rating: 5,
      locations: dedupeLocations(Array.isArray(merchant.locations) ? merchant.locations : []),
      image: pickBusinessImage(merchant),
      logo: merchant.logoUrl || null,
      coverImage: merchant.coverUrl || null,
      benefits: benefitsByMerchant.get(merchant.merchantId) || [],
      distance: merchant.distance ?? null,
      distanceText: merchant.distanceText ?? null,
      isNearby: Boolean(merchant.isNearby),
      hasOnline: Boolean(merchant.hasOnlineBenefits)
    }))
    .filter((merchant) => merchant.benefits.length > 0);
  const total = await totalPromise;

  setCacheControl(res, hasExact ? CC_LOCATION : CC_CONTENT);
  return json(res, 200, {
    success: true,
    businesses,
    pagination: {
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + businesses.length < total
    },
    filters: {
      ...(category && { category }),
      ...(bank && { bank }),
      ...(search && { search }),
      ...(onlineOnly && { online: 'true' }),
      ...(subscription && { subscription }),
      includeExpired,
      ...(hasLocation && { lat: userLat, lng: userLng })
    }
  });
}

async function handlePlaceDetails(req, res) {
  const body = await readJsonBody(req);
  const placeId = body?.placeId;

  if (!placeId || typeof placeId !== 'string') {
    return json(res, 400, {
      error: 'Missing required field: placeId'
    });
  }

  const result = await fetchGooglePlaceDetails(placeId);
  if (!result) {
    return json(res, 404, {
      error: 'Place not found',
      placeId
    });
  }

  return json(res, 200, {
    success: true,
    result
  });
}

export {
  buildBusinessBenefitSummary,
  getActiveBenefitsMatch,
  handleGetBenefitById,
  handleGetBenefits,
  handleGetBusinesses,
  handleSearch,
  rehydrateBenefitDoc
};

export default async function handler(req, res) {
  const url = getParsedUrl(req);
  const path = resolveRequestPath(url);

  try {
    const db = await getDb();

    if (req.method === 'GET' && path === '/api/benefits') {
      return await handleGetBenefits(req, res, url, db);
    }

    if (req.method === 'GET' && path === '/api/benefits/nearby') {
      return await handleGetNearbyBenefits(req, res, url, db);
    }

    if (req.method === 'GET' && path === '/api/businesses') {
      return await handleGetBusinesses(req, res, url, db);
    }

    if (req.method === 'GET' && path === '/api/search') {
      return await handleSearch(req, res, url, db);
    }

    if (req.method === 'GET' && path === '/api/categories') {
      return await handleGetCategories(req, res, url, db);
    }

    if (req.method === 'GET' && path === '/api/banks') {
      return await handleGetBanks(req, res, url, db);
    }

    if (req.method === 'GET' && path === '/api/networks') {
      return await handleGetNetworks(req, res, url, db);
    }

    if (req.method === 'GET' && path === '/api/stats') {
      return await handleGetStats(req, res, url, db);
    }

    if (req.method === 'POST' && path === '/api/places/details') {
      return await handlePlaceDetails(req, res);
    }

    if (req.method === 'GET') {
      const benefitByIdMatch = path.match(/^\/api\/benefits\/([^/]+)$/);
      if (benefitByIdMatch) {
        return await handleGetBenefitById(req, res, url, db, decodeURIComponent(benefitByIdMatch[1]));
      }
    }

    return json(res, 404, {
      error: 'Endpoint not found',
      path,
      availableEndpoints: [
        'GET /api/benefits',
        'GET /api/benefits/:id',
        'GET /api/benefits/nearby',
        'GET /api/businesses',
        'GET /api/search',
        'GET /api/categories',
        'GET /api/banks',
        'GET /api/networks',
        'GET /api/stats',
        'POST /api/places/details'
      ]
    });
  } catch (error) {
    console.error('[Vercel API] Request failed:', error);
    return json(res, 500, {
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
