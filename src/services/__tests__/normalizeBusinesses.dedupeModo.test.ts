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

  it('collapses Nutrican-style bank-specific rows under the active multi-bank Modo promo', () => {
    const makeEligibility = (bank: string) => ({
      bank,
      bankDisplayName: bank,
      cardTypes: ['credit'],
      cardResolutionStatus: 'resolved',
      subscriptionResolutionStatus: 'not_required',
    });
    const raw = makeRawBusiness([
      makeRawBenefit({
        id: 'modo-promos-raw-6a0b61c6eaebf0b793d9dd15',
        eligibilities: [makeEligibility('buepp'), makeEligibility('ciudad')],
        bankName: 'Buepp, Ciudad',
        discountPercentage: 20,
        rewardRate: '20%',
        installments: null,
        cuando: 'Viernes',
        validUntil: '2026-07-31',
      }),
      makeRawBenefit({
        id: 'buepp-69f8def3cbb2cbde285d6458',
        eligibilities: [makeEligibility('buepp')],
        bankName: 'Buepp',
        discountPercentage: 20,
        rewardRate: '20%',
        installments: 0,
        cuando: 'Viernes',
        validUntil: null,
      }),
      makeRawBenefit({
        id: 'ciudad-69f8dec4cbb2cbde285d61d9',
        eligibilities: [makeEligibility('ciudad')],
        bankName: 'Ciudad',
        discountPercentage: 20,
        rewardRate: '20%',
        installments: 0,
        cuando: 'Viernes',
        validUntil: null,
      }),
    ]);

    const [business] = normalizeBusinesses([raw]);

    expect(business.benefits).toHaveLength(1);
    expect(business.benefits[0].id).toBe('modo-promos-raw-6a0b61c6eaebf0b793d9dd15');
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

  it('dedups a Modo/bank pair even when the Modo side has no validUntil and the bank side is active', () => {
    const raw = makeRawBusiness([
      makeRawBenefit({
        id: 'modo-promos-raw-open-ended',
        validUntil: null,
      }),
      makeRawBenefit({
        id: 'bbva-active',
        validUntil: '2026-06-30',
      }),
    ]);

    const [business] = normalizeBusinesses([raw], { includeExpired: true });

    expect(business.benefits).toHaveLength(1);
    expect(business.benefits[0].id).toBe('bbva-active');
    expect(business.benefits[0].acceptsModo).toBe(true);
    expect(business.benefits[0].validUntil).toBe('2026-06-30');
  });
});
