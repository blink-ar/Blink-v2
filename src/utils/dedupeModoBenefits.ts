import { BankBenefit } from '../types';
import { parseDayAvailability, DayAvailability, hasAnyDayAvailable } from './dayAvailabilityParser';
import { isModoSourcedBenefit } from './benefitDisplay';

// A benefit is treated as Modo-sourced when any of its source markers reference
// Modo, not just when its serialized `id` starts with `modo-promos-raw-`. Modo
// promos can surface (e.g. through /api/businesses summaries) with ids that no
// longer carry that prefix, so we rely on the shared metadata-aware detection
// used by the rest of the codebase (api/merchant-seo.js, src/utils/benefitDisplay.ts).
const isModoBenefit = (benefit: BankBenefit): boolean => isModoSourcedBenefit(benefit);

const COMBINING_MARKS = /[\u0300-\u036f]/g;

const normalizeText = (value: unknown): string =>
  typeof value === 'string'
    ? value.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase().trim()
    : '';

const DAY_NAME_TO_ABBR: Record<string, string> = {
  lunes: 'L', monday: 'L',
  martes: 'M', tuesday: 'M',
  miercoles: 'X', wednesday: 'X',
  jueves: 'J', thursday: 'J',
  viernes: 'V', friday: 'V',
  sabado: 'S', saturday: 'S',
  domingo: 'D', sunday: 'D',
};

const ALL_DAYS_KEY = 'D|J|L|M|S|V|X';
const UNKNOWN_DAYS_KEY = '__UNKNOWN_DAYS__';
const UNKNOWN_INSTALLMENTS = '__UNKNOWN_INSTALLMENTS__';

const dayKeyFromAvailability = (a: DayAvailability): string => {
  if (a.allDays) return ALL_DAYS_KEY;
  const abbrs: string[] = [];
  if (a.monday) abbrs.push('L');
  if (a.tuesday) abbrs.push('M');
  if (a.wednesday) abbrs.push('X');
  if (a.thursday) abbrs.push('J');
  if (a.friday) abbrs.push('V');
  if (a.saturday) abbrs.push('S');
  if (a.sunday) abbrs.push('D');
  return abbrs.sort().join('|');
};

const getAvailableDaysKey = (benefit: BankBenefit): string => {
  const raw = (benefit as BankBenefit & { availableDays?: unknown }).availableDays;
  if (Array.isArray(raw) && raw.length > 0) {
    const abbrs = new Set<string>();
    raw.forEach((d) => {
      if (typeof d !== 'string') return;
      const abbr = DAY_NAME_TO_ABBR[normalizeText(d)];
      if (abbr) abbrs.add(abbr);
    });
    if (abbrs.size > 0) return [...abbrs].sort().join('|');
  }

  const cuando = (benefit as BankBenefit & { cuando?: unknown }).cuando;
  if (typeof cuando !== 'string' || cuando.trim() === '') return UNKNOWN_DAYS_KEY;
  const parsed = parseDayAvailability(cuando);
  if (!parsed) return UNKNOWN_DAYS_KEY;
  if (hasAnyDayAvailable(parsed)) return dayKeyFromAvailability(parsed);
  return parsed.customText ? `text:${normalizeText(parsed.customText)}` : UNKNOWN_DAYS_KEY;
};

const getInstallments = (benefit: BankBenefit): number | typeof UNKNOWN_INSTALLMENTS => {
  const value = benefit.installments;
  return typeof value === 'number' && Number.isFinite(value) ? value : UNKNOWN_INSTALLMENTS;
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

const parseValidUntil = (value: BankBenefit['validUntil']): number | null => {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const ts = Date.parse(value.trim());
  return Number.isNaN(ts) ? null : ts;
};

// When two benefits merge, keep the longest validity. A valid date always beats a
// missing/invalid one; ties keep the current value.
const pickLongerValidUntil = (
  current: BankBenefit['validUntil'],
  incoming: BankBenefit['validUntil'],
): BankBenefit['validUntil'] => {
  const tc = parseValidUntil(current);
  const ti = parseValidUntil(incoming);
  if (tc === null) return ti === null ? current : incoming;
  if (ti === null) return current;
  return ti > tc ? incoming : current;
};

interface MatchKey {
  days: string;
  installments: number | typeof UNKNOWN_INSTALLMENTS;
  discount: number;
}

const benefitMatchKey = (benefit: BankBenefit): MatchKey => ({
  days: getAvailableDaysKey(benefit),
  installments: getInstallments(benefit),
  discount: getDiscountPercentage(benefit),
});

const keysEqual = (a: MatchKey, b: MatchKey): boolean => {
  if ((a.days === UNKNOWN_DAYS_KEY) !== (b.days === UNKNOWN_DAYS_KEY)) return false;
  if ((a.installments === UNKNOWN_INSTALLMENTS) !== (b.installments === UNKNOWN_INSTALLMENTS)) return false;
  return a.days === b.days && a.installments === b.installments && a.discount === b.discount;
};

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
  const validUntilByIndex = new Map<number, BankBenefit['validUntil']>();

  // Pass 1: collapse bank-specific Modo rows that duplicate a broader Modo row.
  // Modo promos are emitted once per adhered bank, so a Modo row whose eligible
  // bank set is a subset of another Modo row covering the same offer (matchKey)
  // is a duplicate. Process broader rows first so they absorb the narrower ones
  // (e.g. the 18-bank "20% en Nutrican" row absorbs the per-bank BUEPP/CIUDAD rows).
  const survivingModo: Array<{ index: number; benefit: BankBenefit }> = [];
  const modoByBankCountDesc = [...modoEntries].sort(
    (a, b) => getEligibilityBankKeys(b.benefit).length - getEligibilityBankKeys(a.benefit).length,
  );

  modoByBankCountDesc.forEach((entry) => {
    const entryBanks = getEligibilityBankKeys(entry.benefit);
    if (entryBanks.length === 0) {
      survivingModo.push(entry);
      return;
    }

    const entryKey = benefitMatchKey(entry.benefit);
    const absorber = survivingModo.find(({ benefit }) => {
      const banks = getEligibilityBankKeys(benefit);
      if (banks.length === 0 || !keysEqual(entryKey, benefitMatchKey(benefit))) return false;
      const bankSet = new Set(banks);
      return entryBanks.every((bank) => bankSet.has(bank));
    });

    if (absorber) {
      dropIndices.add(entry.index);
      const base = validUntilByIndex.has(absorber.index)
        ? validUntilByIndex.get(absorber.index)
        : absorber.benefit.validUntil;
      validUntilByIndex.set(absorber.index, pickLongerValidUntil(base, entry.benefit.validUntil));
    } else {
      survivingModo.push(entry);
    }
  });

  // Pass 2: dedupe the surviving Modo rows against standalone bank benefits.
  survivingModo.forEach(({ index: modoIdx, benefit: modo }) => {
    const modoBanks = getEligibilityBankKeys(modo);
    if (modoBanks.length === 0) return;

    const modoKey = benefitMatchKey(modo);
    const modoValidUntil = validUntilByIndex.has(modoIdx)
      ? validUntilByIndex.get(modoIdx)
      : modo.validUntil;

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
        const base = validUntilByIndex.has(match.index)
          ? validUntilByIndex.get(match.index)
          : match.benefit.validUntil;
        validUntilByIndex.set(match.index, pickLongerValidUntil(base, modoValidUntil));
      }
      return;
    }

    let mergedValidUntil = modoValidUntil;
    let didMerge = false;
    modoBanks.forEach((modoBank) => {
      const match = bankEntries.find(({ index, benefit }) => {
        if (dropIndices.has(index)) return false;
        const banks = getEligibilityBankKeys(benefit);
        return banks.includes(modoBank) && keysEqual(modoKey, benefitMatchKey(benefit));
      });
      if (match) {
        dropIndices.add(match.index);
        mergedValidUntil = pickLongerValidUntil(mergedValidUntil, match.benefit.validUntil);
        didMerge = true;
      }
    });
    if (didMerge) validUntilByIndex.set(modoIdx, mergedValidUntil);
  });

  if (dropIndices.size === 0 && acceptsModoIndices.size === 0) return benefits;

  return benefits.reduce<BankBenefit[]>((acc, benefit, index) => {
    if (dropIndices.has(index)) return acc;
    let result = acceptsModoIndices.has(index) ? { ...benefit, acceptsModo: true } : benefit;
    if (validUntilByIndex.has(index)) {
      const chosen = validUntilByIndex.get(index);
      if (chosen !== result.validUntil) result = { ...result, validUntil: chosen ?? null };
    }
    acc.push(result);
    return acc;
  }, []);
}
