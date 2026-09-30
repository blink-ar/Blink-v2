import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchBusinessesPaginated, normalizeBusinesses } from '../api';

describe('search request contract', () => {
  const fetchMock = vi.fn();
  beforeEach(() => { vi.stubGlobal('fetch', fetchMock); fetchMock.mockReset(); });
  afterEach(() => vi.unstubAllGlobals());

  it('preserves online and approximate Tucumán location when switching to text search', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true, merchants: [], pagination: { totalMerchants: 0, hasMore: false } }) });
    await fetchBusinessesPaginated({ search: 'café', online: true, geohash: '6e3h' });
    const url = new URL(fetchMock.mock.calls[0][0], 'https://example.com');
    expect(url.searchParams.get('online')).toBe('true');
    expect(url.searchParams.get('geohash')).toBe('6e3h');
  });

  it('keeps server relevance evidence for product and intent matches', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({
      success: true,
      merchants: [{ aliases: [], reasons: ['intent_overlap'], business: { id: 'blue-bell', name: 'Blue Bell', benefits: [{ rewardRate: '20%', bankName: 'Club La Gaceta', validUntil: null }], location: [] } }],
      pagination: { totalMerchants: 1, hasMore: false },
    }) });
    const result = await fetchBusinessesPaginated({ search: 'heladerías' });
    expect(result.businesses[0]).toHaveProperty('searchMatchReasons', ['intent_overlap']);
  });

  it('does not launch a legacy fallback after a search is cancelled', async () => {
    const controller = new AbortController();
    controller.abort();
    fetchMock.mockRejectedValue(new DOMException('Cancelled', 'AbortError'));
    await expect(fetchBusinessesPaginated({ search: 'café', signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([null, undefined, NaN, Infinity, -1])('normalizes invalid API distance %s without inventing zero', distance => {
    const data = normalizeBusinesses([{ id: 'havanna', name: 'Havanna', distance, distanceText: 'NaNkm', isNearby: true, benefits: [{ rewardRate: '20%', validUntil: null }], locations: [{ formattedAddress: 'Tucumán' }] }]);
    expect(data[0]).toMatchObject({ distance: undefined, distanceText: undefined, isNearby: false });
    expect(data[0].location).toHaveLength(1);
  });

  it('retains server distance for both listing and text-search mappings', async () => {
    const business = { id: 'distrito25', name: 'Distrito 25', distance: 1.935, distanceText: '1.9km', isNearby: true, location: [{ formattedAddress: 'Tucumán' }], benefits: [{ rewardRate: '20%', validUntil: null }] };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, businesses: [business], pagination: { total: 1, hasMore: false } }) });
    expect((await fetchBusinessesPaginated()).businesses[0]).toMatchObject({ distance: 1.935, isNearby: true });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, merchants: [{ business }], pagination: { totalMerchants: 1, hasMore: false } }) });
    expect((await fetchBusinessesPaginated({ search: 'Distrito25' })).businesses[0]).toMatchObject({ distance: 1.935, isNearby: true });
  });

  it('aborts an active legacy fallback rather than returning a failed result', async () => {
    const controller = new AbortController();
    const legacyStarted = vi.fn();
    fetchMock.mockRejectedValueOnce(new Error('Engine unavailable'));
    fetchMock.mockImplementationOnce((_url, options) => new Promise((_resolve, reject) => {
      legacyStarted();
      options.signal.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')));
    }));
    const pending = fetchBusinessesPaginated({ search: 'café', signal: controller.signal });
    const rejection = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(legacyStarted).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[1][1].signal).toBe(controller.signal);
    controller.abort();
    await rejection;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('prioritizes exact coordinates over geohash while retaining online and bank filters', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true, merchants: [], pagination: { totalMerchants: 0, hasMore: false } }) });
    await fetchBusinessesPaginated({ search: 'café', bank: 'lagaceta', online: true, lat: -26.824, lng: -65.223, geohash: '6e3h' });
    const url = new URL(fetchMock.mock.calls[0][0], 'https://example.com');
    expect(url.searchParams.get('lat')).toBe('-26.824');
    expect(url.searchParams.get('lng')).toBe('-65.223');
    expect(url.searchParams.has('geohash')).toBe(false);
    expect(url.searchParams.get('online')).toBe('true');
    expect(url.searchParams.get('bank')).toBe('lagaceta');
  });
});
