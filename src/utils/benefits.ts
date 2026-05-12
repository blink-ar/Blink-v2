import { BankBenefit, Business } from '../types';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const formatLocalDateOnly = (date: Date): string => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');

export const isBenefitActive = (benefit: Pick<BankBenefit, 'validUntil'>, now = new Date()): boolean => {
  const validUntil = benefit.validUntil?.trim();
  if (!validUntil) return true;

  if (DATE_ONLY_PATTERN.test(validUntil)) {
    return validUntil >= formatLocalDateOnly(now);
  }

  const parsedTime = Date.parse(validUntil);
  return Number.isFinite(parsedTime) && parsedTime >= now.getTime();
};

export const filterActiveBenefits = <T extends Pick<BankBenefit, 'validUntil'>>(
  benefits: T[],
  now = new Date(),
): T[] => benefits.filter((benefit) => isBenefitActive(benefit, now));

export const businessWithActiveBenefits = <T extends Business>(business: T, now = new Date()): T => ({
  ...business,
  benefits: filterActiveBenefits(business.benefits || [], now),
});

export const hasActiveBenefits = (business: Business, now = new Date()): boolean =>
  filterActiveBenefits(business.benefits || [], now).length > 0;
