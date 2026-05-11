import { describe, expect, it } from 'vitest';
import { getMerchantSeoPath, parseMerchantSeoParam, slugifyMerchantName } from '../merchantUrls';

describe('merchant URL helpers', () => {
  it('normalizes accents and punctuation into lowercase slugs', () => {
    expect(slugifyMerchantName('Óptica Visión / Cía.')).toBe('optica-vision-cia');
  });

  it('falls back to comercio when the merchant name is empty', () => {
    expect(getMerchantSeoPath({ id: 'merchant_1', name: '' })).toBe('/comercios/comercio--merchant_1');
  });

  it('extracts the full merchant id after the SEO delimiter', () => {
    expect(parseMerchantSeoParam('mimo-co--merchant_69a6f527b7ff0ecb9e33bdfd')).toEqual({
      slug: 'mimo-co',
      merchantId: 'merchant_69a6f527b7ff0ecb9e33bdfd',
    });
  });
});
