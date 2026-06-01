import { describe, expect, it } from 'vitest';
import {
  buildLandingSeoRoutesFromMerchants,
  getLandingBankValuesFromMerchant,
  resolveLandingBankFromMerchants,
} from '../../../api/landing-seo-data.js';

describe('landing SEO data helpers', () => {
  it('uses canonical search profile bank names instead of tokenized bank fields', () => {
    const merchant = {
      banks: ['provincia', 'buenos', 'aires'],
      searchProfile: {
        benefits: [{ bankName: 'Banco Provincia' }]
      }
    };

    expect(getLandingBankValuesFromMerchant(merchant)).toEqual(['Banco Provincia']);
  });

  it('does not resolve arbitrary bank tokens from merchant bank search fields', () => {
    const merchant = {
      banks: ['a', 'provincia'],
      searchProfile: {
        benefits: [{ bankName: 'Banco Galicia' }]
      }
    };

    expect(resolveLandingBankFromMerchants('galicia', [merchant])?.slug).toBe('galicia');
    expect(resolveLandingBankFromMerchants('a', [merchant])).toBeNull();
  });

  it('can seed client aliases when validating bank names from merchant data', () => {
    const merchant = {
      searchProfile: {
        benefits: [{ bankName: 'Banco Santander Río' }]
      }
    };

    expect(resolveLandingBankFromMerchants('santander', [merchant], { includeClientDefinitions: true })?.slug).toBe('santander');
    expect(resolveLandingBankFromMerchants('rio', [merchant], { includeClientDefinitions: true })?.slug).toBe('santander');
  });

  it('filters generated sitemap landing routes to client-supported slugs', () => {
    const merchants = [
      {
        categories: ['shopping'],
        locations: [{ addressComponents: { locality: 'CABA' } }],
        searchProfile: {
          benefits: [{ bankName: 'Banco Galicia' }]
        }
      },
      {
        categories: ['combustible'],
        locations: [{ addressComponents: { locality: 'San Miguel de Tucuman' } }],
        searchProfile: {
          benefits: [{ bankName: 'NaranjaX' }]
        }
      }
    ];

    const routes = buildLandingSeoRoutesFromMerchants(merchants, {
      minMerchantCount: 1,
      allowedBankSlugs: ['galicia'],
      allowedCategorySlugs: ['shopping'],
      allowedCitySlugs: ['caba'],
    });

    expect(routes.map((route) => route.path)).toEqual(expect.arrayContaining([
      '/descuentos/galicia/shopping',
      '/descuentos/galicia/shopping/caba',
    ]));
    expect(routes).toHaveLength(2);
  });
});
