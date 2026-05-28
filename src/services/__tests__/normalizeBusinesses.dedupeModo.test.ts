import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeBusinesses } from '../api';

describe('normalizeBusinesses Modo dedup activity bucketing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-22T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const makeRawBenefit = (overrides: Record<string, unknown>) => ({
    eligibilities: [
      {
        bank: 'bbva',
        bankDisplayName: 'BBVA',
        cardTypes: ['credit'],
        cardResolutionStatus: 'resolved',
        subscriptionResolutionStatus: 'not_required',
      },
    ],
    bankName: 'BBVA',
    cardName: 'Visa',
    benefit: 'Promo',
    rewardRate: '20%',
    color: 'bg-blue-500',
    icon: 'CreditCard',
    discountPercentage: 20,
    installments: 3,
    ...overrides,
  });

  const makeRawBusiness = (benefits: Record<string, unknown>[]) => ({
    id: 'merchant_test',
    name: 'Test Merchant',
    category: 'jugueterias',
    description: '',
    rating: 5,
    locations: [],
    image: '',
    benefits,
  });

  it('does not drop an active Modo benefit when only expired bank benefits share its match key', () => {
    const raw = makeRawBusiness([
      makeRawBenefit({
        id: 'modo-promos-raw-active',
        validUntil: '2026-05-28',
      }),
      makeRawBenefit({
        id: 'bbva-expired-1',
        validUntil: '2026-03-26',
      }),
      makeRawBenefit({
        id: 'bbva-expired-2',
        validUntil: '2026-04-30',
      }),
    ]);

    const [business] = normalizeBusinesses([raw], { includeExpired: true });

    const activeBenefits = business.benefits.filter((b) => {
      const v = b.validUntil ?? '';
      return !v || v >= '2026-05-22';
    });

    expect(activeBenefits).toHaveLength(1);
    expect(activeBenefits[0].id).toBe('modo-promos-raw-active');
    expect(activeBenefits[0].acceptsModo).toBeUndefined();
  });

  it('still dedups Modo against an active bank benefit', () => {
    const raw = makeRawBusiness([
      makeRawBenefit({
        id: 'modo-promos-raw-active',
        validUntil: '2026-05-28',
      }),
      makeRawBenefit({
        id: 'bbva-active',
        validUntil: '2026-06-30',
      }),
    ]);

    const [business] = normalizeBusinesses([raw], { includeExpired: true });

    const modoSurvived = business.benefits.find((b) => b.id === 'modo-promos-raw-active');
    const bankSurvived = business.benefits.find((b) => b.id === 'bbva-active');

    expect(modoSurvived).toBeUndefined();
    expect(bankSurvived?.acceptsModo).toBe(true);
  });

  it('omits expired benefits entirely when includeExpired is false', () => {
    const raw = makeRawBusiness([
      makeRawBenefit({
        id: 'modo-promos-raw-active',
        validUntil: '2026-05-28',
      }),
      makeRawBenefit({
        id: 'bbva-expired',
        validUntil: '2026-03-26',
      }),
    ]);

    const [business] = normalizeBusinesses([raw]);

    expect(business.benefits).toHaveLength(1);
    expect(business.benefits[0].id).toBe('modo-promos-raw-active');
    expect(business.benefits[0].acceptsModo).toBeUndefined();
  });
});
