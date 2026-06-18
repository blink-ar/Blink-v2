import { describe, expect, it } from 'vitest';
import { buildProviderCatalog } from '../../../server/providers.js';
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

  it('indexes accentless, connector-free, and singular merchant name variants', () => {
    const dataset = buildSearchDatasetFromMerchantDocs([
      {
        merchantId: 'merchant_69a5e9d4b7ff0ecb9e339ea6',
        merchantName: 'Almacén de Pizzas',
        merchantKey: 'almacen-de-pizzas',
        categories: ['gastronomia'],
        banks: [],
        locations: [],
        activeBenefitCount: 3,
        benefitCount: 3,
        searchProfile: {
          aliases: [],
          description: '',
          productTags: [],
          intentTags: [],
          benefits: []
        }
      }
    ]);

    expect(dataset.merchantDocuments[0].aliases).toEqual(
      expect.arrayContaining([
        'almacen de pizzas',
        'almacen pizzas',
        'almacen pizza'
      ])
    );
    expect(dataset.merchantDocuments[0].searchText).toContain('almacen pizza');
  });

  it('uses provider canonical keys for merchant bank filters when a catalog is provided', () => {
    const providerCatalog = buildProviderCatalog([
      { key: 'mercadopago', name: 'Mercado Pago', aliases: ['mercado'] },
    ]);
    const dataset = buildSearchDatasetFromMerchantDocs([
      {
        merchantId: 'merchant_1',
        merchantName: 'Adidas',
        merchantKey: 'adidas',
        categories: ['shopping'],
        banks: ['Mercado Pago'],
        locations: [],
        activeBenefitCount: 1,
        benefitCount: 1,
        searchProfile: {
          aliases: [],
          description: '',
          productTags: [],
          intentTags: [],
          benefits: [],
        },
      },
    ], { providerCatalog });

    expect(dataset.merchantDocuments[0].banks).toEqual(['mercadopago']);
  });

  it('does not index uncataloged bank display values as filter tokens', () => {
    const providerCatalog = buildProviderCatalog([
      { key: 'mercadopago', name: 'Mercado Pago', aliases: ['mercado'] },
    ]);
    const dataset = buildSearchDatasetFromMerchantDocs([
      {
        merchantId: 'merchant_1',
        merchantName: 'Adidas',
        merchantKey: 'adidas',
        categories: ['shopping'],
        banks: ['Banco Provincia'],
        locations: [],
        activeBenefitCount: 1,
        benefitCount: 1,
        searchProfile: {
          aliases: [],
          description: '',
          productTags: [],
          intentTags: [],
          benefits: [],
        },
      },
    ], { providerCatalog });

    expect(dataset.merchantDocuments[0].banks).toEqual([]);
  });
});
