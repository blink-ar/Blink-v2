import { describe, expect, it } from 'vitest';
import { filterActiveBenefits, isBenefitActive } from '../benefits';
import { BankBenefit } from '../../types';

const makeBenefit = (validUntil?: string | null): BankBenefit => ({
  bankName: 'Banco Test',
  cardName: 'Visa',
  benefit: '10% OFF',
  rewardRate: '10%',
  color: 'bg-blue-500',
  icon: 'CreditCard',
  validUntil,
});

describe('benefit activity helpers', () => {
  const now = new Date('2026-05-12T15:00:00.000Z');

  it('keeps date-only benefits active through the local expiration date', () => {
    expect(isBenefitActive(makeBenefit('2026-05-12'), now)).toBe(true);
  });

  it('marks benefits before the local date as expired', () => {
    expect(isBenefitActive(makeBenefit('2026-05-11'), now)).toBe(false);
  });

  it('treats missing validUntil as active', () => {
    expect(isBenefitActive(makeBenefit(null), now)).toBe(true);
    expect(isBenefitActive(makeBenefit(undefined), now)).toBe(true);
  });

  it('filters only expired benefits out of a mixed list', () => {
    const active = makeBenefit('2026-05-12');
    const openEnded = makeBenefit(null);
    const expired = makeBenefit('2026-03-25');

    expect(filterActiveBenefits([active, openEnded, expired], now)).toEqual([active, openEnded]);
  });
});
