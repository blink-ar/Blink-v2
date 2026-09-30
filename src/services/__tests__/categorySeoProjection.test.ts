import { describe, expect, it, vi } from 'vitest';
import { loadCategorySeoData, renderCategorySeoHtml, resolveSeoCategory } from '../../../api/category-seo.js';

const category = resolveSeoCategory('gastronomia');
const appShell = '<html><head><title>Blink</title></head><body><div id="root"></div></body></html>';

// Model Mongo's inclusion/$slice projection to exercise what the renderer receives.
type MerchantFixture = {
  merchantId: string;
  merchantName: string;
  banks?: string[];
  locations?: { formattedAddress?: string; addressComponents?: { locality: string }; raw?: string }[];
  [key: string]: unknown;
};
type Projection = Record<string, number | { $slice: number }>;

function fixtureDb(docs: MerchantFixture[], total = docs.length) {
  const find = vi.fn((_query, { projection }) => {
    let offset = 0;
    let limit = 100;
    const cursor = {
      sort: vi.fn(() => cursor),
      skip: vi.fn((value) => { offset = value; return cursor; }),
      limit: vi.fn((value) => { limit = value; return cursor; }),
      toArray: async () => docs.slice(offset, offset + limit).map((doc) => Object.fromEntries(
        Object.entries(projection as Projection).filter(([key, value]) => value !== 0 && key in doc)
          .map(([key, value]) => [key, typeof value === 'object'
            ? Array.isArray(doc[key]) ? doc[key].slice(0, value.$slice) : doc[key]
            : doc[key]])
      )),
    };
    return cursor;
  });
  return { db: { collection: () => ({ countDocuments: async () => total, find }) }, find };
}

function render(merchants: MerchantFixture[], page = 1, total = merchants.length) {
  return renderCategorySeoHtml({ appShell, category, merchants, page, total });
}

describe('category SEO bounded Mongo projection', () => {
  it('keeps identical cards, metadata, and pagination for a chain with many branches', async () => {
    const merchants = [{
      merchantId: 'merchant_chain', merchantName: 'Cadena & Café', categories: ['gastronomia'],
      banks: ['lagaceta', 'macro', 'galicia', 'bbva', 'naranjax', 'modo'],
      benefitCount: 20, activeBenefitCount: 15, maxDiscountPercentage: 30,
      locations: Array.from({ length: 500 }, (_, index) => ({
        formattedAddress: `Sucursal ${index}`, addressComponents: { locality: index === 0 ? 'San Miguel de Tucumán' : 'Otra ciudad' },
        raw: 'upstream geocoding payload'.repeat(100),
      })),
    }];
    const { db, find } = fixtureDb(merchants, 201);
    const result = await loadCategorySeoData({ db, merchantCollectionName: 'merchant_assets', category, page: 1 });

    expect(result).toMatchObject({ total: 201, totalPages: 3, outOfRange: false, page: 1 });
    expect(result.merchants[0].locations).toHaveLength(1);
    expect(result.merchants[0].banks).toHaveLength(4);
    expect(find.mock.calls[0][1].projection).toMatchObject({ locations: { $slice: 1 }, banks: { $slice: 4 } });
    expect(render(result.merchants, 1, 201)).toBe(render(merchants, 1, 201));
    expect(JSON.stringify(result.merchants).length).toBeLessThan(JSON.stringify(merchants).length / 100);
  });

  it('keeps sparse locations and bank display fallbacks unchanged', async () => {
    const merchants = [
      { merchantId: 'merchant_empty', merchantName: 'Sin sucursales', banks: [], locations: [], benefitCount: 1 },
      { merchantId: 'merchant_missing', merchantName: 'Sin datos', benefitCount: 1 },
      { merchantId: 'merchant_sparse', merchantName: 'Ubicación vacía', banks: ['macro'], locations: [{}, { formattedAddress: 'No debe mostrarse' }], benefitCount: 1 },
    ];
    const { db } = fixtureDb(merchants);
    const result = await loadCategorySeoData({ db, merchantCollectionName: 'merchant_assets', category, page: 1 });
    expect(render(result.merchants)).toBe(render(merchants));
    expect(render(result.merchants)).toContain('Argentina');
  });

  it('preserves page bounds without fetching an out-of-range page', async () => {
    const { db, find } = fixtureDb([], 100);
    const result = await loadCategorySeoData({ db, merchantCollectionName: 'merchant_assets', category, page: 2 });
    expect(result).toMatchObject({ total: 100, merchants: [], outOfRange: true, page: 2 });
    expect(find).not.toHaveBeenCalled();
  });

  it('preserves an empty category page', async () => {
    const { db } = fixtureDb([]);
    const result = await loadCategorySeoData({ db, merchantCollectionName: 'merchant_assets', category, page: 1 });
    expect(result).toMatchObject({ total: 0, totalPages: 1, merchants: [], outOfRange: false });
    expect(render(result.merchants)).toContain('Todavia no hay comercios');
  });
});
