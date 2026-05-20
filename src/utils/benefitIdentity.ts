import { BankBenefit } from '../types';

const LEGACY_INDEX_PATTERN = /^\d+$/;

export const decodeBenefitRouteRef = (value: string | undefined): string | undefined => {
  if (value === undefined) return undefined;

  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
};

export const getStableBenefitId = (benefit: BankBenefit | null | undefined): string | null => {
  const id = benefit?.id == null ? '' : String(benefit.id).trim();
  return id || null;
};

export const isLegacyBenefitIndexRef = (value: string | undefined): boolean => {
  const ref = decodeBenefitRouteRef(value);
  return Boolean(ref && LEGACY_INDEX_PATTERN.test(ref));
};

export const getBenefitRouteRef = (benefit: BankBenefit, fallbackIndex: number): string => {
  return getStableBenefitId(benefit) || String(Math.max(0, fallbackIndex));
};

export const buildBenefitPath = (
  businessId: string,
  benefit: BankBenefit,
  fallbackIndex: number,
): string => {
  return `/benefit/${encodeURIComponent(businessId)}/${encodeURIComponent(getBenefitRouteRef(benefit, fallbackIndex))}`;
};
