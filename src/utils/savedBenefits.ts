import { Business, BankBenefit } from '../types';
import { getStableBenefitId, isLegacyBenefitIndexRef } from './benefitIdentity';

/** localStorage key holding saved benefit ids as `${businessId}:${benefitRouteRef}`. */
export const SAVED_BENEFITS_STORAGE_KEY = 'blink.savedBenefits';

export interface SavedBenefitRef {
  key: string;
  businessId: string;
  benefitRef: string;
}

export const readSavedBenefitKeys = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_BENEFITS_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
};

/** Returns false when storage is blocked or full, so callers don't confirm a change that wasn't saved. */
export const writeSavedBenefitKeys = (keys: string[]): boolean => {
  try {
    window.localStorage.setItem(SAVED_BENEFITS_STORAGE_KEY, JSON.stringify(keys));
    return true;
  } catch {
    return false;
  }
};

export const parseSavedBenefitKey = (key: string): SavedBenefitRef | null => {
  const separator = key.indexOf(':');
  if (separator <= 0 || separator === key.length - 1) return null;
  return {
    key,
    businessId: key.slice(0, separator),
    benefitRef: key.slice(separator + 1),
  };
};

/** Resolves a saved ref against fresh merchant data (stable id first, legacy index fallback). */
export const resolveSavedBenefit = (
  business: Business,
  benefitRef: string,
): { benefit: BankBenefit; position: number } | null => {
  const byId = business.benefits.findIndex((candidate) => getStableBenefitId(candidate) === benefitRef);
  if (byId >= 0) return { benefit: business.benefits[byId], position: byId };

  if (isLegacyBenefitIndexRef(benefitRef)) {
    const index = Number.parseInt(benefitRef, 10);
    if (business.benefits[index]) return { benefit: business.benefits[index], position: index };
  }

  return null;
};
