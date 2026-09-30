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
});
