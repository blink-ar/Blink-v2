import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchBusinessById, fetchBusinessesPaginated } from '../api';

const mockFetch = vi.fn();

describe('fetchBusinessById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the businesses endpoint with an exact merchantId and optional expired benefits', async () => {
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

    const business = await fetchBusinessById('merchant_1', { includeExpired: true });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    const requestUrl = new URL(String(mockFetch.mock.calls[0][0]), 'https://example.com');
    expect(requestUrl.pathname).toBe('/api/businesses');
    expect(requestUrl.searchParams.get('merchantId')).toBe('merchant_1');
    expect(requestUrl.searchParams.get('includeExpired')).toBe('true');
    expect(requestUrl.searchParams.get('search')).toBeNull();
    expect(business?.id).toBe('merchant_1');
    expect(business?.location).toHaveLength(1);
  });

  it('keeps open-ended benefits when includeExpired is set on the search fallback path', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        query: { q: 'adidas', normalized: 'adidas', expanded: ['adidas'], limit: 1, offset: 0, filters: {} },
        source: 'meilisearch',
        intents: [],
        products: [],
        merchants: [
          {
            entityId: 'merchant_1',
            merchantId: 'merchant_1',
            merchantName: 'Adidas',
            aliases: [],
            intentTags: [],
            productTags: [],
            categories: ['shopping'],
            banks: [],
            score: 1,
            reasons: [],
            business: {
              id: 'merchant_1',
              name: 'Adidas',
              category: 'shopping',
              description: 'Sportswear',
              rating: 5,
              locations: [],
              image: '',
              benefits: [
                {
                  bankName: 'BBVA',
                  cardName: 'Visa',
                  benefit: 'Promo anterior',
                  rewardRate: '10%',
                  color: '#000',
                  icon: 'credit_card',
                  validUntil: null
                }
              ]
            }
          }
        ],
        pagination: { totalMerchants: 1, limit: 1, offset: 0, hasMore: false }
      })
    });

    const response = await fetchBusinessesPaginated({ search: 'adidas', limit: 1, includeExpired: true });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(response.businesses).toHaveLength(1);
    expect(response.businesses[0].benefits).toHaveLength(1);
  });
});
