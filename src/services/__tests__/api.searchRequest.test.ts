import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchBusinessesPaginated } from '../api';

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
