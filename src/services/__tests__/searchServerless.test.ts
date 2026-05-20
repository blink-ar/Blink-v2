import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildSearchDatasetFromMerchantDocs } from '../../../api/search/entities.js';

const { meiliSearchMock, isMeilisearchConfiguredMock } = vi.hoisted(() => ({
  meiliSearchMock: vi.fn(),
  isMeilisearchConfiguredMock: vi.fn()
}));

vi.mock('../../../api/search/meilisearch.js', () => ({
  meiliSearch: meiliSearchMock,
  isMeilisearchConfigured: isMeilisearchConfiguredMock
}));

import { handleSearch } from '../../../api/[...path].js';

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
    limit() {
      return cursor;
    },
    async toArray() {
      return data;
    }
  };
  return cursor;
}

function buildMerchantDoc(merchantId: string, merchantName: string, rankingScore?: number) {
  const merchant = {
    merchantId,
    merchantName,
    merchantKey: merchantName.toLowerCase(),
    categories: ['shopping'],
    banks: ['galicia'],
    locations: [],
    activeBenefitCount: merchantName === 'Ver' ? 2 : 8,
    benefitCount: merchantName === 'Ver' ? 2 : 8,
    hasOnlineBenefits: false,
    maxDiscountPercentage: merchantName === 'Ver' ? 25 : 10,
    searchProfile: {
      aliases: [merchantName.toLowerCase()],
      description: merchantName === 'Ver'
        ? 'Todos los viernes en los comercios adheridos.'
        : `${merchantName} description`,
      benefits: []
    },
    imageUrl: '',
    logoUrl: '',
    coverUrl: ''
  };

  const document = buildSearchDatasetFromMerchantDocs([merchant]).merchantDocuments[0];
  return rankingScore === undefined ? merchant : { ...document, _rankingScore: rankingScore };
}

function collectRegexes(value: unknown, out: RegExp[] = []) {
  if (value instanceof RegExp) {
    out.push(value);
    return out;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectRegexes(entry, out));
    return out;
  }

  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach((entry) => collectRegexes(entry, out));
  }

  return out;
}

interface MerchantSearchFixture {
  merchantName?: string;
  merchantKey?: string;
  aliases?: string[];
  searchProfile?: {
    aliases?: string[];
  };
}

function merchantMatchesRegexQuery(query: unknown, merchant: MerchantSearchFixture) {
  const regexes = collectRegexes(query);
  const searchableValues = [
    merchant.merchantName,
    merchant.merchantKey,
    ...(merchant.aliases || []),
    ...(merchant.searchProfile?.aliases || [])
  ].filter(Boolean);

  return regexes.some((regex) => searchableValues.some((value) => {
    regex.lastIndex = 0;
    return regex.test(String(value));
  }));
}

describe('handleSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rescues an exact-name merchant that meilisearch omitted from merchant candidates', async () => {
    isMeilisearchConfiguredMock.mockReturnValue(true);
    meiliSearchMock
      .mockResolvedValueOnce({
        hits: [
          buildMerchantDoc('merchant_ver_posadas', 'Ver Posadas', 1),
          buildMerchantDoc('merchant_vercelli', 'VERCELLI', 0.9)
        ],
        estimatedTotalHits: 2000
      })
      .mockResolvedValueOnce({ hits: [] })
      .mockResolvedValueOnce({
        hits: [
          {
            entityId: 'product_ver',
            merchantRefs: ['merchant_seeded'],
            categories: [],
            _rankingScore: 1
          }
        ]
      })
      .mockResolvedValueOnce({
        hits: [
          buildMerchantDoc('merchant_seeded', 'Verde Promo', 0.8)
        ]
      });

    let merchantFindCount = 0;
    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            find() {
              merchantFindCount += 1;
              if (merchantFindCount === 1) {
                return createCursor([buildMerchantDoc('merchant_69a6f702b7ff0ecb9e33cf35', 'Ver')]);
              }
              return createCursor([buildMerchantDoc('merchant_ver_posadas', 'Ver Posadas')]);
            }
          };
        }

        if (name === 'confirmed_benefits') {
          return {
            find() {
              return createCursor([]);
            }
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      }
    };

    const res = createResponseCapture();
    const url = new URL('https://example.com/api/search?q=VER&limit=20&offset=0&collection=confirmed_benefits');

    await handleSearch({ method: 'GET' } as never, res as never, url, db as never);

    const payload = JSON.parse(res.body || '{}');
    expect(res.statusCode).toBe(200);
    expect(payload.source).toBe('meilisearch');
    expect(payload.merchants[0].merchantId).toBe('merchant_69a6f702b7ff0ecb9e33cf35');
    expect(payload.merchants[0].merchantName).toBe('Ver');
    expect(payload.merchants[0].reasons).toContain('merchant_exact');
    expect(payload.merchants.some((merchant: { merchantId: string }) => merchant.merchantId === 'merchant_69a6f702b7ff0ecb9e33cf35')).toBe(true);
    expect(merchantFindCount).toBe(2);
    expect(meiliSearchMock).toHaveBeenCalledTimes(4);
  });

  it('hydrates search result benefits from confirmed benefits before returning merchants', async () => {
    isMeilisearchConfiguredMock.mockReturnValue(true);
    meiliSearchMock
      .mockResolvedValueOnce({
        hits: [
          {
            ...buildMerchantDoc('merchant_sporting', 'Sporting', 1),
            business: {
              id: 'merchant_sporting',
              name: 'Sporting',
              category: 'shopping',
              description: '',
              rating: 5,
              location: [],
              image: '',
              benefits: [
                {
                  id: 'stale-galicia',
                  bankName: 'Banco Galicia',
                  cardName: 'Tarjeta',
                  benefit: 'Stale',
                  rewardRate: '10%',
                  color: '',
                  icon: ''
                }
              ]
            }
          }
        ],
        estimatedTotalHits: 1
      })
      .mockResolvedValueOnce({ hits: [] })
      .mockResolvedValueOnce({ hits: [] });

    let benefitFindQuery: unknown;
    const benefits = [
      {
        id: 'galicia-active',
        merchantId: 'merchant_sporting',
        eligibilities: [{
          bank: 'galicia',
          bankDisplayName: 'Banco Galicia',
          cardTypes: [],
          cardResolutionStatus: 'not_required',
          subscription: null,
          subscriptionResolutionStatus: 'not_required'
        }],
        benefitTitle: '10% OFF',
        availableDays: ['Lunes'],
        discountPercentage: 10,
        caps: [],
        online: false,
        otherDiscounts: null,
        installments: null,
        description: 'Promo Galicia',
        termsAndConditions: '',
        link: null,
        validUntil: '2099-12-31',
      },
      {
        id: 'naranja-active',
        merchantId: 'merchant_sporting',
        eligibilities: [{
          bank: 'naranjax',
          bankDisplayName: 'Naranja X',
          cardTypes: [],
          cardResolutionStatus: 'not_required',
          subscription: null,
          subscriptionResolutionStatus: 'not_required'
        }],
        benefitTitle: '15% OFF',
        availableDays: ['Martes'],
        discountPercentage: 15,
        caps: [],
        online: false,
        otherDiscounts: null,
        installments: null,
        description: 'Promo Naranja',
        termsAndConditions: '',
        link: null,
        validUntil: '2099-12-31',
      }
    ];

    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            find() {
              return createCursor([]);
            }
          };
        }

        if (name === 'confirmed_benefits') {
          return {
            find(query: unknown) {
              benefitFindQuery = query;
              return createCursor(benefits);
            }
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      }
    };

    const res = createResponseCapture();
    const url = new URL('https://example.com/api/search?q=sporting&limit=20&offset=0&collection=confirmed_benefits');

    await handleSearch({ method: 'GET' } as never, res as never, url, db as never);

    const payload = JSON.parse(res.body || '{}');
    expect(res.statusCode).toBe(200);
    expect(payload.merchants[0].business.benefits).toHaveLength(2);
    expect(payload.merchants[0].business.benefits.map((benefit: { bankName: string }) => benefit.bankName)).toEqual([
      'Banco Galicia',
      'Naranja X'
    ]);
    expect(benefitFindQuery).toMatchObject({
      merchantId: { $in: ['merchant_sporting'] }
    });
    expect(benefitFindQuery).toHaveProperty('$and.0.$expr');
  });

  it.each([
    ['almacén de pizzas', 'merchant_exact'],
    ['almacen de pizzas', 'merchant_exact'],
    ['almacen pizzas', 'merchant_name_variant'],
    ['almacen pizza', 'merchant_name_variant'],
    ['almacen de la pizza', 'merchant_name_tokens_exact'],
    ['almacen de las pizzas', 'merchant_name_tokens_exact']
  ])('rescues and prioritizes normalized merchant-name query "%s"', async (query, expectedReason) => {
    isMeilisearchConfiguredMock.mockReturnValue(true);
    meiliSearchMock
      .mockResolvedValueOnce({
        hits: [
          buildMerchantDoc('merchant_pizza_outlet', 'Pizza Outlet', 0.95)
        ],
        estimatedTotalHits: 1
      })
      .mockResolvedValueOnce({ hits: [] })
      .mockResolvedValueOnce({ hits: [] });

    const targetMerchant = buildMerchantDoc(
      'merchant_69a5e9d4b7ff0ecb9e339ea6',
      'Almacén de Pizzas'
    );
    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            find(findQuery: unknown) {
              return createCursor(
                merchantMatchesRegexQuery(findQuery, targetMerchant) ? [targetMerchant] : []
              );
            }
          };
        }

        if (name === 'confirmed_benefits') {
          return {
            find() {
              return createCursor([]);
            }
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      }
    };

    const res = createResponseCapture();
    const url = new URL(`https://example.com/api/search?q=${encodeURIComponent(query)}&limit=20&offset=0&collection=confirmed_benefits`);

    await handleSearch({ method: 'GET' } as never, res as never, url, db as never);

    const payload = JSON.parse(res.body || '{}');
    expect(res.statusCode).toBe(200);
    expect(payload.query.expanded).toContain('almacen pizza');
    expect(payload.merchants[0].merchantId).toBe('merchant_69a5e9d4b7ff0ecb9e339ea6');
    expect(payload.merchants[0].merchantName).toBe('Almacén de Pizzas');
    expect(payload.merchants[0].reasons).toContain(expectedReason);
    expect(meiliSearchMock).toHaveBeenCalledTimes(3);
  });
});
