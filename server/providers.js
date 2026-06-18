import { PROVIDER_STATIC_METADATA } from './provider-metadata.js';

export const PROVIDERS_COLLECTION = 'providers';

const PROVIDER_CATALOG_TTL_MS = 30 * 60 * 1000;
const PROVIDER_PROJECTION = {
  _id: 0,
  key: 1,
  name: 1,
  aliases: 1,
  shortName: 1,
  image: 1,
  promotion_url: 1,
  promotionUrl: 1,
  providerType: 1,
  type: 1,
  bcra_code: 1,
  bcraCode: 1,
  modo_bank_id: 1,
  modo_on_hub_list: 1
};

function uniqueStrings(values) {
  return Array.from(new Set(
    values
      .map((value) => String(value || '').trim())
      .filter(Boolean)
  ));
}

function providerTextFromValue(value) {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (!value || typeof value !== 'object') return '';

  const objectValue = value;
  const candidates = [
    objectValue.key,
    objectValue.canonical,
    objectValue.canonicalKey,
    objectValue.slug,
    objectValue.token,
    objectValue.bank,
    objectValue.bankDisplayName,
    objectValue.name,
    objectValue.label,
    objectValue.shortName,
    objectValue.code,
    objectValue.value,
    objectValue.id
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' || typeof candidate === 'number') {
      return String(candidate);
    }
  }

  return '';
}

export function normalizeProviderText(value) {
  return providerTextFromValue(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeProviderKey(value) {
  return normalizeProviderText(value).replace(/\s+/g, '');
}

export function getProviderLookupVariants(value) {
  const normalized = normalizeProviderText(value);
  if (!normalized) return [];

  const withoutBanco = normalized.replace(/^banco\s+/, '').trim();
  return uniqueStrings([
    normalized,
    normalized.replace(/\s+/g, ''),
    withoutBanco,
    withoutBanco.replace(/\s+/g, '')
  ]);
}

function fallbackShortName(key, name) {
  const cleanedName = String(name || key || '').trim();
  const compact = normalizeProviderKey(cleanedName);
  if (!cleanedName && !compact) return 'BANK';

  if (/^[A-Z0-9]{2,5}$/.test(cleanedName.replace(/\s+/g, ''))) {
    return cleanedName.replace(/\s+/g, '').slice(0, 5).toUpperCase();
  }

  const words = normalizeProviderText(cleanedName)
    .replace(/^banco\s+/, '')
    .split(' ')
    .filter(Boolean);
  const source = words.length > 1 ? words.map((word) => word[0]).join('') : (words[0] || compact);
  return source.slice(0, 4).toUpperCase() || 'BANK';
}

function descriptorFromProviderDoc(doc) {
  const key = normalizeProviderKey(doc?.key);
  if (!key) return null;

  const staticMetadata = PROVIDER_STATIC_METADATA[key] || {};
  const name = String(doc?.name || staticMetadata.name || key).trim();
  const aliases = uniqueStrings([
    ...(Array.isArray(staticMetadata.aliases) ? staticMetadata.aliases : []),
    ...(Array.isArray(doc?.aliases) ? doc.aliases : [])
  ]);
  const shortName = String(doc?.shortName || staticMetadata.shortName || fallbackShortName(key, name)).trim();

  return {
    key,
    name,
    shortName,
    aliases,
    image: typeof doc?.image === 'string' && doc.image.trim() ? doc.image.trim() : null,
    promotionUrl: typeof doc?.promotionUrl === 'string' && doc.promotionUrl.trim()
      ? doc.promotionUrl.trim()
      : typeof doc?.promotion_url === 'string' && doc.promotion_url.trim()
        ? doc.promotion_url.trim()
        : null,
    providerType: doc?.providerType || doc?.type || null,
    bcraCode: doc?.bcraCode || doc?.bcra_code || null,
    modoBankId: doc?.modo_bank_id || null,
    modoOnHubList: doc?.modo_on_hub_list ?? null
  };
}

export function buildProviderCatalog(providerDocs = []) {
  const byKey = new Map();

  for (const doc of Array.isArray(providerDocs) ? providerDocs : []) {
    const descriptor = descriptorFromProviderDoc(doc);
    if (!descriptor) continue;

    const existing = byKey.get(descriptor.key);
    if (!existing) {
      byKey.set(descriptor.key, descriptor);
      continue;
    }

    byKey.set(descriptor.key, {
      ...existing,
      ...descriptor,
      aliases: uniqueStrings([...(existing.aliases || []), ...(descriptor.aliases || [])])
    });
  }

  const providers = Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const lookup = new Map();

  const addLookup = (value, key) => {
    for (const variant of getProviderLookupVariants(value)) {
      if (!lookup.has(variant)) lookup.set(variant, key);
    }
  };

  for (const provider of providers) {
    addLookup(provider.key, provider.key);
    addLookup(provider.name, provider.key);
    addLookup(provider.shortName, provider.key);
    for (const alias of provider.aliases || []) {
      addLookup(alias, provider.key);
    }
  }

  return {
    providers,
    byKey,
    lookup,
    hasKey(key) {
      return byKey.has(normalizeProviderKey(key));
    },
    resolveKey(value) {
      const variants = getProviderLookupVariants(value);
      for (const variant of variants) {
        const match = lookup.get(variant);
        if (match) return match;
      }
      return null;
    },
    resolveProvider(value) {
      const key = this.resolveKey(value);
      return key ? byKey.get(key) || null : null;
    }
  };
}

export function splitProviderParam(value) {
  if (Array.isArray(value)) return value.flatMap(splitProviderParam);
  if (value == null) return [];
  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getProviderFilterTextValues(provider, rawValue) {
  const sourceValues = uniqueStrings([
    provider?.key,
    provider?.name,
    provider?.shortName,
    ...(Array.isArray(provider?.aliases) ? provider.aliases : []),
    rawValue
  ]);

  return uniqueStrings(
    sourceValues.flatMap((sourceValue) => [
      sourceValue,
      ...getProviderLookupVariants(sourceValue)
    ])
  );
}

export function resolveProviderCanonicalValues(catalog, value) {
  const providerCatalog = catalog || buildProviderCatalog([]);
  const values = new Set();

  for (const rawValue of splitProviderParam(value)) {
    const resolvedKey = providerCatalog.resolveKey(rawValue);
    if (resolvedKey && providerCatalog.hasKey(resolvedKey)) {
      values.add(resolvedKey);
    }
  }

  return Array.from(values).filter(Boolean);
}

export function resolveProviderFilterValues(catalog, value) {
  const providerCatalog = catalog || buildProviderCatalog([]);
  const values = new Set();

  for (const rawValue of splitProviderParam(value)) {
    const resolvedKey = providerCatalog.resolveKey(rawValue);
    if (resolvedKey && providerCatalog.hasKey(resolvedKey)) {
      const provider = providerCatalog.byKey.get(resolvedKey);
      for (const variant of getProviderFilterTextValues(provider, rawValue)) {
        values.add(variant);
      }
    }
  }

  return Array.from(values).filter(Boolean);
}

export function serializeProviderDescriptor(provider, overrides = {}) {
  const count = Number(overrides.count || 0);
  const indexed = Boolean(overrides.indexed);
  const shortName = provider?.shortName || fallbackShortName(provider?.key, provider?.name);

  return {
    key: provider?.key || normalizeProviderKey(provider?.name),
    name: provider?.name || provider?.key || 'Proveedor',
    shortName,
    aliases: Array.isArray(provider?.aliases) ? provider.aliases : [],
    image: provider?.image || null,
    promotionUrl: provider?.promotionUrl || null,
    providerType: provider?.providerType || null,
    bcraCode: provider?.bcraCode || null,
    count,
    indexed
  };
}

export async function loadProviderCatalog(db, options = {}) {
  const { ttlMs = PROVIDER_CATALOG_TTL_MS, fallbackOnError = false } = options;
  if (!db) return buildProviderCatalog([]);

  const globalState = globalThis;
  if (!globalState.__blinkProviderCatalog) {
    globalState.__blinkProviderCatalog = {
      promise: null,
      loadedAt: 0
    };
  }

  const cache = globalState.__blinkProviderCatalog;
  const shouldRefresh = !cache.promise || (Date.now() - cache.loadedAt) > ttlMs;

  if (shouldRefresh) {
    cache.loadedAt = Date.now();
    try {
      cache.promise = db.collection(PROVIDERS_COLLECTION)
        .find({}, { projection: PROVIDER_PROJECTION })
        .toArray()
        .then((docs) => buildProviderCatalog(docs))
        .catch((error) => {
          cache.promise = null;
          cache.loadedAt = 0;
          if (fallbackOnError) {
            return buildProviderCatalog([]);
          }
          throw error;
        });
    } catch (error) {
      cache.promise = null;
      cache.loadedAt = 0;
      if (fallbackOnError) {
        return buildProviderCatalog([]);
      }
      throw error;
    }
  }

  return cache.promise;
}
