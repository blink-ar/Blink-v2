import { describe, expect, it } from 'vitest';
import { dedupeModoBenefits } from '../dedupeModoBenefits';
import { BankBenefit } from '../../types';

type ExtraFields = {
  availableDays?: string[];
  discountPercentage?: number;
};

const makeBenefit = (
  fields: Partial<BankBenefit> & ExtraFields & { banks: string[] },
): BankBenefit => {
  const { banks, availableDays, discountPercentage, ...rest } = fields;
  return {
    bankName: banks.join(', '),
    cardName: 'Visa',
    benefit: '10% OFF',
    rewardRate: discountPercentage != null ? `${discountPercentage}%` : '10%',
    color: 'bg-blue-500',
    icon: 'CreditCard',
    eligibilities: banks.map((bank) => ({
      bank,
      bankDisplayName: bank,
      cardTypes: ['credit'],
      cardResolutionStatus: 'resolved',
      subscriptionResolutionStatus: 'not_required',
    })),
    ...rest,
    ...({ availableDays, discountPercentage } as unknown as Partial<BankBenefit>),
  };
};

const makeModo = (
  banks: string[],
  fields: Partial<BankBenefit> & ExtraFields = {},
): BankBenefit =>
  makeBenefit({
    id: `modo-promos-raw-${banks.join('-')}-${fields.discountPercentage ?? 10}`,
    banks,
    ...fields,
  });

describe('dedupeModoBenefits', () => {
  it('returns input unchanged when there are no Modo benefits', () => {
    const benefits = [
      makeBenefit({ banks: ['galicia'], availableDays: ['lunes'], discountPercentage: 10 }),
      makeBenefit({ banks: ['santander'], availableDays: ['martes'], discountPercentage: 20 }),
    ];
    expect(dedupeModoBenefits(benefits)).toBe(benefits);
  });

  it('keeps both when no match is found', () => {
    const bank = makeBenefit({ banks: ['galicia'], availableDays: ['lunes'], discountPercentage: 10 });
    const modo = makeModo(['galicia'], { availableDays: ['martes'], discountPercentage: 10 });
    const result = dedupeModoBenefits([bank, modo]);
    expect(result).toHaveLength(2);
    expect(result[0].acceptsModo).toBeUndefined();
  });

  it('single-eligibility Modo: drops Modo and flags bank benefit with acceptsModo', () => {
    const bank = makeBenefit({
      banks: ['galicia'],
      availableDays: ['lunes', 'martes'],
      discountPercentage: 15,
      installments: 3,
    });
    const modo = makeModo(['galicia'], {
      availableDays: ['martes', 'lunes'],
      discountPercentage: 15,
      installments: 3,
    });
    const result = dedupeModoBenefits([bank, modo]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBeUndefined();
    expect(result[0].acceptsModo).toBe(true);
  });

  it('single-eligibility Modo: does not match when discount differs', () => {
    const bank = makeBenefit({
      banks: ['galicia'],
      availableDays: ['lunes'],
      discountPercentage: 15,
    });
    const modo = makeModo(['galicia'], {
      availableDays: ['lunes'],
      discountPercentage: 20,
    });
    const result = dedupeModoBenefits([bank, modo]);
    expect(result).toHaveLength(2);
  });

  it('single-eligibility Modo: does not match when installments differ', () => {
    const bank = makeBenefit({
      banks: ['galicia'],
      availableDays: ['lunes'],
      discountPercentage: 0,
      installments: 3,
    });
    const modo = makeModo(['galicia'], {
      availableDays: ['lunes'],
      discountPercentage: 0,
      installments: 6,
    });
    const result = dedupeModoBenefits([bank, modo]);
    expect(result).toHaveLength(2);
  });

  it('single-eligibility Modo: does not match when bank differs', () => {
    const bank = makeBenefit({
      banks: ['galicia'],
      availableDays: ['lunes'],
      discountPercentage: 10,
    });
    const modo = makeModo(['santander'], {
      availableDays: ['lunes'],
      discountPercentage: 10,
    });
    const result = dedupeModoBenefits([bank, modo]);
    expect(result).toHaveLength(2);
  });

  it('multi-eligibility Modo: drops matching bank benefits, keeps Modo', () => {
    const bankA = makeBenefit({
      banks: ['galicia'],
      availableDays: ['lunes'],
      discountPercentage: 20,
    });
    const bankB = makeBenefit({
      banks: ['santander'],
      availableDays: ['lunes'],
      discountPercentage: 20,
    });
    const bankC = makeBenefit({
      banks: ['macro'],
      availableDays: ['lunes'],
      discountPercentage: 20,
    });
    const modo = makeModo(['galicia', 'santander'], {
      availableDays: ['lunes'],
      discountPercentage: 20,
    });
    const result = dedupeModoBenefits([bankA, bankB, bankC, modo]);
    expect(result).toHaveLength(2);
    expect(result.some((b) => /^modo-/.test(b.id || ''))).toBe(true);
    expect(result.some((b) => b.eligibilities?.[0]?.bank === 'macro')).toBe(true);
    expect(result.find((b) => b.acceptsModo)).toBeUndefined();
  });

  it('treats availableDays as a set (order and duplicates do not matter)', () => {
    const bank = makeBenefit({
      banks: ['galicia'],
      availableDays: ['martes', 'lunes', 'lunes'],
      discountPercentage: 10,
    });
    const modo = makeModo(['galicia'], {
      availableDays: ['lunes', 'martes'],
      discountPercentage: 10,
    });
    const result = dedupeModoBenefits([bank, modo]);
    expect(result).toHaveLength(1);
    expect(result[0].acceptsModo).toBe(true);
  });

  it('does not merge benefits with differing cuando day strings when availableDays is missing', () => {
    const bank = makeBenefit({
      banks: ['bbva'],
      discountPercentage: 20,
      installments: 3,
      cuando: 'Jueves',
    });
    const modo = makeModo(['bbva'], {
      discountPercentage: 20,
      installments: 3,
      cuando: 'Viernes',
    });
    const result = dedupeModoBenefits([bank, modo]);
    expect(result).toHaveLength(2);
    expect(result.find((b) => b.id === bank.id)?.acceptsModo).toBeUndefined();
  });

  it('falls back to cuando when availableDays is absent and merges matching days', () => {
    const bank = makeBenefit({
      banks: ['bbva'],
      discountPercentage: 20,
      installments: 3,
      cuando: 'Jueves',
    });
    const modo = makeModo(['bbva'], {
      discountPercentage: 20,
      installments: 3,
      cuando: 'Jueves',
    });
    const result = dedupeModoBenefits([bank, modo]);
    expect(result).toHaveLength(1);
    expect(result[0].acceptsModo).toBe(true);
  });

  it('treats cuando with multiple days as a set (order independent)', () => {
    const bank = makeBenefit({
      banks: ['bbva'],
      discountPercentage: 20,
      installments: 3,
      cuando: 'Viernes, Jueves',
    });
    const modo = makeModo(['bbva'], {
      discountPercentage: 20,
      installments: 3,
      cuando: 'Jueves, Viernes',
    });
    const result = dedupeModoBenefits([bank, modo]);
    expect(result).toHaveLength(1);
    expect(result[0].acceptsModo).toBe(true);
  });

  it('normalizes accents and case on bank and day names', () => {
    const bank = makeBenefit({
      banks: ['Galicia'],
      availableDays: ['Miércoles'],
      discountPercentage: 10,
    });
    const modo = makeModo(['galicia'], {
      availableDays: ['miercoles'],
      discountPercentage: 10,
    });
    const result = dedupeModoBenefits([bank, modo]);
    expect(result).toHaveLength(1);
    expect(result[0].acceptsModo).toBe(true);
  });
});
