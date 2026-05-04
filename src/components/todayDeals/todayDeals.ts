import { Business, BankBenefit } from '../../types';
import { hasAnyDayAvailable, parseDayAvailability } from '../../utils/dayAvailabilityParser';

type DayKey =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

export interface TodayDeal {
  id: string;
  business: Business;
  benefit: BankBenefit;
  benefitIndex: number;
  discount: number;
  isAvailableToday: boolean;
}

const dayKeys: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export const getBenefitId = (deal: TodayDeal) => `${deal.business.id}:${deal.benefitIndex}`;

export const getBenefitPath = (deal: TodayDeal) => `/benefit/${deal.business.id}/${deal.benefitIndex}`;

export const extractDiscountPercent = (rewardRate: string): number | null => {
  const match = rewardRate.match(/(\d+)\s*%/);
  if (!match) return null;

  const discount = Number.parseInt(match[1], 10);
  return Number.isFinite(discount) && discount > 0 ? discount : null;
};

const getTodayKey = (date: Date): DayKey => dayKeys[date.getDay()];

const isBenefitAvailableToday = (benefit: BankBenefit, date: Date): boolean => {
  const availability = parseDayAvailability(benefit.cuando);
  if (!availability) return true;

  const hasSpecificDays = hasAnyDayAvailable(availability);
  if (!hasSpecificDays) return true;

  const todayKey = getTodayKey(date);
  return availability.allDays || availability[todayKey];
};

export const getTodayDeals = (
  businesses: Business[],
  options: { limit?: number; now?: Date } = {},
): TodayDeal[] => {
  const { limit = 12, now = new Date() } = options;
  const deals: TodayDeal[] = [];

  businesses.forEach((business) => {
    business.benefits.forEach((benefit, benefitIndex) => {
      const discount = extractDiscountPercent(benefit.rewardRate);
      if (discount === null) return;

      deals.push({
        id: `${business.id}:${benefitIndex}`,
        business,
        benefit,
        benefitIndex,
        discount,
        isAvailableToday: isBenefitAvailableToday(benefit, now),
      });
    });
  });

  const sortedDeals = deals.sort((a, b) => {
    if (a.isAvailableToday !== b.isAvailableToday) {
      return a.isAvailableToday ? -1 : 1;
    }

    if (a.discount !== b.discount) {
      return b.discount - a.discount;
    }

    return a.business.name.localeCompare(b.business.name, 'es');
  });

  const selected: TodayDeal[] = [];
  const seenMerchants = new Set<string>();

  for (const deal of sortedDeals) {
    const merchantKey = (deal.business.id || deal.business.name).trim().toLowerCase();
    if (seenMerchants.has(merchantKey)) continue;

    selected.push(deal);
    seenMerchants.add(merchantKey);

    if (selected.length >= limit) break;
  }

  return selected;
};
