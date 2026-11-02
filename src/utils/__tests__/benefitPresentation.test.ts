import { describe, expect, it } from 'vitest';
import { getBenefitPercentage, getBenefitDiscountPercentage } from '../../../shared/benefit-presentation.js';

describe('canonical discount presentation contract', () => {
  it.each([null, 0, -1, 101, NaN, Infinity, '30', undefined])('does not infer a percentage when canonical field explicitly contains %s', (discountPercentage) => {
    expect(getBenefitPercentage({ discountPercentage, rewardRate: '100%', benefit: 'Cuotas' })).toBeNull();
  });
  it('uses the numeric field over stale text', () => {
    expect(getBenefitPercentage({ discountPercentage: 25, rewardRate: '100%' })).toBe(25);
  });
  it('supports legacy payloads without the field during staged rollout', () => {
    expect(getBenefitPercentage({ rewardRate: '20%' })).toBe(20);
    expect(getBenefitPercentage({ rewardRate: '12,5%' })).toBe(12.5);
  });
  it('never turns raffle chances into savings even with polluted numeric source', () => {
    expect(getBenefitPercentage({ discountPercentage: 100, rewardRate: '100%', benefit: 'Sorteo Mega Martes' })).toBeNull();
  });
  it('does not call reimbursement OFF', () => {
    const benefit = { discountPercentage: 30, rewardRate: '30%', benefit: 'Reintegro' };
    expect(getBenefitPercentage(benefit)).toBe(30);
    expect(getBenefitDiscountPercentage(benefit)).toBeNull();
  });
  it('does not infer discounts from installment counts or title text', () => {
    expect(getBenefitPercentage({ installments: 12, rewardRate: '12 cuotas', benefit: '100% financiado' })).toBeNull();
  });
});
