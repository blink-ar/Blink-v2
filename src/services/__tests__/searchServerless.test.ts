import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildSearchDatasetFromMerchantDocs } from '../../../api/search/entities.js';
import { buildProviderCatalog } from '../../../server/providers.js';

const { meiliSearchMock, isMeilisearchConfiguredMock } = vi.hoisted(() => ({
  meiliSearchMock: vi.fn(),
  isMeilisearchConfiguredMock: vi.fn()
}));

vi.mock('../../../api/search/meilisearch.js', () => ({
  meiliSearch: meiliSearchMock,
  isMeilisearchConfigured: isMeilisearchConfiguredMock
}));

import { handleSearch, normalizeSavedBankCodesForCatalog } from '../../../api/[...path].js';

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

function expectBenefitQueryForMerchants(query: unknown, merchantIds: string[]) {
  expect(query).toHaveProperty('$or');
  expect((query as { $or: unknown[] }).$or).toEqual(expect.arrayContaining([
      { merchantIds: { $in: merchantIds } },
      {
        $and: [
          { merchantId: { $in: merchantIds } },
          { $expr: expect.any(Object) },
        ],
      },
  ]));
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

function expectAnyRegexMatches(patterns: RegExp[], value: string) {
  expect(patterns.some((pattern) => pattern.test(value))).toBe(true);
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
    delete (globalThis as { __blinkProviderCatalog?: unknown }).__blinkProviderCatalog;
  });

  it('resolves legacy bank aliases before building Meilisearch filters', async () => {
    isMeilisearchConfiguredMock.mockReturnValue(true);
    meiliSearchMock
      .mockResolvedValueOnce({ hits: [], estimatedTotalHits: 0 })
      .mockResolvedValueOnce({ hits: [] })
      .mockResolvedValueOnce({ hits: [] });

    const db = {
      collection(name: string) {
        if (name === 'providers') {
          return {
            find() {
              return createCursor([
                { key: 'mercadopago', name: 'Mercado Pago', aliases: ['mercado'], shortName: 'MP' },
              ]);
            },
          };
        }

        if (name === 'merchant_assets') {
          return {
            find() {
              return createCursor([]);
            },
          };
        }

        if (name === 'confirmed_benefits') {
          return {
            find() {
              return createCursor([]);
            },
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      },
    };

    const res = createResponseCapture();
    const url = new URL('https://example.com/api/search?q=adidas&bank=mercado&collection=confirmed_benefits');

    await handleSearch({ method: 'GET' } as never, res as never, url, db as never);

    expect(meiliSearchMock.mock.calls[0][1].filter).toContain('banks = "mercadopago"');
    expect(JSON.parse(res.body || '{}').query.filters.bank).toBe('mercadopago');
  });

  it('does not broaden Meilisearch queries for uncataloged bank filters', async () => {
    isMeilisearchConfiguredMock.mockReturnValue(true);
    meiliSearchMock
      .mockResolvedValueOnce({ hits: [], estimatedTotalHits: 0 })
      .mockResolvedValueOnce({ hits: [] })
      .mockResolvedValueOnce({ hits: [] });

    const db = {
      collection(name: string) {
        if (name === 'providers') {
          return {
            find() {
              return createCursor([
                { key: 'mercadopago', name: 'Mercado Pago', aliases: ['mercado'], shortName: 'MP' },
              ]);
            },
          };
        }

        if (name === 'merchant_assets' || name === 'confirmed_benefits') {
          return {
            find() {
              return createCursor([]);
            },
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      },
    };

    const res = createResponseCapture();
    const url = new URL('https://example.com/api/search?q=adidas&bank=bancoprovincia&collection=confirmed_benefits');

    await handleSearch({ method: 'GET' } as never, res as never, url, db as never);

    expect(meiliSearchMock.mock.calls[0][1].filter).toContain('banks = "__unknown_provider__"');
    expect(JSON.parse(res.body || '{}').query.filters.bank).toBeUndefined();
  });

  it('returns 503 for bank filters when the provider catalog is empty', async () => {
    isMeilisearchConfiguredMock.mockReturnValue(true);

    const db = {
      collection(name: string) {
        if (name === 'providers') {
          return {
            find() {
              return createCursor([]);
            },
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      },
    };

    const res = createResponseCapture();
    const url = new URL('https://example.com/api/search?q=adidas&bank=galicia&collection=confirmed_benefits');

    await handleSearch({ method: 'GET' } as never, res as never, url, db as never);

    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body || '{}')).toMatchObject({
      success: false,
      error: 'Catálogo de bancos no disponible',
    });
    expect(meiliSearchMock).not.toHaveBeenCalled();
  });

  it('normalizes saved banks only against an available provider catalog', () => {
    const catalog = buildProviderCatalog([
      { key: 'mercadopago', name: 'Mercado Pago', aliases: ['mercado'], shortName: 'MP' },
    ]);

    expect(normalizeSavedBankCodesForCatalog(catalog, ['mercado', 'Mercado Pago'])).toEqual({
      ok: true,
      savedBankCodes: ['mercadopago'],
    });
    expect(normalizeSavedBankCodesForCatalog(buildProviderCatalog([]), ['mercado'])).toMatchObject({
      ok: false,
      status: 503,
    });
    expect(normalizeSavedBankCodesForCatalog(catalog, ['banco no catalogado'])).toMatchObject({
      ok: false,
      status: 400,
      payload: {
        error: 'Banco no catalogado',
        unresolvedBanks: ['banco no catalogado'],
      },
    });
    expect(normalizeSavedBankCodesForCatalog(buildProviderCatalog([]), [])).toEqual({
      ok: true,
      savedBankCodes: [],
    });
  });

  it('expands legacy bank aliases for Mongo fallback bank filters', async () => {
    isMeilisearchConfiguredMock.mockReturnValue(false);

    const merchantQueries: unknown[] = [];
    const benefitQueries: unknown[] = [];
    const merchant = {
      merchantId: 'merchant_mp',
      merchantName: 'Adidas',
      merchantKey: 'adidas',
      categories: ['shopping'],
      banks: ['Mercado Pago'],
      locations: [],
      activeBenefitCount: 1,
      benefitCount: 1,
      hasOnlineBenefits: false,
      maxDiscountPercentage: 20,
      searchProfile: {
        aliases: ['adidas'],
        description: 'Adidas descuentos',
        benefits: []
      },
      imageUrl: '',
      logoUrl: '',
      coverUrl: ''
    };

    const db = {
      collection(name: string) {
        if (name === 'providers') {
          return {
            find() {
              return createCursor([
                { key: 'mercadopago', name: 'Mercado Pago', aliases: ['mercado'], shortName: 'MP' },
              ]);
            },
          };
        }

        if (name === 'merchant_assets') {
          return {
            find(query: unknown) {
              merchantQueries.push(query);
              return createCursor([merchant]);
            }
          };
        }

        if (name === 'confirmed_benefits') {
          return {
            find(query: unknown) {
              benefitQueries.push(query);
              return createCursor([]);
            }
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      },
    };

    const res = createResponseCapture();
    const url = new URL('https://example.com/api/search?q=adidas&bank=mercado&collection=confirmed_benefits');

    await handleSearch({ method: 'GET' } as never, res as never, url, db as never);

    const merchantBankRegexes = (
      merchantQueries[0] as { $and: Array<{ banks?: { $in: RegExp[] } }> }
    ).$and[0].banks?.$in || [];
    const benefitBankRegexes = (
      benefitQueries[0] as { 'eligibilities.bank': { $in: RegExp[] } }
    )['eligibilities.bank'].$in;

    expectAnyRegexMatches(merchantBankRegexes, 'mercadopago');
    expectAnyRegexMatches(merchantBankRegexes, 'Mercado Pago');
    expectAnyRegexMatches(merchantBankRegexes, 'mercado');
    expectAnyRegexMatches(benefitBankRegexes, 'mercadopago');
    expectAnyRegexMatches(benefitBankRegexes, 'Mercado Pago');
    expect(JSON.parse(res.body || '{}').query.filters.bank).toBe('mercadopago');
  });

  it('resolves Mongo fallback benefit-title matches from confirmed benefits', async () => {
    isMeilisearchConfiguredMock.mockReturnValue(false);

    const merchantQueries: unknown[] = [];
    const benefitQueries: unknown[] = [];
    const merchant = {
      merchantId: 'merchant_freddo',
      merchantName: 'Freddo',
      merchantKey: 'freddo',
      categories: ['gastronomia'],
      banks: ['galicia'],
      locations: [],
      activeBenefitCount: 1,
      benefitCount: 1,
      hasOnlineBenefits: false,
      maxDiscountPercentage: 20,
      searchProfile: { aliases: ['freddo'], description: '', productTags: [] },
    };
    const benefit = {
      id: 'freddo-helado',
      merchantId: 'merchant_freddo',
      eligibilities: [{
        bank: 'galicia',
        bankDisplayName: 'Banco Galicia',
        cardTypes: [],
        cardResolutionStatus: 'not_required',
        subscription: null,
        subscriptionResolutionStatus: 'not_required',
      }],
      benefitTitle: '20% OFF en helados',
      description: '',
      availableDays: [],
      discountPercentage: 20,
      caps: [],
      online: false,
      validUntil: '2099-12-31',
    };

    const db = {
      collection(name: string) {
        if (name === 'providers') {
          return { find: () => createCursor([]) };
        }
        if (name === 'merchant_assets') {
          return {
            find(query: unknown) {
              merchantQueries.push(query);
              return createCursor([merchant]);
            },
          };
        }
        if (name === 'confirmed_benefits') {
          return {
            find(query: unknown) {
              benefitQueries.push(query);
              return createCursor([benefit]);
            },
          };
        }
        throw new Error(`Unexpected collection: ${name}`);
      },
    };

    const res = createResponseCapture();
    const url = new URL('https://example.com/api/search?q=helados&collection=confirmed_benefits');
    await handleSearch({ method: 'GET' } as never, res as never, url, db as never);

    expect(benefitQueries[0]).toHaveProperty('$or', expect.arrayContaining([
      { benefitTitle: { $regex: expect.any(RegExp) } },
    ]));
    expect(merchantQueries).toContainEqual(expect.objectContaining({
      $and: expect.arrayContaining([expect.objectContaining({
        $or: expect.arrayContaining([{ merchantId: { $in: ['merchant_freddo'] } }]),
      })]),
    }));
    expect(JSON.parse(res.body || '{}').merchants[0].business.benefits[0].id).toBe('freddo-helado');
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

  it('keeps an exact locationless Uber search result first when user coordinates are present', async () => {
    isMeilisearchConfiguredMock.mockReturnValue(true);

    const uberMerchant = {
      merchantId: 'uber--merchant_69a6f6efb7ff0ecb9e33cf28',
      merchantName: 'Uber',
      merchantKey: 'uber',
      aliases: ['Uber'],
      categories: ['movilidad'],
      banks: ['BBVA'],
      locations: [],
      activeBenefitCount: 1,
      benefitCount: 1,
      hasOnlineBenefits: true,
      maxDiscountPercentage: 20,
      searchProfile: {
        aliases: ['Uber'],
        description: 'Viajes y movilidad',
        benefits: []
      },
      imageUrl: '',
      logoUrl: '',
      coverUrl: ''
    };
    const nearbyMerchants = [1, 2, 3].map((index) => ({
      merchantId: `nearby_uber_${index}`,
      merchantName: `Uber Cafe ${index}`,
      merchantKey: `uber-cafe-${index}`,
      aliases: [`Uber Cafe ${index}`],
      categories: ['gastronomia'],
      banks: ['BBVA'],
      locations: [{ formattedAddress: `Store ${index}`, lat: -34.6037 + index * 0.001, lng: -58.3816 }],
      activeBenefitCount: 1,
      benefitCount: 1,
      hasOnlineBenefits: false,
      maxDiscountPercentage: 10,
      searchProfile: {
        aliases: [`Uber Cafe ${index}`],
        description: 'Cafe cercano',
        benefits: []
      },
      imageUrl: '',
      logoUrl: '',
      coverUrl: ''
    }));
    const nearbyHits = buildSearchDatasetFromMerchantDocs(nearbyMerchants)
      .merchantDocuments
      .map((hit) => ({ ...hit, _rankingScore: 1 }));

    meiliSearchMock
      .mockResolvedValueOnce({ hits: nearbyHits, estimatedTotalHits: nearbyHits.length })
      .mockResolvedValueOnce({ hits: [] })
      .mockResolvedValueOnce({ hits: [] });

    const benefits = [
      {
        id: 'benefit-uber',
        merchantId: uberMerchant.merchantId,
        eligibilities: [{
          bank: 'bbva',
          bankDisplayName: 'BBVA',
          cardTypes: [],
          cardResolutionStatus: 'not_required',
          subscription: null,
          subscriptionResolutionStatus: 'not_required'
        }],
        benefitTitle: '20% OFF en Uber',
        availableDays: ['Lunes'],
        discountPercentage: 20,
        caps: [],
        online: true,
        otherDiscounts: null,
        installments: null,
        description: 'Promo Uber',
        termsAndConditions: '',
        link: null,
        validUntil: '2099-12-31',
      },
      ...nearbyMerchants.map((merchant, index) => ({
        id: `benefit-nearby-${index}`,
        merchantId: merchant.merchantId,
        eligibilities: [{
          bank: 'bbva',
          bankDisplayName: 'BBVA',
          cardTypes: [],
          cardResolutionStatus: 'not_required',
          subscription: null,
          subscriptionResolutionStatus: 'not_required'
        }],
        benefitTitle: '10% OFF cerca',
        availableDays: ['Lunes'],
        discountPercentage: 10,
        caps: [],
        online: false,
        otherDiscounts: null,
        installments: null,
        description: 'Promo cercana',
        termsAndConditions: '',
        link: null,
        validUntil: '2099-12-31',
      }))
    ];

    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            find(findQuery: unknown) {
              return createCursor(
                merchantMatchesRegexQuery(findQuery, uberMerchant) ? [uberMerchant] : []
              );
            }
          };
        }

        if (name === 'confirmed_benefits') {
          return {
            find() {
              return createCursor(benefits);
            }
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      }
    };

    const res = createResponseCapture();
    const url = new URL('https://example.com/api/search?q=Uber&lat=-34.6037&lng=-58.3816&limit=4&offset=0&collection=confirmed_benefits');

    await handleSearch({ method: 'GET' } as never, res as never, url, db as never);

    const payload = JSON.parse(res.body || '{}');
    expect(res.statusCode).toBe(200);
    expect(payload.merchants[0].merchantId).toBe('uber--merchant_69a6f6efb7ff0ecb9e33cf28');
    expect(payload.merchants[0].merchantName).toBe('Uber');
    expect(payload.merchants[0].reasons).toContain('merchant_exact');
    expect(payload.merchants[0].business.location).toEqual([]);
    expect(payload.merchants[0].business.benefits).toHaveLength(1);
    expect(payload.merchants.slice(1).every((merchant: { business: { distance: number } }) => Number.isFinite(merchant.business.distance))).toBe(true);
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
    expectBenefitQueryForMerchants(benefitFindQuery, ['merchant_sporting']);
    expect(benefitFindQuery).toHaveProperty('$and.0.$expr');
  });

  it('hydrates shared merchantIds benefits for every linked search merchant', async () => {
    isMeilisearchConfiguredMock.mockReturnValue(true);
    meiliSearchMock
      .mockResolvedValueOnce({
        hits: [
          {
            ...buildMerchantDoc('merchant_adidas', 'Adidas', 1),
            business: {
              id: 'merchant_adidas',
              name: 'Adidas',
              category: 'deportes',
              description: '',
              rating: 5,
              location: [],
              image: '',
              benefits: []
            }
          },
          {
            ...buildMerchantDoc('merchant_sporting', 'Sporting', 0.9),
            business: {
              id: 'merchant_sporting',
              name: 'Sporting',
              category: 'deportes',
              description: '',
              rating: 5,
              location: [],
              image: '',
              benefits: []
            }
          }
        ],
        estimatedTotalHits: 2
      })
      .mockResolvedValueOnce({ hits: [] })
      .mockResolvedValueOnce({ hits: [] });

    let benefitFindQuery: unknown;
    const sharedBenefit = {
      id: 'shared-benefit',
      merchantIds: ['merchant_adidas', 'merchant_sporting'],
      eligibilities: [{
        bank: 'galicia',
        bankDisplayName: 'Banco Galicia',
        cardTypes: [],
        cardResolutionStatus: 'not_required',
        subscription: null,
        subscriptionResolutionStatus: 'not_required'
      }],
      benefitTitle: '30% OFF compartido',
      availableDays: ['Lunes'],
      discountPercentage: 30,
      caps: [],
      online: true,
      otherDiscounts: null,
      installments: null,
      description: 'Promo compartida',
      termsAndConditions: '',
      link: null,
      validUntil: '2099-12-31',
    };

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
              return createCursor([sharedBenefit]);
            }
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      }
    };

    const res = createResponseCapture();
    const url = new URL('https://example.com/api/search?q=deportes&limit=20&offset=0&collection=confirmed_benefits');

    await handleSearch({ method: 'GET' } as never, res as never, url, db as never);

    const payload = JSON.parse(res.body || '{}');
    expect(res.statusCode).toBe(200);
    expect(payload.merchants).toHaveLength(2);
    expect(payload.merchants.every((merchant: { business: { benefits: unknown[] } }) => merchant.business.benefits.length === 1)).toBe(true);
    expect(payload.merchants.map((merchant: { business: { benefits: Array<{ id: string }> } }) => merchant.business.benefits[0].id)).toEqual([
      'shared-benefit',
      'shared-benefit'
    ]);
    expect(payload.merchants[0].business.benefits[0]).not.toHaveProperty('merchantIds');
    expectBenefitQueryForMerchants(benefitFindQuery, ['merchant_adidas', 'merchant_sporting']);
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

describe('search responsiveness and filter contracts', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete (globalThis as { __blinkProviderCatalog?: unknown }).__blinkProviderCatalog;
    isMeilisearchConfiguredMock.mockReturnValue(true);
  });

  function emptyDb(findSpy = vi.fn()) {
    return { collection(name: string) { return { find(query: unknown, options?: unknown) {
      findSpy(name, query, options);
      return createCursor([]);
    } }; } };
  }

  it('overlaps independent search sections with the merchant name rescue', async () => {
    vi.useFakeTimers();
    let rescuesStarted = 0;
    meiliSearchMock.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return { hits: [] };
    });
    const db = { collection(name: string) { return { find() {
      const cursor = createCursor([]);
      if (name === 'merchant_assets') {
        cursor.toArray = async () => {
          rescuesStarted += 1;
          await new Promise((resolve) => setTimeout(resolve, 20));
          return [];
        };
      }
      return cursor;
    } }; } };
    const res = createResponseCapture();
    const started = Date.now();
    try {
      const pending = handleSearch({ method: 'GET' } as never, res as never, new URL('https://example.com/api/search?q=café'), db as never);
      await vi.advanceTimersByTimeAsync(0);
      const initialSections = meiliSearchMock.mock.calls.length;
      const initialRescues = rescuesStarted;
      await vi.runAllTimersAsync();
      await pending;
      expect(initialSections).toBe(3);
      expect(initialRescues).toBe(1);
      expect(Date.now() - started).toBe(100);
      expect(res.statusCode).toBe(200);
    } finally { vi.useRealTimers(); }
  });

  it('applies online to merchants and benefits while leaving intent/product references searchable', async () => {
    const findSpy = vi.fn();
    const merchant = { ...buildMerchantDoc('cafe', 'Café', 1), online: true };
    meiliSearchMock.mockResolvedValue({ hits: [] }).mockResolvedValueOnce({ hits: [merchant] });
    const res = createResponseCapture();
    await handleSearch({ method: 'GET' } as never, res as never, new URL('https://example.com/api/search?q=café&online=true'), emptyDb(findSpy) as never);
    expect(meiliSearchMock.mock.calls[0][1].filter).toContain('online = true');
    expect(meiliSearchMock.mock.calls[1][1].filter).not.toContain('online = true');
    expect(meiliSearchMock.mock.calls[2][1].filter).not.toContain('online = true');
    const merchantQuery = findSpy.mock.calls.find(([name]) => name === 'merchant_assets')![1];
    expect(merchantQuery.$and).toContainEqual(expect.objectContaining({ hasOnlineBenefits: true }));
    const benefitQuery = findSpy.mock.calls.find(([name]) => name === 'confirmed_benefits')![1];
    expect(benefitQuery).toHaveProperty('online', true);
    // No matching online benefits: summaries must not retain all-channel counts/discounts.
    expect(JSON.parse(res.body || '{}').merchants[0].business).toMatchObject({ benefitCount: 0, maxDiscountPercentage: 0, banks: [] });
  });

  it('uses approximate Tucumán coordinates for text search distance scoring', async () => {
    const doc = buildMerchantDoc('cafe', 'Café', 1);
    const merchant = { ...doc, locations: [{ lat: -26.824, lng: -65.223 }], business: { ...doc.business, location: [{ lat: -26.824, lng: -65.223 }] } };
    meiliSearchMock.mockResolvedValue({ hits: [] }).mockResolvedValueOnce({ hits: [merchant] });
    const res = createResponseCapture();
    await handleSearch({ method: 'GET' } as never, res as never, new URL('https://example.com/api/search?q=café&geohash=6e3h'), emptyDb() as never);
    const result = JSON.parse(res.body || '{}');
    expect(result.merchants[0].business.distance).toBeTypeOf('number');
  });
});

describe('Mongo search fallback scheduling', () => {
  it('overlaps dependent benefit/merchant retrieval with name rescue without changing results', async () => {
    vi.resetAllMocks();
    delete (globalThis as { __blinkProviderCatalog?: unknown }).__blinkProviderCatalog;
    isMeilisearchConfiguredMock.mockReturnValue(false);
    vi.useFakeTimers();
    const called = [] as string[];
    const db = { collection(name: string) { return { find() {
      const cursor = createCursor([]);
      cursor.toArray = async () => {
        if (name !== 'providers') { called.push(name); await new Promise(resolve => setTimeout(resolve, 50)); }
        return [];
      };
      return cursor;
    } }; } };
    const res = createResponseCapture();
    const started = Date.now();
    try {
      const pending = handleSearch({ method: 'GET' } as never, res as never, new URL('https://example.com/api/search?q=heladerías'), db as never);
      await vi.advanceTimersByTimeAsync(0);
      const initialReads = [...called];
      await vi.runAllTimersAsync();
      await pending;
      const elapsed = Date.now() - started;
      console.info('Mongo fallback fixture elapsedMs:', elapsed);
      expect(initialReads).toEqual(expect.arrayContaining(['confirmed_benefits', 'merchant_assets']));
      expect(elapsed).toBe(100);
      expect(JSON.parse(res.body || '{}')).toMatchObject({ success: true, source: 'mongodb_fallback', merchants: [], pagination: { totalMerchants: 0 } });
    } finally { vi.useRealTimers(); }
  });
});

// Independent integration regressions for outage load and location/filter behavior.
describe('integrated search failure and filter contracts', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete (globalThis as { __blinkProviderCatalog?: unknown }).__blinkProviderCatalog;
    isMeilisearchConfiguredMock.mockReturnValue(true);
  });

  it('reuses pending exact/prefix rescue when an engine request fails', async () => {
    vi.useFakeTimers();
    let rescueReads = 0;
    let pendingRescueReads = 0;
    let peakPendingRescueReads = 0;
    meiliSearchMock.mockRejectedValue(new Error('Engine unavailable'));
    const db = { collection(name: string) { return { find(query: unknown) {
      const cursor = createCursor([]);
      const isRescue = name === 'merchant_assets' && JSON.stringify(query).includes('$elemMatch');
      cursor.toArray = async () => {
        if (isRescue) {
          rescueReads += 1;
          pendingRescueReads += 1;
          peakPendingRescueReads = Math.max(peakPendingRescueReads, pendingRescueReads);
          await new Promise(resolve => setTimeout(resolve, 50));
          pendingRescueReads -= 1;
        }
        return [];
      };
      return cursor;
    } }; } };
    const res = createResponseCapture();
    try {
      const pending = handleSearch({ method: 'GET' } as never, res as never, new URL('https://example.com/api/search?q=café'), db as never);
      await vi.runAllTimersAsync();
      await pending;
      expect(rescueReads).toBe(2);
      expect(peakPendingRescueReads).toBe(1);
      expect(meiliSearchMock).toHaveBeenCalledTimes(3);
      expect(JSON.parse(res.body || '{}')).toMatchObject({ success: true, source: 'mongodb_fallback' });
    } finally { vi.useRealTimers(); }
  });

  it('retains a fallback rescue retry when the primary rescue itself failed', async () => {
    meiliSearchMock.mockResolvedValue({ hits: [] });
    let rescueReads = 0;
    const db = { collection(name: string) { return { find(query: unknown) {
      const cursor = createCursor([]);
      if (name === 'merchant_assets' && JSON.stringify(query).includes('$elemMatch')) {
        cursor.toArray = async () => {
          rescueReads += 1;
          if (rescueReads === 1) throw new Error('Transient rescue read failed');
          return [];
        };
      }
      return cursor;
    } }; } };
    const res = createResponseCapture();
    await handleSearch({ method: 'GET' } as never, res as never, new URL('https://example.com/api/search?q=café'), db as never);
    expect(rescueReads).toBe(3);
    expect(JSON.parse(res.body || '{}')).toMatchObject({ success: true, source: 'mongodb_fallback' });
  });

  it('retains online restrictions on both fallback candidates and hydration', async () => {
    isMeilisearchConfiguredMock.mockReturnValue(false);
    const queries: { name: string; query: unknown }[] = [];
    const merchant = { ...buildMerchantDoc('fixture-cafe', 'Café'), hasOnlineBenefits: true };
    const db = { collection(name: string) { return { find(query: unknown) {
      queries.push({ name, query });
      return createCursor(name === 'merchant_assets' ? [merchant] : []);
    } }; } };
    const res = createResponseCapture();
    await handleSearch({ method: 'GET' } as never, res as never, new URL('https://example.com/api/search?q=café&online=true'), db as never);
    const benefitQueries = queries.filter(entry => entry.name === 'confirmed_benefits');
    expect(benefitQueries).toHaveLength(2);
    for (const entry of benefitQueries) expect(entry.query).toHaveProperty('online', true);
    for (const entry of queries.filter(entry => entry.name === 'merchant_assets')) {
      expect(entry.query).toHaveProperty('$and', expect.arrayContaining([expect.objectContaining({ hasOnlineBenefits: true })]));
    }
    expect(JSON.parse(res.body || '{}').merchants[0].business).toMatchObject({ benefitCount: 0, maxDiscountPercentage: 0, banks: [] });
  });

  it('uses exact coordinates ahead of geohash in server distance scoring', async () => {
    const doc = buildMerchantDoc('fixture-cafe', 'Café', 1);
    const location = { lat: -26.824, lng: -65.223 };
    const merchant = { ...doc, locations: [location], business: { ...doc.business, location: [location] } };
    meiliSearchMock.mockResolvedValue({ hits: [] }).mockResolvedValueOnce({ hits: [merchant] });
    const db = { collection() { return { find() { return createCursor([]); } }; } };
    const res = createResponseCapture();
    await handleSearch({ method: 'GET' } as never, res as never, new URL('https://example.com/api/search?q=café&lat=-26.824&lng=-65.223&geohash=6e3h'), db as never);
    expect(JSON.parse(res.body || '{}').merchants[0].business.distance).toBe(0);
  });
});
