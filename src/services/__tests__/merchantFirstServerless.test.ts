import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getActiveBenefitsMatch,
  handleCategorySeoPage,
  handleGetBenefitById,
  handleGetBenefits,
  handleGetBusinesses,
  handleLegacyBusinessRedirect,
  handleLandingSeoPage,
  handleMerchantSeoPage,
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
  });

  it('resolveRequestPath honors Vercel path rewrites for pretty merchant URLs', () => {
    expect(resolveRequestPath(new URL('https://example.com/comercios/coto--merchant_1?path=comercios/coto--merchant_1'))).toBe('/api/comercios/coto--merchant_1');
    expect(resolveRequestPath(new URL('https://example.com/business/merchant_1?path=business/merchant_1'))).toBe('/api/business/merchant_1');
    expect(resolveRequestPath(new URL('https://example.com/categorias/moda?path=categorias/moda'))).toBe('/api/categorias/moda');
    expect(resolveRequestPath(new URL('https://example.com/categorias/moda/page/2?path=categorias/moda/page/2'))).toBe('/api/categorias/moda/page/2');
    expect(resolveRequestPath(new URL('https://example.com/descuentos/galicia/gastronomia?path=descuentos/galicia/gastronomia'))).toBe('/api/descuentos/galicia/gastronomia');
    expect(resolveRequestPath(new URL('https://example.com/descuentos/galicia/gastronomia/caba?path=descuentos/galicia/gastronomia/caba'))).toBe('/api/descuentos/galicia/gastronomia/caba');
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
    const merchant = {
      merchantId: 'merchant_1',
      merchantName: 'Coto',
      categories: ['shopping'],
      banks: ['Banco Galicia'],
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
      categories: { $in: ['shopping'] }
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
      benefitCount: { $gt: 0 },
      categories: { $in: ['shopping'] },
      banks: { $in: expect.arrayContaining([expect.any(RegExp)]) }
    });
  });

  it('handleLandingSeoPage redirects aliases to canonical landing paths', async () => {
    const db = {
      collection() {
        throw new Error('Landing alias redirects should not query MongoDB');
      }
    };

    const req = {};
    const res = createResponseCapture();
    const url = new URL('https://example.com/api/descuentos/frances/moda');

    await handleLandingSeoPage(req as never, res as never, url, db as never, 'frances', 'moda');

    expect(res.statusCode).toBe(301);
    expect(res.headers.Location).toBe('/descuentos/bbva/moda');
  });

  it('handleLandingSeoPage returns 404 for invalid landing combinations', async () => {
    const db = {
      collection() {
        throw new Error('Invalid landing pages should not query MongoDB');
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
