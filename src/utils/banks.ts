export interface BankDescriptor {
  token: string;
  key: string;
  code: string;
  label: string;
  name?: string;
  aliases?: string[];
  count?: number;
  indexed?: boolean;
  image?: string | null;
  promotionUrl?: string | null;
}

const FALLBACK_PROVIDER_METADATA: Record<string, { aliases: string[]; shortName: string; name: string }> = {
  mercadopago: {
    aliases: ['mercado', 'mercado pago', 'mp'],
    shortName: 'MP',
    name: 'Mercado Pago',
  },
  personal: {
    aliases: ['personalpay', 'personal pay'],
    shortName: 'PP',
    name: 'Personal Pay',
  },
  naranjax: {
    aliases: ['naranja', 'naranja x', 'nx'],
    shortName: 'NX',
    name: 'NaranjaX',
  },
  nacion: {
    aliases: ['bna', 'banco nacion', 'banco nación'],
    shortName: 'BNA',
    name: 'Banco Nación',
  },
  bbva: {
    aliases: ['frances', 'francés', 'banco frances', 'banco francés'],
    shortName: 'BBVA',
    name: 'BBVA',
  },
  santander: {
    aliases: ['rio', 'río', 'santander rio', 'santander río'],
    shortName: 'SAN',
    name: 'Santander',
  },
  lagaceta: {
    aliases: ['la gaceta', 'club la gaceta'],
    shortName: 'LAGA',
    name: 'La Gaceta',
  },
};

const asBankText = (value: unknown): string => {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;
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
      objectValue.id,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' || typeof candidate === 'number') {
        return String(candidate);
      }
    }
  }
  return '';
};

const normalizeBankText = (value: unknown): string =>
  asBankText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeBankKey = (value: unknown): string =>
  normalizeBankText(value).replace(/\s+/g, '');

const normalizeLookupVariants = (value: unknown): string[] => {
  const normalized = normalizeBankText(value);
  if (!normalized) return [];

  const withoutBanco = normalized.replace(/^banco\s+/, '').trim();
  return Array.from(new Set([
    normalized,
    normalized.replace(/\s+/g, ''),
    withoutBanco,
    withoutBanco.replace(/\s+/g, ''),
  ].filter(Boolean)));
};

const FALLBACK_ALIAS_TO_KEY = Object.entries(FALLBACK_PROVIDER_METADATA).reduce<Record<string, string>>(
  (map, [key, metadata]) => {
    [key, metadata.name, metadata.shortName, ...metadata.aliases].forEach((value) => {
      normalizeLookupVariants(value).forEach((variant) => {
        map[variant] = key;
      });
    });
    return map;
  },
  {},
);

const resolveFallbackKey = (value: unknown): string => {
  for (const variant of normalizeLookupVariants(value)) {
    if (FALLBACK_ALIAS_TO_KEY[variant]) return FALLBACK_ALIAS_TO_KEY[variant];
  }

  const normalized = normalizeBankText(value).replace(/^banco\s+/, '').trim();
  return normalized.replace(/\s+/g, '') || 'bank';
};

const buildFallbackCode = (key: string, label: string): string => {
  const staticCode = FALLBACK_PROVIDER_METADATA[key]?.shortName;
  if (staticCode) return staticCode;

  const words = normalizeBankText(label)
    .replace(/^banco\s+/, '')
    .split(' ')
    .filter(Boolean);
  const source = words.length > 1 ? words.map((word) => word[0]).join('') : (words[0] || key);
  return source.slice(0, 4).toUpperCase() || 'BANK';
};

const getString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

export const toBankDescriptor = (bankValue: unknown): BankDescriptor => {
  const objectValue = bankValue && typeof bankValue === 'object'
    ? bankValue as Record<string, unknown>
    : null;
  const rawKey = objectValue
    ? objectValue.key ?? objectValue.canonicalKey ?? objectValue.canonical ?? objectValue.slug ?? objectValue.token
    : null;
  const key = rawKey ? normalizeBankKey(rawKey) : resolveFallbackKey(bankValue);
  const fallback = FALLBACK_PROVIDER_METADATA[key];
  const name = getString(objectValue?.name) || getString(objectValue?.label) || fallback?.name;
  const label = name || normalizeBankText(bankValue).toUpperCase() || key.toUpperCase();
  const code = getString(objectValue?.shortName) || getString(objectValue?.code) || buildFallbackCode(key, label);
  const aliases = Array.isArray(objectValue?.aliases)
    ? objectValue.aliases.filter((alias): alias is string => typeof alias === 'string' && alias.trim().length > 0)
    : fallback?.aliases || [];
  const count = typeof objectValue?.count === 'number' ? objectValue.count : undefined;
  const indexed = typeof objectValue?.indexed === 'boolean' ? objectValue.indexed : undefined;

  return {
    token: key,
    key,
    code,
    label: label.toUpperCase(),
    name: name || label,
    aliases,
    count,
    indexed,
    image: getString(objectValue?.image) || null,
    promotionUrl: getString(objectValue?.promotionUrl) || null,
  };
};

export const compareBankDescriptors = (a: BankDescriptor, b: BankDescriptor) => {
  if (a.indexed !== b.indexed) {
    if (a.indexed === true) return -1;
    if (b.indexed === true) return 1;
  }

  const countA = typeof a.count === 'number' ? a.count : -1;
  const countB = typeof b.count === 'number' ? b.count : -1;
  if (countA !== countB) return countB - countA;

  return a.label.localeCompare(b.label, 'es');
};

export const buildBankOptions = (...groups: readonly unknown[][]): BankDescriptor[] => {
  const optionMap = new Map<string, BankDescriptor>();

  groups.forEach((group) => {
    group.forEach((bankName) => {
      const descriptor = toBankDescriptor(bankName);
      if (descriptor.label === 'BANK' || descriptor.token === 'bank') return;

      const existing = optionMap.get(descriptor.token);
      if (!existing) {
        optionMap.set(descriptor.token, descriptor);
        return;
      }

      optionMap.set(descriptor.token, {
        ...existing,
        ...descriptor,
        aliases: Array.from(new Set([...(existing.aliases || []), ...(descriptor.aliases || [])])),
        count: descriptor.count ?? existing.count,
        indexed: descriptor.indexed ?? existing.indexed,
      });
    });
  });

  return Array.from(optionMap.values()).sort(compareBankDescriptors);
};
