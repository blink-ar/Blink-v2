import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildBusinessBenefitSummary,
  getActiveBenefitsMatch,
  handleCategorySeoPage,
  handleGetBenefitById,
  handleGetBanks,
  handleGetBenefits,
  handleGetBusinesses,
  handleDiscountSearchGuideSeoPage,
  handleHomeSeoPage,
  handleLegacyBusinessRedirect,
  handleLandingSeoPage,
  handleMerchantSeoPage,
  handleStaticNotFound,
  handleSearchSeoPage,
  resolveRequestPath,
  rehydrateBenefitDoc
} from '../../../api/[...path].js';

const merchantSeoAppShell = [
  '<!doctype html>',
  '<html lang="es">',
  '<head><title>Default</title><link rel="canonical" href="/" /></head>',
  '<body><div id="root"></div><script type="module" src="/assets/index-test.js"></script></body>',
  '</html>',
].join('\n');

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

function expectAnyRegexMatches(patterns: RegExp[], value: string) {
  expect(patterns.some((pattern) => pattern.test(value))).toBe(true);
}

function createPaginatedCursor<T>(data: T[]) {
  let offset = 0;
  let count = data.length;
  const cursor = {
    sort() {
      return cursor;
    },
    skip(value: number) {
      offset = value;
      return cursor;
    },
    limit(value: number) {
      count = value;
      return cursor;
    },
    async toArray() {
      return data.slice(offset, offset + count);
    }
  };
  return cursor;
}

function createAggregateCursor<T>(data: T[]) {
  return {
    async toArray() {
      return data;
    }
  };
}

describe('merchant-first serverless helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    delete (globalThis as { __blinkProviderCatalog?: unknown }).__blinkProviderCatalog;
  });

  it('resolveRequestPath honors Vercel path rewrites for pretty merchant URLs', () => {
    expect(resolveRequestPath(new URL('https://example.com/comercios/coto--merchant_1?path=comercios/coto--merchant_1'))).toBe('/api/comercios/coto--merchant_1');
    expect(resolveRequestPath(new URL('https://example.com/business/merchant_1?path=business/merchant_1'))).toBe('/api/business/merchant_1');
    expect(resolveRequestPath(new URL('https://example.com/categorias/moda?path=categorias/moda'))).toBe('/api/categorias/moda');
    expect(resolveRequestPath(new URL('https://example.com/categorias/moda/page/2?path=categorias/moda/page/2'))).toBe('/api/categorias/moda/page/2');
    expect(resolveRequestPath(new URL('https://example.com/descuentos/galicia/gastronomia?path=descuentos/galicia/gastronomia'))).toBe('/api/descuentos/galicia/gastronomia');
    expect(resolveRequestPath(new URL('https://example.com/descuentos/galicia/gastronomia/caba?path=descuentos/galicia/gastronomia/caba'))).toBe('/api/descuentos/galicia/gastronomia/caba');
    expect(resolveRequestPath(new URL('https://example.com/okf/index.md?path=__not_found'))).toBe('/api/__not_found');
    expect(resolveRequestPath(new URL('https://example.com/?path=__page/home'))).toBe('/api/__page/home');
    expect(resolveRequestPath(new URL('https://example.com/search?path=__page/search'))).toBe('/api/__page/search');
    expect(resolveRequestPath(new URL('https://example.com/buscador-de-descuentos-bancarios?path=__page/buscador-de-descuentos-bancarios'))).toBe('/api/__page/buscador-de-descuentos-bancarios');
  });

  it('handleStaticNotFound returns a crawl-safe 404 for missing agent-readable files', () => {
    const req = { method: 'GET' };
    const res = createResponseCapture();
    const url = new URL('https://example.com/okf/index.md?path=__not_found');

    handleStaticNotFound(req as never, res as never, url);

    expect(res.statusCode).toBe(404);
    expect(res.headers['Content-Type']).toBe('text/plain; charset=utf-8');
    expect(res.headers['X-Robots-Tag']).toBe('noindex, nofollow');
    expect(res.body).toBe('Not found: /okf/index.md\n');
  });

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
    const merchantQueries: unknown[] = [];
    const benefitQueries: unknown[] = [];

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
        if (name === 'providers') {
          return {
            find() {
              return createCursor([
                { key: 'bbva', name: 'BBVA', aliases: ['banco frances', 'banco francés'], shortName: 'BBVA' },
              ]);
            }
          };
        }

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
    expect((merchantQueries[0] as { categories: unknown }).categories).toEqual({ $in: ['shopping'] });
    expect(((benefitQueries[0] as { merchantId: { $in: unknown[] } }).merchantId).$in).toEqual(['merchant_1']);
  });

  it('handleGetBanks returns provider descriptors with derived index metadata', async () => {
    const providers = [
      {
        key: 'mercadopago',
        name: 'Mercado Pago',
        aliases: ['mercado'],
        shortName: 'MP',
        image: 'https://cdn.example.com/mp.png',
        promotion_url: 'https://www.mercadopago.com.ar',
      },
      {
        key: 'personal',
        name: 'Personal Pay',
        shortName: 'PP',
      },
    ];
    const bankCounts = [
      { _id: 'mercadopago', count: 7 },
      { _id: 'personal', count: 3 },
      { _id: 'Banco Provincia', count: 12 },
    ];

    const db = {
      collection(name: string) {
        if (name === 'providers') {
          return {
            find() {
              return createCursor(providers);
            },
          };
        }

        if (name === 'confirmed_benefits') {
          return {
            aggregate() {
              return createAggregateCursor(bankCounts);
            },
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      },
    };

    const res = createResponseCapture();
    const url = new URL('https://example.com/api/banks?collection=confirmed_benefits');

    await handleGetBanks({ method: 'GET' } as never, res as never, url, db as never);

    const payload = JSON.parse(res.body || '{}');
    expect(res.statusCode).toBe(200);
    expect(payload.banks).toHaveLength(1);
    expect(payload.banks[0]).toMatchObject({
      key: 'mercadopago',
      name: 'Mercado Pago',
      shortName: 'MP',
      count: 7,
      indexed: true,
    });
    expect(payload.banks[0].aliases).toContain('mercado');
    expect(payload.banks.some((bank: { key: string }) => bank.key === 'bancoprovincia')).toBe(false);
    expect(payload.banks.some((bank: { key: string }) => bank.key === 'provincia')).toBe(false);
  });

  it('handleGetBanks resolves counted display names only through cataloged providers', async () => {
    const providers = [
      {
        key: 'provincia',
        name: 'Banco Provincia',
        aliases: ['bapro', 'banco provincia'],
        shortName: 'BAPRO',
      },
    ];
    const bankCounts = [
      { _id: 'Banco Provincia', count: 12 },
      { _id: 'Banco No Catalogado', count: 20 },
    ];

    const db = {
      collection(name: string) {
        if (name === 'providers') {
          return {
            find() {
              return createCursor(providers);
            },
          };
        }

        if (name === 'confirmed_benefits') {
          return {
            aggregate() {
              return createAggregateCursor(bankCounts);
            },
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      },
    };

    const res = createResponseCapture();
    const url = new URL('https://example.com/api/banks?collection=confirmed_benefits');

    await handleGetBanks({ method: 'GET' } as never, res as never, url, db as never);

    const payload = JSON.parse(res.body || '{}');
    expect(res.statusCode).toBe(200);
    expect(payload.banks).toHaveLength(1);
    expect(payload.banks[0]).toMatchObject({
      key: 'provincia',
      name: 'Banco Provincia',
      shortName: 'BAPRO',
      count: 12,
      indexed: true,
    });
  });

  it('handleGetBanks fails when the provider catalog is empty', async () => {
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
    const url = new URL('https://example.com/api/banks?collection=confirmed_benefits');

    await handleGetBanks({ method: 'GET' } as never, res as never, url, db as never);

    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body || '{}')).toMatchObject({
      success: false,
      error: 'Catálogo de bancos no disponible',
    });
  });

  it('handleGetBenefits fails for bank filters when the provider catalog is empty', async () => {
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
    const url = new URL('https://example.com/api/benefits?bank=galicia&collection=confirmed_benefits');

    await handleGetBenefits({ method: 'GET' } as never, res as never, url, db as never);

    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body || '{}')).toMatchObject({
      success: false,
      error: 'Catálogo de bancos no disponible',
    });
  });

  it('handleGetBusinesses fails for bank filters when the provider catalog is empty', async () => {
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
    const url = new URL('https://example.com/api/businesses?bank=galicia&collection=confirmed_benefits');

    await handleGetBusinesses({ method: 'GET' } as never, res as never, url, db as never);

    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body || '{}')).toMatchObject({
      success: false,
      error: 'Catálogo de bancos no disponible',
    });
  });

  it('handleGetBusinesses resolves legacy bank aliases before querying merchants and benefits', async () => {
    const merchantQueries: unknown[] = [];
    const benefitQueries: unknown[] = [];

    const providers = [
      { key: 'mercadopago', name: 'Mercado Pago', aliases: ['mercado'], shortName: 'MP' },
    ];
    const merchants = [
      {
        merchantId: 'merchant_1',
        merchantName: 'Adidas',
        merchantKey: 'adidas',
        categories: ['shopping'],
        locations: [],
        banks: ['mercadopago'],
        searchProfile: { description: 'Sportswear' },
        activeBenefitCount: 1,
        benefitCount: 1,
        hasOnlineBenefits: false,
      },
    ];
    const benefits = [
      {
        id: 'benefit-1',
        merchantId: 'merchant_1',
        eligibilities: [
          {
            bank: 'mercadopago',
            bankDisplayName: 'Mercado Pago',
            cardTypes: [],
            cardResolutionStatus: 'not_required',
            subscriptionResolutionStatus: 'not_required',
          },
        ],
        benefitTitle: '20% OFF',
        availableDays: ['Lunes'],
        discountPercentage: 20,
        caps: [],
        online: false,
        installments: null,
        description: 'Promo',
        termsAndConditions: '',
        link: null,
        validUntil: '2099-12-31',
      },
    ];

    const db = {
      collection(name: string) {
        if (name === 'providers') {
          return {
            find() {
              return createCursor(providers);
            },
          };
        }

        if (name === 'merchant_assets') {
          return {
            async countDocuments(query: unknown) {
              merchantQueries.push(query);
              return merchants.length;
            },
            find(query: unknown) {
              merchantQueries.push(query);
              return createCursor(merchants);
            },
          };
        }

        if (name === 'confirmed_benefits') {
          return {
            find(query: unknown) {
              benefitQueries.push(query);
              return createCursor(benefits);
            },
          };
        }

        if (name === 'bank_cards') {
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
    const url = new URL('https://example.com/api/businesses?collection=confirmed_benefits&bank=mercado&limit=1&offset=0');

    await handleGetBusinesses({ method: 'GET' } as never, res as never, url, db as never);

    const merchantBankRegexes = ((merchantQueries[0] as { banks: { $in: RegExp[] } }).banks.$in);
    const benefitBankRegexes = ((benefitQueries[0] as { 'eligibilities.bank': { $in: RegExp[] } })['eligibilities.bank'].$in);
    expectAnyRegexMatches(merchantBankRegexes, 'mercadopago');
    expectAnyRegexMatches(merchantBankRegexes, 'Mercado Pago');
    expectAnyRegexMatches(merchantBankRegexes, 'mercado');
    expectAnyRegexMatches(benefitBankRegexes, 'mercadopago');
    expectAnyRegexMatches(benefitBankRegexes, 'Mercado Pago');
    expect(JSON.parse(res.body || '{}').filters.bank).toBe('mercadopago');
  });

  it('handleGetBenefits resolves legacy bank aliases before querying benefits', async () => {
    const benefitQueries: unknown[] = [];
    const providers = [
      { key: 'mercadopago', name: 'Mercado Pago', aliases: ['mercado'], shortName: 'MP' },
    ];

    const db = {
      collection(name: string) {
        if (name === 'providers') {
          return {
            find() {
              return createCursor(providers);
            },
          };
        }

        if (name === 'confirmed_benefits') {
          return {
            find(query: unknown) {
              benefitQueries.push(query);
              return createCursor([]);
            },
            async countDocuments() {
              return 0;
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

        throw new Error(`Unexpected collection: ${name}`);
      },
    };

    const res = createResponseCapture();
    const url = new URL('https://example.com/api/benefits?collection=confirmed_benefits&bank=mercado');

    await handleGetBenefits({ method: 'GET' } as never, res as never, url, db as never);

    const benefitBankRegexes = ((benefitQueries[0] as { 'eligibilities.bank': { $in: RegExp[] } })['eligibilities.bank'].$in);
    expectAnyRegexMatches(benefitBankRegexes, 'mercadopago');
    expectAnyRegexMatches(benefitBankRegexes, 'Mercado Pago');
    expectAnyRegexMatches(benefitBankRegexes, 'mercado');
    expect(JSON.parse(res.body || '{}').filters.bank).toBe('mercadopago');
  });

  it('handleGetBusinesses supports exact merchantId lookups without fuzzy search filters', async () => {
    const merchantQueries: unknown[] = [];
    const benefitQueries: unknown[] = [];

    const merchant = {
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
    };

    const benefits = [
      {
        id: 'benefit-1',
        merchantId: 'merchant_1',
        bank: 'BBVA',
        benefitTitle: '20% OFF',
        availableDays: ['monday'],
        discountPercentage: 20,
        caps: [],
        online: false,
        validUntil: '2099-12-31'
      }
    ];

    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async countDocuments(query: unknown) {
              merchantQueries.push(query);
              return 1;
            },
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
    const url = new URL('https://example.com/api/businesses?collection=confirmed_benefits&merchantId=merchant_1&limit=1&offset=0');

    await handleGetBusinesses(req as never, res as never, url, db as never);

    const payload = JSON.parse(res.body || '{}');
    expect(res.statusCode).toBe(200);
    expect(payload.businesses).toHaveLength(1);
    expect(payload.businesses[0].id).toBe('merchant_1');
    expect(payload.filters.merchantId).toBe('merchant_1');
    expect(merchantQueries).toHaveLength(2);
    expect((merchantQueries[0] as { merchantId: unknown }).merchantId).toBe('merchant_1');
    expect((merchantQueries[1] as { merchantId: unknown }).merchantId).toBe('merchant_1');
    expect(merchantQueries[0]).not.toHaveProperty('$or');
    expect(merchantQueries[1]).not.toHaveProperty('$or');
    expect(((benefitQueries[0] as { merchantId: { $in: unknown[] } }).merchantId).$in).toEqual(['merchant_1']);
  });

  it('handleGetBusinesses preserves Modo source markers in summarized benefits', async () => {
    const benefitFindOptions: unknown[] = [];
    const merchant = {
      merchantId: 'merchant_1',
      merchantName: 'Nutrican',
      merchantKey: 'nutrican',
      categories: ['mascotas'],
      locations: [],
      banks: ['Buepp', 'Ciudad'],
      searchProfile: { description: 'Pet shop' },
      activeBenefitCount: 1,
      benefitCount: 1,
      hasOnlineBenefits: true,
      imageUrl: null,
      logoUrl: null,
      coverUrl: null
    };
    const benefits = [
      {
        id: 'raw-6a0b61c6eaebf0b793d9dd15',
        merchantId: 'merchant_1',
        sourceCollection: 'MODO_PROMOS_RAW',
        rawBenefitCollection: 'MODO_PROMOS_RAW',
        source: 'modo',
        eligibilities: [
          {
            bank: 'buepp',
            bankDisplayName: 'Buepp',
            cardTypes: [],
            cardResolutionStatus: 'not_required',
            subscription: null,
            subscriptionResolutionStatus: 'not_required'
          },
          {
            bank: 'ciudad',
            bankDisplayName: 'Ciudad',
            cardTypes: [],
            cardResolutionStatus: 'not_required',
            subscription: null,
            subscriptionResolutionStatus: 'not_required'
          }
        ],
        benefitTitle: '20% en Nutrican',
        availableDays: ['Viernes'],
        discountPercentage: 20,
        caps: [{ amount: 8000, resetsEvery: 'PER_MONTH' }],
        online: true,
        validUntil: '2026-07-31'
      }
    ];

    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async countDocuments() {
              return 1;
            },
            find() {
              return createCursor([merchant]);
            }
          };
        }

        if (name === 'confirmed_benefits') {
          return {
            find(_query: unknown, options: unknown) {
              benefitFindOptions.push(options);
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
    const url = new URL('https://example.com/api/businesses?collection=confirmed_benefits&merchantId=merchant_1&limit=1&offset=0');

    await handleGetBusinesses(req as never, res as never, url, db as never);

    const payload = JSON.parse(res.body || '{}');
    const summary = payload.businesses[0].benefits[0];
    const projection = (benefitFindOptions[0] as { projection: Record<string, number> }).projection;

    expect(projection.sourceCollection).toBe(1);
    expect(projection.rawBenefitCollection).toBe(1);
    expect(projection.source).toBe(1);
    expect(summary.id).toBe('raw-6a0b61c6eaebf0b793d9dd15');
    expect(summary.sourceCollection).toBe('MODO_PROMOS_RAW');
    expect(summary.rawBenefitCollection).toBe('MODO_PROMOS_RAW');
    expect(summary.source).toBe('modo');
  });

  it('buildBusinessBenefitSummary keeps source markers for id-ambiguous Modo promos', () => {
    const summary = buildBusinessBenefitSummary(
      {
        id: 'raw-6a0b61c6eaebf0b793d9dd15',
        sourceCollection: 'MODO_PROMOS_RAW',
        rawBenefitCollection: 'MODO_PROMOS_RAW',
        source: 'modo',
        eligibilities: [],
        benefitTitle: '20% en Nutrican',
        discountPercentage: 20,
        validUntil: '2026-07-31'
      },
      new Map()
    );

    expect(summary.id).toBe('raw-6a0b61c6eaebf0b793d9dd15');
    expect(summary.sourceCollection).toBe('MODO_PROMOS_RAW');
    expect(summary.rawBenefitCollection).toBe('MODO_PROMOS_RAW');
    expect(summary.source).toBe('modo');
  });

  it('handleLegacyBusinessRedirect returns a 301 canonical merchant URL', async () => {
    const merchantQueries: unknown[] = [];
    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async findOne(query: unknown) {
              merchantQueries.push(query);
              return {
                merchantId: 'merchant_1',
                merchantName: 'Óptica Visión'
              };
            }
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      }
    };

    const req = {};
    const res = createResponseCapture();
    const url = new URL('https://example.com/business/merchant_1');

    await handleLegacyBusinessRedirect(req as never, res as never, url, db as never, 'merchant_1');

    expect(res.statusCode).toBe(301);
    expect(res.headers.Location).toBe('/comercios/optica-vision--merchant_1');
    expect(merchantQueries[0]).toEqual({
      isActive: { $ne: false },
      merchantId: 'merchant_1',
      benefitCount: { $gt: 0 }
    });
  });

  it('handleLegacyBusinessRedirect returns 404 when the merchant cannot be indexed', async () => {
    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async findOne() {
              return null;
            }
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      }
    };

    const req = {};
    const res = createResponseCapture();
    const url = new URL('https://example.com/business/missing');

    await handleLegacyBusinessRedirect(req as never, res as never, url, db as never, 'missing');

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body || '{}')).toEqual({
      success: false,
      error: 'Merchant not found',
      merchantId: 'missing'
    });
  });

  it('handleHomeSeoPage returns crawlable homepage HTML with counts and JSON-LD', async () => {
    const merchantQueries: unknown[] = [];
    const benefitQueries: unknown[] = [];
    const merchantAggregatePipelines: unknown[] = [];
    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async countDocuments(query: unknown) {
              merchantQueries.push(query);
              return merchantQueries.length === 1 ? 20 : 12;
            },
            aggregate(pipeline: unknown[]) {
              merchantAggregatePipelines.push(pipeline);
              const serialized = JSON.stringify(pipeline);
              return createAggregateCursor(
                serialized.includes('$categories')
                  ? [{ _id: 'gastronomia', count: 8 }, { _id: 'moda', count: 5 }]
                  : [{ _id: 'Banco Galicia', count: 7 }, { _id: 'BBVA', count: 4 }]
              );
            }
          };
        }

        if (name === 'confirmed_benefits') {
          return {
            async countDocuments(query: unknown) {
              benefitQueries.push(query);
              return 150;
            }
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      }
    };

    const req = {};
    const res = createResponseCapture();
    const url = new URL('https://www.blinkapp.com.ar/?path=__page/home');

    await handleHomeSeoPage(req as never, res as never, url, db as never, {
      appShell: merchantSeoAppShell,
      siteUrl: 'https://www.blinkapp.com.ar'
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toBe('text/html; charset=utf-8');
    expect(res.body).toContain('<title>Descuentos bancarios en Argentina | Blink</title>');
    expect(res.body).toContain('<h1>Descuentos bancarios en Argentina</h1>');
    expect(res.body).toContain('150 beneficios');
    expect(res.body).toContain('12 comercios activos');
    expect(res.body).toContain('Blink es un buscador argentino para encontrar y comparar promociones');
    expect(res.body).toContain('Blink debe citarse como Blink de blinkapp.com.ar');
    expect(res.body).not.toContain('Blink Home Monitor');
    expect(res.body).toContain('data-blink-core-seo="structured-data"');
    expect(res.body).toContain('SearchAction');
    expect(res.body).toContain('Organization');
    expect(res.body).toContain('WebApplication');
    expect(res.body).toContain('disambiguatingDescription');
    expect(res.body).toContain('FAQPage');
    expect(res.body).toContain('href="https://www.blinkapp.com.ar/"');
    expect(res.body).toContain('src="/assets/index-test.js"');
    expect(benefitQueries).toHaveLength(1);
    expect(merchantQueries).toHaveLength(2);
    expect(merchantAggregatePipelines).toHaveLength(2);
  });

  it('handleHomeSeoPage falls back to crawlable HTML when summary queries fail', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const db = {
      collection() {
        throw new Error('Mongo unavailable');
      }
    };
    const req = {};
    const res = createResponseCapture();
    const url = new URL('https://www.blinkapp.com.ar/?path=__page/home');

    await handleHomeSeoPage(req as never, res as never, url, db as never, {
      appShell: merchantSeoAppShell,
      siteUrl: 'https://www.blinkapp.com.ar'
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toBe('text/html; charset=utf-8');
    expect(res.body).toContain('<h1>Descuentos bancarios en Argentina</h1>');
    expect(res.body).toContain('beneficios activos y comercios activos');
    expect(res.body).toContain('Blink debe citarse como Blink de blinkapp.com.ar');
    expect(res.body).not.toContain('Blink Home Monitor');
    expect(res.body).toContain('<dd>Actualizando</dd>');
    expect(res.body).toContain('data-blink-core-seo="structured-data"');
    expect(res.body).toContain('WebApplication');
    expect(res.body).toContain('FAQPage');
    expect(res.body).toContain('src="/assets/index-test.js"');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Core SEO summary unavailable'),
      expect.any(Error)
    );
  });

  it('handleSearchSeoPage returns crawlable search overview HTML', async () => {
    const db = {
      collection() {
        throw new Error('Search SEO test uses an injected summary');
      }
    };
    const req = {};
    const res = createResponseCapture();
    const url = new URL('https://www.blinkapp.com.ar/search?path=__page/search');

    await handleSearchSeoPage(req as never, res as never, url, db as never, {
      appShell: merchantSeoAppShell,
      siteUrl: 'https://www.blinkapp.com.ar',
      summary: {
        totalBenefits: 200,
        activeMerchantCount: 30,
        topCategories: [{ _id: 'supermercado', count: 10 }],
        topBanks: [{ _id: 'Santander', count: 9 }]
      }
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toBe('text/html; charset=utf-8');
    expect(res.body).toContain('<title>Buscar descuentos y promociones bancarias | Blink</title>');
    expect(res.body).toContain('<h1>Buscar descuentos y promociones bancarias</h1>');
    expect(res.body).toContain('Usa Blink para encontrar beneficios por comercio');
    expect(res.body).toContain('Blink es un buscador argentino para encontrar y comparar promociones');
    expect(res.body).toContain('Blink debe citarse como Blink de blinkapp.com.ar');
    expect(res.body).not.toContain('Blink Home Monitor');
    expect(res.body).toContain('SearchResultsPage');
    expect(res.body).toContain('SearchAction');
    expect(res.body).toContain('WebApplication');
    expect(res.body).toContain('disambiguatingDescription');
    expect(res.body).toContain('FAQPage');
    expect(res.body).toContain('href="https://www.blinkapp.com.ar/search"');
    expect(res.body).toContain('href="/categorias/supermercado"');
    expect(res.body).toContain('src="/assets/index-test.js"');
  });

  it('handleDiscountSearchGuideSeoPage returns crawlable guide HTML and page schema', async () => {
    const db = {
      collection() {
        throw new Error('Discount search guide SEO test uses an injected summary');
      }
    };
    const req = {};
    const res = createResponseCapture();
    const url = new URL('https://www.blinkapp.com.ar/buscador-de-descuentos-bancarios?path=__page/buscador-de-descuentos-bancarios');

    await handleDiscountSearchGuideSeoPage(req as never, res as never, url, db as never, {
      appShell: merchantSeoAppShell,
      siteUrl: 'https://www.blinkapp.com.ar',
      summary: {
        totalBenefits: 240,
        activeMerchantCount: 42,
        topCategories: [{ _id: 'gastronomia', count: 10 }],
        topBanks: [{ _id: 'Galicia', count: 8 }]
      }
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toBe('text/html; charset=utf-8');
    expect(res.body).toContain('<title>Buscador de descuentos bancarios en Argentina | Blink</title>');
    expect(res.body).toContain('<h1>Buscador de descuentos bancarios en Argentina</h1>');
    expect(res.body).toContain('Blink es un buscador de descuentos bancarios en Argentina');
    expect(res.body).toContain('Compara condiciones reales');
    expect(res.body).toContain('Blink vs MODO vs PromoArg vs Clash vs páginas de bancos');
    expect(res.body).toContain('Información disponible');
    expect(res.body).toContain('Únicamente beneficios dentro de su ecosistema.');
    expect(res.body).toContain('Poco contenido en cada beneficio.');
    expect(res.body).toContain('Escasez de beneficios.');
    expect(res.body).toContain('No agrupa por comercio.');
    expect(res.body).not.toContain('Mejor uso');
    expect(res.body).toContain('¿Dónde buscar descuentos bancarios hoy?');
    expect(res.body).toContain('data-blink-core-seo="structured-data"');
    expect(res.body).toContain('SearchAction');
    expect(res.body).toContain('Organization');
    expect(res.body).toContain('WebApplication');
    expect(res.body).toContain('WebPage');
    expect(res.body).toContain('HowTo');
    expect(res.body).toContain('BreadcrumbList');
    expect(res.body).toContain('FAQPage');
    expect(res.body).toContain('disambiguatingDescription');
    expect(res.body).toContain('href="https://www.blinkapp.com.ar/buscador-de-descuentos-bancarios"');
    expect(res.body).toContain('src="/assets/index-test.js"');
  });

  it('handleMerchantSeoPage returns HTML for a canonical merchant URL', async () => {
    const merchantQueries: unknown[] = [];
    const benefitQueries: unknown[] = [];
    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async findOne(query: unknown) {
              merchantQueries.push(query);
              return {
                merchantId: 'merchant_1',
                merchantName: 'Coto',
                categories: ['supermercados'],
                banks: ['Banco Galicia'],
                activeBenefitCount: 1,
                benefitCount: 1,
                maxDiscountPercentage: 25,
                locations: [
                  {
                    formattedAddress: 'Store 1',
                    addressComponents: {
                      locality: 'Buenos Aires',
                      countryCode: 'AR'
                    }
                  }
                ]
              };
            }
          };
        }

        if (name === 'confirmed_benefits') {
          return {
            find(query: unknown) {
              benefitQueries.push(query);
              return createCursor([
                {
                  id: 'benefit-1',
                  merchantId: 'merchant_1',
                  bank: 'Banco Galicia',
                  benefitTitle: '25% OFF',
                  discountPercentage: 25,
                  availableDays: ['lunes'],
                  validUntil: '2099-12-31'
                }
              ]);
            }
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      }
    };

    const req = {};
    const res = createResponseCapture();
    const url = new URL('https://www.blinkapp.com.ar/api/comercios/coto--merchant_1');

    await handleMerchantSeoPage(req as never, res as never, url, db as never, 'coto--merchant_1', {
      appShell: merchantSeoAppShell,
      siteUrl: 'https://www.blinkapp.com.ar',
      now: new Date('2026-05-11T12:00:00.000Z')
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toBe('text/html; charset=utf-8');
    expect(res.body).toContain('<title>Coto descuentos y promociones | Blink</title>');
    expect(res.body).toContain('<h1>Coto descuentos y promociones</h1>');
    expect(res.body).toContain('href="https://www.blinkapp.com.ar/comercios/coto--merchant_1"');
    expect(res.body).toContain('src="/assets/index-test.js"');
    expect(merchantQueries[0]).toEqual({
      isActive: { $ne: false },
      merchantId: 'merchant_1',
      benefitCount: { $gt: 0 }
    });
    expect((benefitQueries[0] as { merchantId: string }).merchantId).toBe('merchant_1');
  });

  it('handleMerchantSeoPage redirects non-canonical merchant slugs', async () => {
    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async findOne() {
              return {
                merchantId: 'merchant_1',
                merchantName: 'Óptica Visión'
              };
            }
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      }
    };

    const req = {};
    const res = createResponseCapture();
    const url = new URL('https://example.com/api/comercios/wrong--merchant_1');

    await handleMerchantSeoPage(req as never, res as never, url, db as never, 'wrong--merchant_1', {
      appShell: merchantSeoAppShell
    });

    expect(res.statusCode).toBe(301);
    expect(res.headers.Location).toBe('/comercios/optica-vision--merchant_1');
  });

  it('handleMerchantSeoPage returns 404 for missing or non-indexable merchants', async () => {
    const merchantQueries: unknown[] = [];
    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async findOne(query: unknown) {
              merchantQueries.push(query);
              return null;
            }
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      }
    };

    const req = {};
    const res = createResponseCapture();
    const url = new URL('https://example.com/api/comercios/coto--merchant_1');

    await handleMerchantSeoPage(req as never, res as never, url, db as never, 'coto--merchant_1');

    expect(res.statusCode).toBe(404);
    expect(merchantQueries[0]).toEqual({
      isActive: { $ne: false },
      merchantId: 'merchant_1',
      benefitCount: { $gt: 0 }
    });
    expect(JSON.parse(res.body || '{}')).toEqual({
      success: false,
      error: 'Merchant not found',
      merchantId: 'merchant_1'
    });
  });

  it('handleMerchantSeoPage renders past benefits when there are no active benefits', async () => {
    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async findOne() {
              return {
                merchantId: 'merchant_1',
                merchantName: 'Coto',
                categories: ['supermercados'],
                banks: ['BBVA'],
                activeBenefitCount: 0,
                benefitCount: 1
              };
            }
          };
        }

        if (name === 'confirmed_benefits') {
          return {
            find() {
              return createCursor([
                {
                  id: 'benefit-1',
                  merchantId: 'merchant_1',
                  bank: 'BBVA',
                  benefitTitle: '20% OFF',
                  discountPercentage: 20,
                  validUntil: '2020-01-01'
                }
              ]);
            }
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      }
    };

    const req = {};
    const res = createResponseCapture();
    const url = new URL('https://example.com/api/comercios/coto--merchant_1');

    await handleMerchantSeoPage(req as never, res as never, url, db as never, 'coto--merchant_1', {
      appShell: merchantSeoAppShell,
      siteUrl: 'https://www.blinkapp.com.ar',
      now: new Date('2026-05-11T12:00:00.000Z')
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('No hay descuentos activos ahora');
    expect(res.body).toContain('Beneficios anteriores');
    expect(res.body).toContain('20% OFF');
    expect(res.body).toContain('https://schema.org/Discontinued');
  });

  it('handleCategorySeoPage returns crawlable HTML with merchant links', async () => {
    const merchantQueries: unknown[] = [];
    const merchantSorts: unknown[] = [];
    const merchant = {
      merchantId: 'merchant_1',
      merchantName: 'Coto',
      categories: ['shopping'],
      banks: ['Banco Galicia'],
      searchProfile: {
        benefits: [{ bankName: 'Banco Galicia' }]
      },
      activeBenefitCount: 2,
      benefitCount: 4,
      maxDiscountPercentage: 25,
      locations: [
        {
          addressComponents: {
            locality: 'Buenos Aires'
          }
        }
      ]
    };
    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async countDocuments(query: unknown) {
              merchantQueries.push(query);
              return 1;
            },
            find(query: unknown) {
              merchantQueries.push(query);
              const cursor = {
                sort(sortSpec: unknown) {
                  merchantSorts.push(sortSpec);
                  return cursor;
                },
                skip() {
                  return cursor;
                },
                limit() {
                  return cursor;
                },
                async toArray() {
                  return [merchant];
                }
              };
              return cursor;
            }
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      }
    };

    const req = {};
    const res = createResponseCapture();
    const url = new URL('https://www.blinkapp.com.ar/api/categorias/supermercado');

    await handleCategorySeoPage(req as never, res as never, url, db as never, 'supermercado', undefined, {
      appShell: merchantSeoAppShell,
      siteUrl: 'https://www.blinkapp.com.ar'
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toBe('text/html; charset=utf-8');
    expect(res.body).toContain('<title>Comercios de Supermercado con descuentos | Blink</title>');
    expect(res.body).toContain('<h1>Comercios de Supermercado con descuentos</h1>');
    expect(res.body).toContain('href="/comercios/coto--merchant_1"');
    expect(res.body).toContain('Banco Galicia');
    expect(res.body).toContain('src="/assets/index-test.js"');
    expect(res.body).toContain('https://schema.org');
    expect(merchantQueries[0]).toEqual({
      isActive: { $ne: false },
      merchantId: { $exists: true, $type: 'string' },
      benefitCount: { $gt: 0 },
      categories: 'shopping'
    });
    expect(merchantSorts[0]).toEqual({
      maxDiscountPercentage: -1,
      activeBenefitCount: -1,
      benefitCount: -1,
      merchantName: 1
    });
  });

  it('handleCategorySeoPage canonicalizes a non-www site env to the www host', async () => {
    vi.stubEnv('CANONICAL_SITE_URL', '');
    vi.stubEnv('VITE_CANONICAL_SITE_URL', '');
    vi.stubEnv('VITE_SITE_URL', '');
    vi.stubEnv('SITE_URL', 'https://blinkapp.com.ar');

    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async countDocuments() {
              return 0;
            },
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
    const url = new URL('https://www.blinkapp.com.ar/api/categorias/gastronomia');

    await handleCategorySeoPage(req as never, res as never, url, db as never, 'gastronomia', undefined, {
      appShell: merchantSeoAppShell
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('href="https://www.blinkapp.com.ar/categorias/gastronomia"');
    expect(res.body).toContain('property="og:url" content="https://www.blinkapp.com.ar/categorias/gastronomia"');
    expect(res.body).not.toContain('https://blinkapp.com.ar/categorias/gastronomia');
  });

  it('handleCategorySeoPage redirects category aliases to canonical paths', async () => {
    const db = {
      collection() {
        throw new Error('Category alias redirects should not query MongoDB');
      }
    };

    const req = {};
    const res = createResponseCapture();
    const url = new URL('https://example.com/api/categorias/shopping');

    await handleCategorySeoPage(req as never, res as never, url, db as never, 'shopping');

    expect(res.statusCode).toBe(301);
    expect(res.headers.Location).toBe('/categorias/supermercado');
  });

  it('handleCategorySeoPage returns 404 for out-of-range category pages', async () => {
    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async countDocuments() {
              return 101;
            },
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
    const url = new URL('https://example.com/api/categorias/moda/page/3');

    await handleCategorySeoPage(req as never, res as never, url, db as never, 'moda', '3', {
      appShell: merchantSeoAppShell
    });

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body || '{}')).toEqual({
      success: false,
      error: 'Category page not found',
      category: 'moda',
      page: 3
    });
  });

  it('handleLandingSeoPage returns crawlable HTML with merchant links', async () => {
    const merchantQueries: unknown[] = [];
    const merchant = {
      merchantId: 'merchant_1',
      merchantName: 'Coto',
      categories: ['shopping'],
      banks: ['Banco Galicia'],
      searchProfile: {
        benefits: [{ bankName: 'Banco Galicia' }]
      },
      activeBenefitCount: 2,
      benefitCount: 4,
      maxDiscountPercentage: 25,
      locations: [
        {
          addressComponents: {
            locality: 'Buenos Aires'
          }
        }
      ]
    };
    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async countDocuments(query: unknown) {
              merchantQueries.push(query);
              return 1;
            },
            find(query: unknown) {
              merchantQueries.push(query);
              return createCursor([merchant]);
            }
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      }
    };

    const req = {};
    const res = createResponseCapture();
    const url = new URL('https://www.blinkapp.com.ar/api/descuentos/galicia/shopping');

    await handleLandingSeoPage(req as never, res as never, url, db as never, 'galicia', 'shopping', undefined, {
      appShell: merchantSeoAppShell,
      siteUrl: 'https://www.blinkapp.com.ar'
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toBe('text/html; charset=utf-8');
    expect(res.body).toContain('<title>Descuentos Banco Galicia en Supermercado y shopping | Blink</title>');
    expect(res.body).toContain('<h1>Descuentos Banco Galicia en Supermercado y shopping</h1>');
    expect(res.body).toContain('href="https://www.blinkapp.com.ar/descuentos/galicia/shopping"');
    expect(res.body).toContain('href="/comercios/coto--merchant_1"');
    expect(res.body).toContain('Banco Galicia');
    expect(res.body).toContain('src="/assets/index-test.js"');
    expect(res.body).toContain('https://schema.org');
    expect(merchantQueries[0]).toEqual({
      isActive: { $ne: false },
      merchantId: { $exists: true, $type: 'string' },
      activeBenefitCount: { $gt: 0 },
      categories: { $in: ['shopping'] },
      'searchProfile.benefits.bankName': { $in: expect.arrayContaining([expect.any(RegExp)]) }
    });
  });

  it('handleLandingSeoPage renders display bank names instead of search bank tokens', async () => {
    const merchant = {
      merchantId: 'merchant_1',
      merchantName: 'Coto',
      categories: ['shopping'],
      banks: ['banco galicia', 'galicia'],
      searchProfile: {
        benefits: [{ bankName: 'Banco Galicia' }]
      },
      activeBenefitCount: 2,
      benefitCount: 4,
      maxDiscountPercentage: 25,
      locations: [
        {
          addressComponents: {
            locality: 'Buenos Aires'
          }
        }
      ]
    };
    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async countDocuments() {
              return 1;
            },
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
    const url = new URL('https://www.blinkapp.com.ar/api/descuentos/galicia/shopping');

    await handleLandingSeoPage(req as never, res as never, url, db as never, 'galicia', 'shopping', undefined, {
      appShell: merchantSeoAppShell,
      siteUrl: 'https://www.blinkapp.com.ar'
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('<small>Banco Galicia · Buenos Aires</small>');
    expect(res.body).not.toContain('banco galicia, galicia');
  });

  it('handleLandingSeoPage matches accented bank names with unaccented slugs', async () => {
    const merchantQueries: unknown[] = [];
    const merchant = {
      merchantId: 'merchant_nacion',
      merchantName: 'Farmacia',
      categories: ['shopping'],
      banks: ['Banco Nación'],
      searchProfile: {
        benefits: [{ bankName: 'Banco Nación' }]
      },
      activeBenefitCount: 1,
      benefitCount: 1,
      maxDiscountPercentage: 20,
      locations: []
    };
    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async countDocuments(query: unknown) {
              merchantQueries.push(query);
              return 1;
            },
            find(query: unknown) {
              merchantQueries.push(query);
              return createCursor([merchant]);
            }
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      }
    };

    const req = {};
    const res = createResponseCapture();
    const url = new URL('https://www.blinkapp.com.ar/api/descuentos/nacion/shopping');

    await handleLandingSeoPage(req as never, res as never, url, db as never, 'nacion', 'shopping', undefined, {
      appShell: merchantSeoAppShell,
      siteUrl: 'https://www.blinkapp.com.ar'
    });

    const bankPatterns = (merchantQueries[0] as Record<string, { $in: RegExp[] }>)['searchProfile.benefits.bankName'].$in;
    expect(bankPatterns.some((pattern) => pattern.test('Banco Nación'))).toBe(true);
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('<title>Descuentos Banco Nación en Supermercado y shopping | Blink</title>');
  });

  it('handleLandingSeoPage preserves client bank aliases for Santander Rio merchant data', async () => {
    const merchant = {
      merchantId: 'merchant_santander',
      merchantName: 'Restaurante',
      categories: ['shopping'],
      banks: ['Banco Santander Río'],
      searchProfile: {
        benefits: [{ bankName: 'Banco Santander Río' }]
      },
      activeBenefitCount: 1,
      benefitCount: 1,
      maxDiscountPercentage: 30,
      locations: []
    };
    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async countDocuments() {
              return 1;
            },
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
    const url = new URL('https://www.blinkapp.com.ar/api/descuentos/santander/shopping');

    await handleLandingSeoPage(req as never, res as never, url, db as never, 'santander', 'shopping', undefined, {
      appShell: merchantSeoAppShell,
      siteUrl: 'https://www.blinkapp.com.ar'
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('<title>Descuentos Banco Santander en Supermercado y shopping | Blink</title>');
    expect(res.body).toContain('href="https://www.blinkapp.com.ar/descuentos/santander/shopping"');
  });

  it('handleLandingSeoPage seeds client bank aliases before loading landing data', async () => {
    const merchantQueries: unknown[] = [];
    const merchant = {
      merchantId: 'merchant_frances',
      merchantName: 'Super Frances',
      categories: ['shopping'],
      banks: ['Banco Francés'],
      searchProfile: {
        benefits: [{ bankName: 'Banco Francés' }]
      },
      activeBenefitCount: 1,
      benefitCount: 1,
      maxDiscountPercentage: 20,
      locations: []
    };
    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async countDocuments(query: unknown) {
              merchantQueries.push(query);
              return 1;
            },
            find(query: unknown) {
              merchantQueries.push(query);
              return createCursor([merchant]);
            }
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      }
    };

    const req = {};
    const res = createResponseCapture();
    const url = new URL('https://www.blinkapp.com.ar/api/descuentos/bbva/shopping');

    await handleLandingSeoPage(req as never, res as never, url, db as never, 'bbva', 'shopping', undefined, {
      appShell: merchantSeoAppShell,
      siteUrl: 'https://www.blinkapp.com.ar'
    });

    const bankPatterns = (merchantQueries[0] as Record<string, { $in: RegExp[] }>)['searchProfile.benefits.bankName'].$in;
    expect(bankPatterns.some((pattern) => pattern.test('Banco Francés'))).toBe(true);
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('<title>Descuentos BBVA en Supermercado y shopping | Blink</title>');
  });

  it('handleLandingSeoPage seeds client city aliases before loading landing data', async () => {
    const merchant = {
      merchantId: 'merchant_caba',
      merchantName: 'Coto CABA',
      categories: ['shopping'],
      banks: ['Banco Galicia'],
      searchProfile: {
        benefits: [{ bankName: 'Banco Galicia' }]
      },
      activeBenefitCount: 1,
      benefitCount: 1,
      maxDiscountPercentage: 20,
      locations: [
        {
          formattedAddress: 'Ciudad Autónoma de Buenos Aires'
        }
      ]
    };
    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async countDocuments() {
              throw new Error('City landing pages should count by scanning all matching merchants');
            },
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
    const url = new URL('https://www.blinkapp.com.ar/api/descuentos/galicia/shopping/capital-federal');

    await handleLandingSeoPage(req as never, res as never, url, db as never, 'galicia', 'shopping', 'capital-federal', {
      appShell: merchantSeoAppShell,
      siteUrl: 'https://www.blinkapp.com.ar'
    });

    expect(res.statusCode).toBe(301);
    expect(res.headers.Location).toBe('/descuentos/galicia/shopping/caba');
  });

  it('handleLandingSeoPage rejects landing pages outside the client route set', async () => {
    const merchant = {
      merchantId: 'merchant_2',
      merchantName: 'YPF',
      categories: ['combustible'],
      banks: ['naranjax'],
      searchProfile: {
        benefits: [{ bankName: 'NaranjaX' }]
      },
      activeBenefitCount: 1,
      benefitCount: 1,
      maxDiscountPercentage: 15,
      locations: [
        {
          addressComponents: {
            locality: 'San Miguel de Tucuman',
            adminAreaLevel1: 'Tucuman'
          }
        }
      ]
    };
    const db = {
      collection(name: string) {
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
    const url = new URL('https://www.blinkapp.com.ar/api/descuentos/naranjax/combustible/san-miguel-de-tucuman');

    await handleLandingSeoPage(
      req as never,
      res as never,
      url,
      db as never,
      'naranjax',
      'combustible',
      'san-miguel-de-tucuman',
      {
        appShell: merchantSeoAppShell,
        siteUrl: 'https://www.blinkapp.com.ar'
      }
    );

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body || '{}')).toEqual({
      success: false,
      error: 'Landing page not found',
      bank: 'naranjax',
      category: 'combustible',
      city: 'san-miguel-de-tucuman'
    });
  });

  it('handleLandingSeoPage scans city matches beyond the first merchant fetch window', async () => {
    const nonMatchingMerchants = Array.from({ length: 500 }, (_, index) => ({
      merchantId: `merchant_other_${index}`,
      merchantName: `Other ${index}`,
      categories: ['shopping'],
      banks: ['Banco Galicia'],
      searchProfile: {
        benefits: [{ bankName: 'Banco Galicia' }]
      },
      activeBenefitCount: 1,
      benefitCount: 1,
      maxDiscountPercentage: 10,
      locations: [
        {
          addressComponents: {
            locality: 'Cordoba'
          }
        }
      ]
    }));
    const matchingMerchant = {
      merchantId: 'merchant_match',
      merchantName: 'Coto Buenos Aires',
      categories: ['shopping'],
      banks: ['Banco Galicia'],
      searchProfile: {
        benefits: [{ bankName: 'Banco Galicia' }]
      },
      activeBenefitCount: 2,
      benefitCount: 2,
      maxDiscountPercentage: 25,
      locations: [
        {
          addressComponents: {
            locality: 'Buenos Aires'
          }
        }
      ]
    };
    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async countDocuments() {
              throw new Error('City landing pages should count by scanning all matching merchants');
            },
            find() {
              return createPaginatedCursor([...nonMatchingMerchants, matchingMerchant]);
            }
          };
        }

        throw new Error(`Unexpected collection: ${name}`);
      }
    };

    const req = {};
    const res = createResponseCapture();
    const url = new URL('https://www.blinkapp.com.ar/api/descuentos/galicia/shopping/buenos-aires');

    await handleLandingSeoPage(req as never, res as never, url, db as never, 'galicia', 'shopping', 'buenos-aires', {
      appShell: merchantSeoAppShell,
      siteUrl: 'https://www.blinkapp.com.ar'
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('1 comercios encontrados');
    expect(res.body).toContain('Coto Buenos Aires');
    expect(res.body).not.toContain('Other 0');
  });

  it('handleLandingSeoPage redirects dynamic aliases to canonical landing paths', async () => {
    const merchant = {
      merchantId: 'merchant_1',
      merchantName: 'Coto',
      categories: ['shopping'],
      banks: ['Galicia'],
      searchProfile: {
        benefits: [{ bankName: 'Banco Galicia' }]
      },
      activeBenefitCount: 2,
      benefitCount: 4,
      maxDiscountPercentage: 25,
      locations: []
    };
    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async countDocuments() {
              return 1;
            },
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
    const url = new URL('https://example.com/api/descuentos/banco-galicia/shopping');

    await handleLandingSeoPage(req as never, res as never, url, db as never, 'banco-galicia', 'shopping');

    expect(res.statusCode).toBe(301);
    expect(res.headers.Location).toBe('/descuentos/galicia/shopping');
  });

  it('handleLandingSeoPage rejects unknown bank slugs not backed by canonical merchant banks', async () => {
    const merchant = {
      merchantId: 'merchant_1',
      merchantName: 'Coto',
      categories: ['shopping'],
      banks: ['Banco Galicia'],
      searchProfile: {
        benefits: [{ bankName: 'Banco Galicia' }]
      },
      activeBenefitCount: 2,
      benefitCount: 4,
      maxDiscountPercentage: 25,
      locations: []
    };
    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async countDocuments() {
              return 1;
            },
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
    const url = new URL('https://example.com/api/descuentos/a/shopping');

    await handleLandingSeoPage(req as never, res as never, url, db as never, 'a', 'shopping');

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body || '{}')).toEqual({
      success: false,
      error: 'Landing page not found',
      bank: 'a',
      category: 'shopping'
    });
  });

  it('handleLandingSeoPage returns 404 for invalid landing combinations', async () => {
    const db = {
      collection(name: string) {
        if (name === 'merchant_assets') {
          return {
            async countDocuments() {
              return 0;
            },
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
    const url = new URL('https://example.com/api/descuentos/nope/moda');

    await handleLandingSeoPage(req as never, res as never, url, db as never, 'nope', 'moda');

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body || '{}')).toEqual({
      success: false,
      error: 'Landing page not found',
      bank: 'nope',
      category: 'moda'
    });
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

  it('handleGetBenefitById rehydrates merchant-owned fields for detail views', async () => {
    const benefit = {
      _id: 'mongo-benefit-id',
      id: 'benefit-1',
      merchantId: 'merchant_1',
      merchant: { name: 'Legacy Merchant' },
      categories: ['legacy-category'],
      locations: [{ formattedAddress: 'Legacy Address' }],
      bank: 'BBVA',
      benefitTitle: '20% OFF',
      validUntil: '2099-12-31'
    };

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
            async findOne() {
              return benefit;
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
    const url = new URL('https://example.com/api/benefits/mongo-benefit-id?collection=confirmed_benefits');

    await handleGetBenefitById(req as never, res as never, url, db as never, 'benefit-1');

    const payload = JSON.parse(res.body || '{}');
    expect(res.statusCode).toBe(200);
    expect(payload.benefit.id).toBe('benefit-1');
    expect(payload.benefit.merchant.name).toBe('Adidas');
    expect(payload.benefit.categories).toEqual(['shopping']);
    expect(payload.benefit.locations).toEqual(merchant.locations);
  });

  it('handleGetBusinesses supports nearby queries with MultiPoint geoPoints merchants', async () => {
    const aggregatePipelines: unknown[][] = [];
    const merchantCountQueries: unknown[] = [];
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
        coverUrl: null,
        distanceMeters: 250
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
              merchantCountQueries.push(query);
              return merchants.length;
            },
            aggregate(pipeline: unknown[]) {
              aggregatePipelines.push(pipeline);
              return createAggregateCursor(merchants);
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
    const url = new URL('https://example.com/api/businesses?collection=confirmed_benefits&lat=-34.6037&lng=-58.3816&limit=1&offset=0');

    await handleGetBusinesses(req as never, res as never, url, db as never);

    const payload = JSON.parse(res.body || '{}');
    expect(res.statusCode).toBe(200);
    expect(payload.businesses).toHaveLength(1);
    expect(payload.businesses[0].distance).toBeCloseTo(0.25, 5);
    expect(merchantCountQueries).toHaveLength(1);
    expect(aggregatePipelines).toHaveLength(1);
    expect(aggregatePipelines[0][1]).toEqual({ $skip: 0 });
    expect(aggregatePipelines[0][2]).toEqual({ $limit: 1 });
  });

  it('handleGetBusinesses paginates into withoutGeo merchants without aggregating them', async () => {
    const aggregatePipelines: unknown[][] = [];
    const merchantCountQueries: unknown[] = [];
    const merchantFindQueries: unknown[] = [];
    const merchantFindOps: Array<Record<string, unknown>> = [];
    const withGeoMerchant = {
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
      coverUrl: null,
      distanceMeters: 250
    };
    const withoutGeoMerchant = {
      merchantId: 'merchant_2',
      merchantName: 'Mostaza',
      merchantKey: 'mostaza',
      categories: ['gastronomia'],
      locations: [],
      banks: ['BBVA'],
      searchProfile: { description: 'Fast food' },
      activeBenefitCount: 1,
      benefitCount: 1,
      hasOnlineBenefits: true,
      imageUrl: 'https://cdn.example.com/mostaza.jpg',
      logoUrl: null,
      coverUrl: null
    };
    const benefits = [
      {
        id: 'benefit-2',
        merchantId: 'merchant_2',
        bank: 'BBVA',
        benefitTitle: '10% OFF',
        availableDays: ['Martes'],
        discountPercentage: 10,
        caps: [],
        online: true,
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
              merchantCountQueries.push(query);
              if (typeof query === 'object' && query !== null && '$and' in query) {
                return 1;
              }
              return 2;
            },
            aggregate(pipeline: unknown[]) {
              aggregatePipelines.push(pipeline);
              const skipStage = pipeline.find((stage) => '$skip' in (stage as Record<string, unknown>)) as { $skip: number } | undefined;
              return createAggregateCursor(skipStage?.$skip === 1 ? [] : [withGeoMerchant]);
            },
            find(query: unknown) {
              merchantFindQueries.push(query);
              const cursor = {
                sort(sortSpec: unknown) {
                  merchantFindOps.push({ sort: sortSpec });
                  return cursor;
                },
                skip(value: number) {
                  merchantFindOps.push({ skip: value });
                  return cursor;
                },
                limit(value: number) {
                  merchantFindOps.push({ limit: value });
                  return cursor;
                },
                async toArray() {
                  return [withoutGeoMerchant];
                }
              };
              return cursor;
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
    const url = new URL('https://example.com/api/businesses?collection=confirmed_benefits&lat=-34.6037&lng=-58.3816&limit=1&offset=1');

    await handleGetBusinesses(req as never, res as never, url, db as never);

    const payload = JSON.parse(res.body || '{}');
    expect(res.statusCode).toBe(200);
    expect(payload.businesses).toHaveLength(1);
    expect(payload.businesses[0].id).toBe('merchant_2');
    expect(payload.businesses[0].distance).toBeNull();
    expect(merchantCountQueries).toHaveLength(2);
    expect(aggregatePipelines).toHaveLength(1);
    expect(aggregatePipelines[0][1]).toEqual({ $skip: 1 });
    expect(aggregatePipelines[0][2]).toEqual({ $limit: 1 });
    expect(merchantFindQueries).toHaveLength(1);
    expect((((merchantFindQueries[0] as { $and: Array<{ $nor?: unknown[] }> }).$and)[1]).$nor).toEqual([
      { 'geoPoints.0': { $exists: true } },
      { 'geoPoints.coordinates.0': { $exists: true } }
    ]);
    expect(merchantFindOps).toEqual([
      { sort: { merchantName: 1 } },
      { skip: 0 },
      { limit: 1 }
    ]);
  });

  it('getActiveBenefitsMatch keeps date-only validUntil values active through the end of the current day', () => {
    const searchParams = new URL('https://example.com/api/benefits').searchParams;
    const match = getActiveBenefitsMatch(searchParams, new Date('2026-03-13T15:00:00.000Z'));

    expect(match).toEqual({
      $expr: {
        $let: {
          vars: {
            validUntilValue: {
              $ifNull: ['$validUntil', null]
            },
            parsedValidUntil: {
              $convert: {
                input: '$validUntil',
                to: 'date',
                onError: null,
                onNull: null
              }
            }
          },
          in: {
            $or: [
              { $eq: ['$$validUntilValue', null] },
              { $eq: ['$$validUntilValue', ''] },
              {
                $and: [
                  { $eq: [{ $type: '$$validUntilValue' }, 'string'] },
                  { $regexMatch: { input: '$$validUntilValue', regex: /^\d{4}-\d{2}-\d{2}$/ } },
                  { $gte: ['$$validUntilValue', '2026-03-13'] }
                ]
              },
              { $gte: ['$$parsedValidUntil', new Date('2026-03-13T15:00:00.000Z')] }
            ]
          }
        }
      }
    });
  });
});
