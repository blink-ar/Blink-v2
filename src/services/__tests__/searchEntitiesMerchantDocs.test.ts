import { describe, expect, it } from 'vitest';
import { buildSearchDatasetFromMerchantDocs } from '../../../api/search/entities.js';

describe('buildSearchDatasetFromMerchantDocs', () => {
  it('builds merchant, product, and intent documents from merchant-first summaries', () => {
    const dataset = buildSearchDatasetFromMerchantDocs([
      {
        merchantId: 'merchant_1',
        merchantName: 'Freddo',
        merchantKey: 'freddo',
        categories: ['gastronomia'],
        banks: ['bbva'],
        locations: [{ formattedAddress: 'Store 1', lat: -34.6, lng: -58.38 }],
        maxDiscountPercentage: 25,
        hasOnlineBenefits: true,
        activeBenefitCount: 2,
        searchProfile: {
          aliases: ['freddo'],
          description: 'Helados y postres',
          productTags: ['helado', 'postre'],
          intentTags: ['dessert_icecream'],
          searchText: 'freddo helado postre',
          popularity: 2,
          maxDiscount: 25,
          benefits: [
            {
              id: 'benefit-1',
              bankName: 'BBVA',
              cardName: 'Visa Gold',
              cardTypes: ['Visa Gold'],
              benefit: '25% OFF',
              rewardRate: '25%',
              tipo: 'descuento',
              cuando: 'Lunes',
              valor: '25%',
              tope: 5000,
              condicion: '',
              requisitos: ['Visa Gold'],
              usos: ['presencial'],
              textoAplicacion: null,
              description: 'Promo helados',
              installments: null,
              validUntil: '2099-12-31',
              caps: [],
              otherDiscounts: null,
              subscription: null
            }
          ]
        },
        imageUrl: 'https://cdn.example.com/freddo.jpg'
      }
    ]);

    expect(dataset.merchantDocuments).toHaveLength(1);
    expect(dataset.merchantDocuments[0].merchantId).toBe('merchant_1');
    expect(dataset.merchantDocuments[0].business.image).toBe('https://cdn.example.com/freddo.jpg');
    expect(dataset.merchantDocuments[0].business.benefits).toHaveLength(1);
    expect(dataset.productDocuments.some((doc) => doc.productTerm === 'helado')).toBe(true);
    expect(dataset.intentDocuments.some((doc) => doc.intentKey === 'dessert_icecream')).toBe(true);
  });
});
