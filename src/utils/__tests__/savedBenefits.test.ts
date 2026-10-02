import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SAVED_BENEFITS_STORAGE_KEY,
  parseSavedBenefitKey,
  readSavedBenefitKeys,
  resolveSavedBenefit,
  writeSavedBenefitKeys,
} from '../savedBenefits';
import { BankBenefit, Business } from '../../types';

const makeBenefit = (id?: string): BankBenefit => ({
  id,
  bankName: 'Galicia',
  cardName: 'Visa',
  benefit: '20% OFF',
  rewardRate: '20%',
  color: '',
  icon: '',
});

const business = {
  id: 'merchant_1',
  name: 'Coto',
  category: 'supermercados',
  description: '',
  rating: 0,
  location: [],
  image: '',
  benefits: [makeBenefit('b-1'), makeBenefit()],
} as Business;

describe('saved benefit helpers', () => {
  // The global setup stubs localStorage with no-op mocks; back them with a real store here.
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.mocked(window.localStorage.getItem).mockImplementation((key) => store.get(key) ?? null);
    vi.mocked(window.localStorage.setItem).mockImplementation((key, value) => { store.set(key, String(value)); });
  });

  it('parses business id and benefit ref from a saved key', () => {
    expect(parseSavedBenefitKey('merchant_1:b-1')).toEqual({
      key: 'merchant_1:b-1',
      businessId: 'merchant_1',
      benefitRef: 'b-1',
    });
    expect(parseSavedBenefitKey('no-separator')).toBeNull();
    expect(parseSavedBenefitKey(':b-1')).toBeNull();
    expect(parseSavedBenefitKey('merchant_1:')).toBeNull();
  });

  it('resolves by stable id first and falls back to legacy index refs', () => {
    expect(resolveSavedBenefit(business, 'b-1')?.position).toBe(0);
    expect(resolveSavedBenefit(business, '1')?.position).toBe(1);
    expect(resolveSavedBenefit(business, 'missing')).toBeNull();
    expect(resolveSavedBenefit(business, '9')).toBeNull();
  });

  it('round-trips keys through localStorage and ignores malformed data', () => {
    writeSavedBenefitKeys(['merchant_1:b-1']);
    expect(readSavedBenefitKeys()).toEqual(['merchant_1:b-1']);

    window.localStorage.setItem(SAVED_BENEFITS_STORAGE_KEY, '{not json');
    expect(readSavedBenefitKeys()).toEqual([]);

    window.localStorage.setItem(SAVED_BENEFITS_STORAGE_KEY, JSON.stringify(['ok', 3]));
    expect(readSavedBenefitKeys()).toEqual(['ok']);
  });
});
