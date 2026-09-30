import { beforeEach, describe, expect, it, vi } from 'vitest';
const { searchMock } = vi.hoisted(() => ({ searchMock: vi.fn() }));
vi.mock('../../../api/search/meilisearch.js', () => ({ meiliSearch: searchMock, isMeilisearchConfigured: () => true }));
import { handleGetBusinesses, handleSearch } from '../../../api/[...path].js';
const response = () => ({ code: 0, status(code) { this.code = code; return this; }, setHeader() {}, send(body) { this.body = JSON.parse(body); } });
const cursor = rows => ({ sort() { return this; }, skip() { return this; }, limit() { return this; }, async toArray() { return rows; } });
const merchant = (id, locations = []) => ({ merchantId: id, merchantName: id, categories: ['gastronomia'], banks: ['lagaceta'], locations, activeBenefitCount: 1, benefitCount: 1 });
const benefit = id => ({ id: `benefit-${id}`, merchantId: id, benefitTitle: '20%', discountPercentage: 20, eligibilities: [{ bank: 'lagaceta' }], validUntil: '2099-12-31' });
function database(merchants, geoRows = null) {
  return { collection(name) {
    if (name === 'providers') return { find: () => cursor([{ key: 'lagaceta', name: 'Club La Gaceta' }]) };
    if (name === 'merchant_assets') return { countDocuments: async () => merchants.length, find: () => cursor(merchants), aggregate() {
      if (geoRows !== null) return cursor(geoRows);
      throw new Error('unable to find index for $geoNear query');
    } };
    if (name === 'confirmed_benefits') return { find: () => cursor(merchants.map(m => benefit(m.merchantId))) };
    if (name === 'bank_cards') return { find: () => cursor([]) };
    throw new Error(`Unexpected collection ${name}`);
  } };
}
beforeEach(() => { searchMock.mockReset(); delete globalThis.__blinkProviderCatalog; });
describe('nearby listing and text-search API distances', () => {
  it('sorts valid distances before unknowns in the no-index fallback, preserving real zero', async () => {
    const rows = [merchant('a-unknown', [{ lat: null, lng: null }]), merchant('b-zero', [{ lat: 0, lng: 0 }]), merchant('c-near', [{ lat: '-0.01', lng: '0' }]), merchant('d-invalid', [{ lat: 91, lng: 181 }])];
    const res = response();
    await handleGetBusinesses({}, res, new URL('https://local.invalid/api/businesses?lat=0&lng=0&limit=4&view=summary'), database(rows));
    expect(res.body.businesses.map(b => b.id)).toEqual(['b-zero', 'c-near', 'a-unknown', 'd-invalid']);
    expect(res.body.businesses[0]).toMatchObject({ distance: 0, distanceText: '0m', isNearby: true });
    expect(res.body.businesses[1].distance).toBeCloseTo(1.11195, 4);
    for (const item of res.body.businesses.slice(2)) expect(item).toMatchObject({ distance: null, distanceText: null, isNearby: false });
    // Cerca sorts; it does not change the global match count into a radius count.
    expect(res.body.pagination.total).toBe(4);
    expect(res.body.businesses[0].locations[0]).not.toHaveProperty('lat');
  });
  it.each([null, undefined, NaN, Infinity, -1])('does not turn invalid geoNear meters %s into a false zero/nearby value', async distanceMeters => {
    const row = { ...merchant('unknown'), distanceMeters };
    const res = response();
    await handleGetBusinesses({}, res, new URL('https://local.invalid/api/businesses?lat=-26.824&lng=-65.223&limit=1'), database([row], [row]));
    expect(res.body.businesses[0]).toMatchObject({ distance: null, distanceText: null, isNearby: false });
  });
  it.each(['lat=NaN&lng=-65', 'lat=&lng=', 'lat=91&lng=0', 'lat=0&lng=181', 'lat=0', 'lat=12abc&lng=0'])('rejects malformed explicit location %s instead of silently using global listing', async params => {
    for (const handler of [handleGetBusinesses, handleSearch]) {
      const res = response();
      await handler({}, res, new URL(`https://local.invalid/api/search?q=café&${params}`), {});
      expect(res.code).toBe(400);
      expect(res.body.error).toBe('Invalid coordinates');
    }
  });
  it('text search computes numeric-string coordinates and keeps missing coordinates null', async () => {
    const near = merchant('Café cercano', [{ lat: null, lng: null }, { lat: '-26.834', lng: '-65.223' }]);
    const missing = merchant('Café sin ubicación', [{ lat: null, lng: null }]);
    searchMock.mockResolvedValue({ hits: [] }).mockResolvedValueOnce({ hits: [near, missing].map(m => ({ ...m, entityType: 'merchant', entityId: m.merchantId, _rankingScore: 1, business: { id: m.merchantId, name: m.merchantName, location: m.locations, benefits: [] } })) });
    const db = database([near, missing]);
    const originalCollection = db.collection;
    db.collection = name => name === 'merchant_assets' ? { find: () => cursor([]) } : originalCollection(name);
    const res = response();
    await handleSearch({}, res, new URL('https://local.invalid/api/search?q=café&lat=-26.824&lng=-65.223&limit=2'), db);
    const items = new Map(res.body.merchants.map(m => [m.merchantId, m.business]));
    expect(items.get('Café cercano').distance).toBeCloseTo(1.11195, 4);
    expect(items.get('Café sin ubicación')).toMatchObject({ distance: null, distanceText: null, isNearby: false });
  });
});
