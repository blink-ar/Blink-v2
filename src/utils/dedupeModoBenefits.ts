import { BankBenefit } from '../types';

const isModoBenefit = (benefit: BankBenefit): boolean =>
  /^modo-promos-raw-/i.test(benefit.id || '');

const COMBINING_MARKS = /[\u0300-\u036f]/g;

const normalizeText = (value: unknown): string =>
  typeof value === 'string'
    ? value.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase().trim()
    : '';

const getAvailableDaysKey = (benefit: BankBenefit): string => {
  const raw = (benefit as BankBenefit & { availableDays?: unknown }).availableDays;
  if (!Array.isArray(raw)) return '';
  return [...new Set(raw.map(normalizeText).filter(Boolean))].sort().join('|');
};

const getInstallments = (benefit: BankBenefit): number => {
  const value = benefit.installments;
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
};

const getDiscountPercentage = (benefit: BankBenefit): number => {
  const value = (benefit as BankBenefit & { discountPercentage?: unknown }).discountPercentage;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const match = String(benefit.rewardRate ?? '').match(/(\d+(?:\.\d+)?)%/);
  return match ? Number(match[1]) : 0;
};

const getEligibilityBankKeys = (benefit: BankBenefit): string[] => {
  if (!Array.isArray(benefit.eligibilities)) return [];
  return benefit.eligibilities
    .map((eligibility) => normalizeText(eligibility?.bank))
    .filter(Boolean);
};

interface MatchKey {
  days: string;
  installments: number;
  discount: number;
}

const benefitMatchKey = (benefit: BankBenefit): MatchKey => ({
  days: getAvailableDaysKey(benefit),
  installments: getInstallments(benefit),
  discount: getDiscountPercentage(benefit),
});

const keysEqual = (a: MatchKey, b: MatchKey): boolean =>
  a.days === b.days && a.installments === b.installments && a.discount === b.discount;

export function dedupeModoBenefits(benefits: BankBenefit[]): BankBenefit[] {
  if (!Array.isArray(benefits) || benefits.length === 0) return benefits;

  const modoEntries: Array<{ index: number; benefit: BankBenefit }> = [];
  const bankEntries: Array<{ index: number; benefit: BankBenefit }> = [];

  benefits.forEach((benefit, index) => {
    if (isModoBenefit(benefit)) {
      modoEntries.push({ index, benefit });
    } else {
      bankEntries.push({ index, benefit });
    }
  });

  if (modoEntries.length === 0) return benefits;

  const dropIndices = new Set<number>();
  const acceptsModoIndices = new Set<number>();

  modoEntries.forEach(({ index: modoIdx, benefit: modo }) => {
    const modoBanks = getEligibilityBankKeys(modo);
    if (modoBanks.length === 0) return;

    const modoKey = benefitMatchKey(modo);

    if (modoBanks.length === 1) {
      const modoBank = modoBanks[0];
      const match = bankEntries.find(({ index, benefit }) => {
        if (dropIndices.has(index)) return false;
        const banks = getEligibilityBankKeys(benefit);
        return banks.includes(modoBank) && keysEqual(modoKey, benefitMatchKey(benefit));
      });
      if (match) {
        dropIndices.add(modoIdx);
        acceptsModoIndices.add(match.index);
      }
      return;
    }

    modoBanks.forEach((modoBank) => {
      const match = bankEntries.find(({ index, benefit }) => {
        if (dropIndices.has(index)) return false;
        const banks = getEligibilityBankKeys(benefit);
        return banks.includes(modoBank) && keysEqual(modoKey, benefitMatchKey(benefit));
      });
      if (match) {
        dropIndices.add(match.index);
      }
    });
  });

  if (dropIndices.size === 0 && acceptsModoIndices.size === 0) return benefits;

  return benefits.reduce<BankBenefit[]>((acc, benefit, index) => {
    if (dropIndices.has(index)) return acc;
    acc.push(acceptsModoIndices.has(index) ? { ...benefit, acceptsModo: true } : benefit);
    return acc;
  }, []);
}
