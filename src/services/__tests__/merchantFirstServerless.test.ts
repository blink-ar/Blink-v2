import { describe, expect, it } from 'vitest';
import { handleGetBenefits, handleGetBusinesses, rehydrateBenefitDoc } from '../../../api/[...path].js';

function createResponseCapture() {
  return {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: null as string | null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    send(payload: string) {
      this.body = payload;
      return this;
    }
  };
}

function createCursor<T>(data: T[]) {
  const cursor = {
    sort() {
      return cursor;
    },
    skip() {
      return cursor;
    },
    limit() {
      return cursor;
    },
    async toArray() {
      return data;
    }
  };
  return cursor;
}

describe('merchant-first serverless helpers', () => {
  it('rehydrateBenefitDoc prefers merchant-owned fields', () => {
    const benefit = {
      id: 'benefit-1',
      merchantId: 'merchant_1',
      merchant: { name: 'Old Name' },
      categories: ['old-category'],
      locations: [{ formattedAddress: 'Old Address' }]
    };
    const merchant = {
      merchantId: 'merchant_1',
      merchantKey: 'adidas',
      merchantName: 'Adidas',
      kind: 'merchant',
      categories: ['shopping'],
      locations: [{ formattedAddress: 'Store 1', lat: -34.6, lng: -58.38 }]
    };

    const result = rehydrateBenefitDoc(benefit, merchant);

    expect(result.merchant.name).toBe('Adidas');
    expect(result.categories).toEqual(['shopping']);
    expect(result.locations).toEqual(merchant.locations);
    expect(result.merchantSnapshot.merchantId).toBe('merchant_1');
  });

  it('handleGetBusinesses paginates merchants before benefit hydration', async () => {
    const merchantQueries: any[] = [];
    const benefitQueries: any[] = [];

    const merchants = [
      {
        merchantId: 'merchant_1',
        merchantName: 'Adidas',
        merchantKey: 'adidas',
        categories: ['shopping'],
        locations: [{ formattedAddress: 'Store 1', lat: -34.6, lng: -58.38 }],
        banks: ['BBVA'],
        searchProfile: { description: 'Sportswear' },
        activeBenefitCount: 1,
        benefitCount: 1,
        hasOnlineBenefits: false,
        imageUrl: 'https://cdn.example.com/adidas.jpg',
        logoUrl: null,
        coverUrl: null
      },
      {
        merchantId: 'merchant_2',
        merchantName: 'Mostaza',
        merchantKey: 'mostaza',
        categories: ['gastronomia'],
        locations: [{ formattedAddress: 'Store 2', lat: -34.61, lng: -58.39 }],
        banks: ['BBVA'],
        searchProfile: { description: 'Fast food' },
        activeBenefitCount: 1,
        benefitCount: 1,
        hasOnlineBenefits: true,
        imageUrl: 'https://cdn.example.com/mostaza.jpg',
        logoUrl: null,
        coverUrl: null
      }
    ];

    const benefits = [
      {
        id: 'benefit-1',
        merchantId: 'merchant_1',
        bank: 'BBVA',
        benefitTitle: '20% OFF',
        availableDays: ['Lunes'],
        discountPercentage: 20,
        caps: [],
        online: false,
        otherDiscounts: null,
        installments: null,
        description: 'Promo',
        termsAndConditions: '',
        link: null,
        validUntil: '2099-12-31',
        cardTypes: []
      }
    ];

    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async countDocuments(query: unknown) {
              merchantQueries.push(query);
              return merchants.length;
            },
            find(query: unknown) {
              merchantQueries.push(query);
              return createCursor([merchants[0]]);
            }
          };
        }

        if (name === 'confirmed_benefits') {
          return {
            find(query: unknown) {
              benefitQueries.push(query);
              return createCursor(benefits);
            }
          };
        }

        if (name === 'bank_cards') {
          return {
            find() {
              return createCursor([]);
            }
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      }
    };

    const req = {};
    const res = createResponseCapture();
    const url = new URL('https://example.com/api/businesses?collection=confirmed_benefits&category=shopping&bank=BBVA&limit=1&offset=0');

    await handleGetBusinesses(req as never, res as never, url, db as never);

    const payload = JSON.parse(res.body || '{}');
    expect(res.statusCode).toBe(200);
    expect(payload.businesses).toHaveLength(1);
    expect(payload.businesses[0].id).toBe('merchant_1');
    expect(payload.businesses[0].benefits).toHaveLength(1);
    expect(merchantQueries[0].categories).toEqual({ $in: ['shopping'] });
    expect(benefitQueries[0].merchantId.$in).toEqual(['merchant_1']);
  });

  it('handleGetBenefits rehydrates merchant-owned fields for benefit listings', async () => {
    const benefits = [
      {
        id: 'benefit-1',
        merchantId: 'merchant_1',
        bank: 'BBVA',
        benefitTitle: '20% OFF',
        description: 'Promo',
        online: false,
        validUntil: '2099-12-31'
      }
    ];

    const merchant = {
      merchantId: 'merchant_1',
      merchantKey: 'adidas',
      merchantName: 'Adidas',
      kind: 'merchant',
      categories: ['shopping'],
      locations: [{ formattedAddress: 'Store 1', lat: -34.6, lng: -58.38 }]
    };

    const db = {
      collection(name: string) {
        if (name === 'confirmed_benefits') {
          return {
            find() {
              return createCursor(benefits);
            },
            async countDocuments() {
              return benefits.length;
            }
          };
        }
        if (name === 'merchant_assets') {
          return {
            find() {
              return createCursor([merchant]);
            }
          };
        }
        throw new Error(`Unexpected collection: ${name}`);
      }
    };

    const req = {};
    const res = createResponseCapture();
    const url = new URL('https://example.com/api/benefits?collection=confirmed_benefits');

    await handleGetBenefits(req as never, res as never, url, db as never);

    const payload = JSON.parse(res.body || '{}');
    expect(res.statusCode).toBe(200);
    expect(payload.benefits[0].merchant.name).toBe('Adidas');
    expect(payload.benefits[0].categories).toEqual(['shopping']);
    expect(payload.benefits[0].locations).toEqual(merchant.locations);
  });
});
