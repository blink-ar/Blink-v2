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

  it('does not merge "lunes a viernes" (range) with "lunes y viernes" (two days)', () => {
    const bank = makeBenefit({
      banks: ['bbva'],
      discountPercentage: 20,
      installments: 3,
      cuando: 'lunes a viernes',
    });
    const modo = makeModo(['bbva'], {
      discountPercentage: 20,
      installments: 3,
      cuando: 'lunes y viernes',
    });
    const result = dedupeModoBenefits([bank, modo]);
    expect(result).toHaveLength(2);
    expect(result.find((b) => b.id === bank.id)?.acceptsModo).toBeUndefined();
  });

  it('expands "lunes a viernes" the same way on both sides so weekday ranges merge', () => {
    const bank = makeBenefit({
      banks: ['bbva'],
      discountPercentage: 20,
      installments: 3,
      cuando: 'lunes a viernes',
    });
    const modo = makeModo(['bbva'], {
      discountPercentage: 20,
      installments: 3,
      cuando: 'lunes a viernes',
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

  it('single-eligibility Modo: keeps the longest validUntil after merging', () => {
    const bank = makeBenefit({
      banks: ['galicia'],
      availableDays: ['lunes'],
      discountPercentage: 15,
      installments: 3,
      validUntil: '2026-07-15',
    });
    const modo = makeModo(['galicia'], {
      availableDays: ['lunes'],
      discountPercentage: 15,
      installments: 3,
      validUntil: '2026-06-30',
    });
    const result = dedupeModoBenefits([bank, modo]);
    expect(result).toHaveLength(1);
    expect(result[0].acceptsModo).toBe(true);
    expect(result[0].validUntil).toBe('2026-07-15');
  });

  it('single-eligibility Modo: adopts Modo validUntil when it is the longest', () => {
    const bank = makeBenefit({
      banks: ['galicia'],
      availableDays: ['lunes'],
      discountPercentage: 15,
      installments: 3,
      validUntil: '2026-06-30',
    });
    const modo = makeModo(['galicia'], {
      availableDays: ['lunes'],
      discountPercentage: 15,
      installments: 3,
      validUntil: '2026-07-15',
    });
    const result = dedupeModoBenefits([bank, modo]);
    expect(result).toHaveLength(1);
    expect(result[0].acceptsModo).toBe(true);
    expect(result[0].validUntil).toBe('2026-07-15');
  });

  it('single-eligibility Modo: prefers the valid date when one side is null', () => {
    const bank = makeBenefit({
      banks: ['galicia'],
      availableDays: ['lunes'],
      discountPercentage: 15,
      installments: 3,
      validUntil: null,
    });
    const modo = makeModo(['galicia'], {
      availableDays: ['lunes'],
      discountPercentage: 15,
      installments: 3,
      validUntil: '2026-07-15',
    });
    const result = dedupeModoBenefits([bank, modo]);
    expect(result).toHaveLength(1);
    expect(result[0].acceptsModo).toBe(true);
    expect(result[0].validUntil).toBe('2026-07-15');
  });

  it('multi-eligibility Modo: surviving Modo keeps the longest validUntil', () => {
    const bankA = makeBenefit({
      banks: ['galicia'],
      availableDays: ['lunes'],
      discountPercentage: 20,
      validUntil: '2026-09-01',
    });
    const bankB = makeBenefit({
      banks: ['santander'],
      availableDays: ['lunes'],
      discountPercentage: 20,
      validUntil: '2026-07-01',
    });
    const modo = makeModo(['galicia', 'santander'], {
      availableDays: ['lunes'],
      discountPercentage: 20,
      validUntil: '2026-08-01',
    });
    const result = dedupeModoBenefits([bankA, bankB, modo]);
    expect(result).toHaveLength(1);
    expect(/^modo-/.test(result[0].id || '')).toBe(true);
    expect(result[0].validUntil).toBe('2026-09-01');
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

  it('recognizes Modo benefits by source metadata even when the id lacks the modo prefix', () => {
    const bank = makeBenefit({
      banks: ['galicia'],
      availableDays: ['lunes'],
      discountPercentage: 15,
      installments: 3,
    });
    const modo = makeBenefit({
      id: 'confirmed-benefit-abc123',
      banks: ['galicia'],
      availableDays: ['lunes'],
      discountPercentage: 15,
      installments: 3,
      ...({ sourceCollection: 'MODO_PROMOS_RAW' } as Partial<BankBenefit>),
    });
    const result = dedupeModoBenefits([bank, modo]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(bank.id);
    expect(result[0].acceptsModo).toBe(true);
  });

  it('collapses bank-specific Modo rows into a broader Modo row covering the same offer', () => {
    // Reproduces the Nutrican case (issue #126): a 18-bank "20% en Nutrican" Modo
    // row plus separate per-bank BUEPP and CIUDAD Modo rows whose ids do not start
    // with `modo-promos-raw-`. All three describe the same offer and should collapse
    // into the single broad Modo row.
    const aggregate = makeModo(['buepp', 'ciudad', 'bbva', 'galicia'], {
      benefit: '20% en Nutrican',
      availableDays: ['lunes'],
      discountPercentage: 20,
      validUntil: '2026-07-31',
    });
    const bueppRow = makeBenefit({
      id: 'confirmed-benefit-buepp',
      banks: ['buepp'],
      benefit: '20% en Nutrican',
      availableDays: ['lunes'],
      discountPercentage: 20,
      validUntil: '2026-07-31',
      ...({ rawBenefitCollection: 'MODO_PROMOS_RAW' } as Partial<BankBenefit>),
    });
    const ciudadRow = makeBenefit({
      id: 'confirmed-benefit-ciudad',
      banks: ['ciudad'],
      benefit: '20% en Nutrican',
      availableDays: ['lunes'],
      discountPercentage: 20,
      validUntil: '2026-07-31',
      ...({ source: 'modo' } as Partial<BankBenefit>),
    });

    const result = dedupeModoBenefits([bueppRow, ciudadRow, aggregate]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(aggregate.id);
    expect(result.some((b) => b.id === 'confirmed-benefit-buepp')).toBe(false);
    expect(result.some((b) => b.id === 'confirmed-benefit-ciudad')).toBe(false);
  });

  it('per-bank Modo collapse keeps the longest validUntil of the merged rows', () => {
    const aggregate = makeModo(['buepp', 'ciudad'], {
      availableDays: ['lunes'],
      discountPercentage: 20,
      validUntil: '2026-07-31',
    });
    const bueppRow = makeBenefit({
      id: 'confirmed-benefit-buepp',
      banks: ['buepp'],
      availableDays: ['lunes'],
      discountPercentage: 20,
      validUntil: '2026-09-30',
      ...({ source: 'MODO_PROMOS_RAW' } as Partial<BankBenefit>),
    });

    const result = dedupeModoBenefits([aggregate, bueppRow]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(aggregate.id);
    expect(result[0].validUntil).toBe('2026-09-30');
  });

  it('does not collapse Modo rows for different offers even when source metadata matches', () => {
    const twentyOff = makeModo(['buepp', 'ciudad'], {
      availableDays: ['lunes'],
      discountPercentage: 20,
    });
    const tenOff = makeBenefit({
      id: 'confirmed-benefit-buepp',
      banks: ['buepp'],
      availableDays: ['lunes'],
      discountPercentage: 10,
      ...({ source: 'modo' } as Partial<BankBenefit>),
    });

    const result = dedupeModoBenefits([twentyOff, tenOff]);
    expect(result).toHaveLength(2);
  });
});
