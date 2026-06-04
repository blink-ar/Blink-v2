import { describe, expect, it } from 'vitest';

import { applyLocalDistanceGuardrail } from '../../../api/[...path].js';

interface GuardrailHit {
  merchantId: string;
  reasons: string[];
  business: { distance: number };
}

function hit(merchantId: string, distance: number, reasons: string[] = []): GuardrailHit {
  return { merchantId, reasons, business: { distance } };
}

const userFilters = { lat: -34.6, lng: -58.4 };

describe('applyLocalDistanceGuardrail', () => {
  it('returns hits unchanged when the user has no coordinates', () => {
    const hits = [hit('a', 5), hit('b', 300)];
    expect(applyLocalDistanceGuardrail(hits, { lat: null, lng: null })).toBe(hits);
  });

  it('does not prune distant results when there are fewer than 3 nearby results', () => {
    const hits = [hit('near', 10), hit('far', 227)];
    const result = applyLocalDistanceGuardrail(hits, userFilters);
    expect(result.map((h) => h.merchantId)).toEqual(['near', 'far']);
  });

  it('prunes weak distant matches once the nearby threshold is reached', () => {
    const hits = [
      hit('near1', 5),
      hit('near2', 12),
      hit('near3', 20),
      hit('far_noise', 227, ['product_tag_overlap'])
    ];
    const result = applyLocalDistanceGuardrail(hits, userFilters);
    expect(result.map((h) => h.merchantId)).toEqual(['near1', 'near2', 'near3']);
  });

  it('keeps a distant merchant when it is an explicit name match (the Adidas case)', () => {
    const hits = [
      hit('near1', 5, ['product_tag_overlap']),
      hit('near2', 12, ['intent_overlap']),
      hit('near3', 20, ['category_match']),
      hit('adidas_far', 227, ['merchant_exact'])
    ];
    const result = applyLocalDistanceGuardrail(hits, userFilters);
    expect(result.map((h) => h.merchantId)).toContain('adidas_far');
  });

  it('keeps distant curated (manual) alias matches, but still prunes distant non-name noise', () => {
    const hits = [
      hit('near1', 5),
      hit('near2', 12),
      hit('near3', 20),
      hit('alias_far', 200, ['manual_alias_exact']),
      hit('noise_far', 250, ['intent_overlap'])
    ];
    const result = applyLocalDistanceGuardrail(hits, userFilters);
    const ids = result.map((h) => h.merchantId);
    expect(ids).toContain('alias_far');
    expect(ids).not.toContain('noise_far');
  });

  it('prunes distant prefix and generated-alias matches once the nearby threshold is reached', () => {
    const hits = [
      hit('near1', 5),
      hit('near2', 12),
      hit('near3', 20),
      hit('prefix_far', 200, ['merchant_prefix']),
      hit('generated_alias_far', 227, ['alias_exact'])
    ];
    const result = applyLocalDistanceGuardrail(hits, userFilters);
    const ids = result.map((h) => h.merchantId);
    expect(ids).not.toContain('prefix_far');
    expect(ids).not.toContain('generated_alias_far');
  });
});
