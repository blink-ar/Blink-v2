import { BankBenefit } from '../types';

const DEFAULT_PROVIDER_LABEL = 'Proveedor';
const MULTI_BANK_PROVIDER_LABEL = 'Varios bancos';
const MODO_PROVIDER_LABEL = 'MODO';

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const asText = (value: unknown): string =>
  typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';

const uniqueDisplayNames = (values: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const key = normalizeText(trimmed);
    if (seen.has(key)) return;

    seen.add(key);
    result.push(trimmed);
  });

  return result;
};

const splitBankNameList = (bankName: string): string[] =>
  bankName
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

const isModoSourcedBenefit = (benefit: BankBenefit): boolean => {
  const benefitRecord = benefit as BankBenefit & Record<string, unknown>;
  const sourceText = [
    benefit.id,
    benefitRecord.sourceCollection,
    benefitRecord.rawBenefitCollection,
    benefitRecord.source,
  ]
    .map(asText)
    .join(' ');

  return normalizeText(sourceText).includes('modo');
};

export const getBenefitEligibilityBankNames = (benefit: BankBenefit): string[] => {
  const eligibilityNames = Array.isArray(benefit.eligibilities)
    ? benefit.eligibilities
      .map((eligibility) => eligibility.bankDisplayName || eligibility.bank)
      .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
    : [];

  if (eligibilityNames.length > 0) {
    return uniqueDisplayNames(eligibilityNames);
  }

  const bankName = asText(benefit.bankName);
  if (!bankName) return [];

  return uniqueDisplayNames(bankName.includes(',') ? splitBankNameList(bankName) : [bankName]);
};

export const hasMultipleBenefitProviders = (benefit: BankBenefit): boolean =>
  getBenefitEligibilityBankNames(benefit).length > 1;

export const getBenefitProviderDisplayName = (benefit: BankBenefit): string => {
  const bankNames = getBenefitEligibilityBankNames(benefit);

  if (bankNames.length <= 1) {
    return asText(benefit.bankName) || bankNames[0] || DEFAULT_PROVIDER_LABEL;
  }

  if (isModoSourcedBenefit(benefit)) {
    return MODO_PROVIDER_LABEL;
  }

  return MULTI_BANK_PROVIDER_LABEL;
};

export const getBenefitProviderSummary = (benefit: BankBenefit): string | null => {
  const bankCount = getBenefitEligibilityBankNames(benefit).length;

  return bankCount > 1
    ? `${bankCount} bancos adheridos`
    : null;
};

export const getBenefitEligibleBankPreview = (
  benefit: BankBenefit,
  limit = 8,
): { visible: string[]; hiddenCount: number; total: number } => {
  const names = getBenefitEligibilityBankNames(benefit);
  const safeLimit = Math.max(0, limit);

  return {
    visible: names.slice(0, safeLimit),
    hiddenCount: Math.max(0, names.length - safeLimit),
    total: names.length,
  };
};
