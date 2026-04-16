export interface BankDescriptor {
  token: string;
  code: string;
  label: string;
}

export const KNOWN_BANKS: BankDescriptor[] = [
  { token: 'galicia', code: 'GAL', label: 'GALICIA' },
  { token: 'santander', code: 'SAN', label: 'SANTANDER' },
  { token: 'bbva', code: 'BBVA', label: 'BBVA' },
  { token: 'macro', code: 'MAC', label: 'MACRO' },
  { token: 'modo', code: 'MODO', label: 'MODO' },
  { token: 'icbc', code: 'ICBC', label: 'ICBC' },
  { token: 'hsbc', code: 'HSBC', label: 'HSBC' },
  { token: 'amex', code: 'AMEX', label: 'AMEX' },
  { token: 'naranja', code: 'NX', label: 'NARANJA X' },
  { token: 'nacion', code: 'BNA', label: 'NACION' },
  { token: 'ciudad', code: 'CIU', label: 'CIUDAD' },
  { token: 'patagonia', code: 'PAT', label: 'PATAGONIA' },
  { token: 'visa', code: 'VISA', label: 'VISA' },
  { token: 'mastercard', code: 'MC', label: 'MASTERCARD' },
  { token: 'lagaceta', code: 'LAGA', label: 'LA GACETA' },
];

const asBankText = (value: unknown): string => {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;
    const candidates = [
      objectValue.bank,
      objectValue.name,
      objectValue.label,
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

const normalizeBankText = (value: unknown) =>
  asBankText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const sanitizeBankName = (value: unknown) =>
  normalizeBankText(value)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getKnownDescriptor = (normalized: string): BankDescriptor | null => {
  if (normalized.includes('galic')) return KNOWN_BANKS[0];
  if (normalized.includes('santand')) return KNOWN_BANKS[1];
  if (normalized.includes('bbva')) return KNOWN_BANKS[2];
  if (normalized.includes('macro')) return KNOWN_BANKS[3];
  if (normalized.includes('modo')) return KNOWN_BANKS[4];
  if (normalized.includes('icbc')) return KNOWN_BANKS[5];
  if (normalized.includes('hsbc')) return KNOWN_BANKS[6];
  if (normalized.includes('amex') || normalized.includes('american express')) return KNOWN_BANKS[7];
  if (normalized.includes('naranja x') || normalized.includes('naranjax') || normalized === 'nx') return KNOWN_BANKS[8];
  if (normalized.includes('nacion')) return KNOWN_BANKS[9];
  if (normalized.includes('ciudad')) return KNOWN_BANKS[10];
  if (normalized.includes('patagonia')) return KNOWN_BANKS[11];
  if (normalized.includes('visa')) return KNOWN_BANKS[12];
  if (normalized.includes('master')) return KNOWN_BANKS[13];
  return null;
};

export const toBankDescriptor = (bankValue: unknown): BankDescriptor => {
  const sanitized = sanitizeBankName(bankValue).replace(/^banco\s+/, '').trim();
  if (!sanitized) {
    return {
      token: 'bank',
      code: 'BANK',
      label: 'BANCO',
    };
  }

  const known = getKnownDescriptor(sanitized);
  if (known) return known;

  const words = sanitized.split(' ').filter(Boolean);
  const token = words[0];
  const codeSource = words.length > 1 ? words.map((word) => word[0]).join('') : words[0];
  const code = codeSource.slice(0, 4).toUpperCase();

  return {
    token,
    code,
    label: sanitized.toUpperCase().slice(0, 18),
  };
};

export const compareBankDescriptors = (a: BankDescriptor, b: BankDescriptor) => {
  const knownOrder = new Map(KNOWN_BANKS.map((bank, index) => [bank.token, index]));
  const orderA = knownOrder.get(a.token);
  const orderB = knownOrder.get(b.token);

  if (orderA !== undefined && orderB !== undefined) return orderA - orderB;
  if (orderA !== undefined) return -1;
  if (orderB !== undefined) return 1;
  return a.label.localeCompare(b.label, 'es');
};

export const buildBankOptions = (...groups: readonly unknown[][]): BankDescriptor[] => {
  const optionMap = new Map<string, BankDescriptor>();

  groups.forEach((group) => {
    group.forEach((bankName) => {
      const descriptor = toBankDescriptor(bankName);
      if (descriptor.label === 'BANCO') return;
      if (!optionMap.has(descriptor.token)) {
        optionMap.set(descriptor.token, descriptor);
      }
    });
  });

  return Array.from(optionMap.values()).sort(compareBankDescriptors);
};
