import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchBusinessById } from '../api';

const mockFetch = vi.fn();

describe('fetchBusinessById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the businesses endpoint with an exact merchantId instead of a search query', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        businesses: [
          {
            id: 'merchant_1',
            name: 'Adidas',
            category: 'shopping',
            description: 'Sportswear',
            rating: 5,
            locations: [
              {
                lat: -34.6,
                lng: -58.38,
                formattedAddress: 'Store 1',
                source: 'address',
                provider: 'google',
                confidence: 1,
                raw: 'Store 1',
                updatedAt: '2026-04-20T00:00:00.000Z'
              }
            ],
            image: 'https://cdn.example.com/adidas.jpg',
            benefits: []
          }
        ],
        pagination: {
          total: 1,
          limit: 1,
          offset: 0,
          hasMore: false
        },
        filters: {
          merchantId: 'merchant_1'
        }
      })
    });

    const business = await fetchBusinessById('merchant_1');

    expect(mockFetch).toHaveBeenCalledTimes(1);

    const requestUrl = new URL(String(mockFetch.mock.calls[0][0]), 'https://example.com');
    expect(requestUrl.pathname).toBe('/api/businesses');
    expect(requestUrl.searchParams.get('merchantId')).toBe('merchant_1');
    expect(requestUrl.searchParams.get('search')).toBeNull();
    expect(business?.id).toBe('merchant_1');
    expect(business?.location).toHaveLength(1);
  });
});
