import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { APIService } from '../APIService';
import { CacheService } from '../CacheService';
import { HTTPClient } from '../HTTPClient';
import { benefitsAPI } from '../api';
import { NetworkError } from '../base';
import { Business, CanonicalLocation } from '../../types';
import { Benefit } from '../../types/mongodb';

const apiMocks = vi.hoisted(() => ({
    getBenefits: vi.fn()
}));

vi.mock('../CacheService');
vi.mock('../HTTPClient');
vi.mock('../api', () => ({
    benefitsAPI: {
        getBenefits: apiMocks.getBenefits
    }
}));

const testLocation: CanonicalLocation = {
    lat: -34.6037,
    lng: -58.3816,
    formattedAddress: 'Av. Corrientes 1234, CABA',
    source: 'address',
    provider: 'google',
    confidence: 1,
    raw: 'Av. Corrientes 1234, CABA',
    updatedAt: '2026-05-01T00:00:00.000Z'
};

const makeBenefit = (overrides: Partial<Benefit> = {}): Benefit => ({
    id: 'benefit-1',
    merchant: {
        name: 'Restaurante Test',
        type: 'business'
    },
    bank: 'Banco Test',
    network: 'VISA',
    cardTypes: [
        {
            name: 'Visa Gold',
            category: 'Gold',
            mode: 'credit'
        }
    ],
    benefitTitle: '10% OFF',
    description: 'Descuento en restaurantes',
    validUntil: '2026-12-31',
    discountPercentage: 10,
    installments: null,
    categories: ['gastronomia'],
    termsAndConditions: 'Con tarjeta activa',
    locations: [testLocation],
    online: false,
    link: 'https://example.com/apply',
    availableDays: ['lunes', 'martes'],
    subscription: null,
    ...overrides
});

describe('APIService', () => {
    let apiService: APIService;
    let mockCacheService: {
        initialize: ReturnType<typeof vi.fn>;
        destroy: ReturnType<typeof vi.fn>;
        get: ReturnType<typeof vi.fn>;
        getEntryMetadata: ReturnType<typeof vi.fn>;
        set: ReturnType<typeof vi.fn>;
        clear: ReturnType<typeof vi.fn>;
        getStats: ReturnType<typeof vi.fn>;
    };
    let mockHttpClient: {
        initialize: ReturnType<typeof vi.fn>;
        destroy: ReturnType<typeof vi.fn>;
        getConnectionStatus: ReturnType<typeof vi.fn>;
        isOnline: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
        vi.clearAllMocks();

        mockCacheService = {
            initialize: vi.fn().mockResolvedValue(undefined),
            destroy: vi.fn().mockResolvedValue(undefined),
            get: vi.fn(),
            getEntryMetadata: vi.fn().mockReturnValue(null),
            set: vi.fn(),
            clear: vi.fn(),
            getStats: vi.fn().mockReturnValue({
                totalEntries: 0,
                totalSize: 0,
                hitRate: 0,
                missRate: 0
            })
        };

        mockHttpClient = {
            initialize: vi.fn().mockResolvedValue(undefined),
            destroy: vi.fn().mockResolvedValue(undefined),
            getConnectionStatus: vi.fn().mockReturnValue('online'),
            isOnline: vi.fn().mockReturnValue(true)
        };

        vi.mocked(CacheService).mockImplementation(() => mockCacheService as unknown as CacheService);
        vi.mocked(HTTPClient).mockImplementation(() => mockHttpClient as unknown as HTTPClient);

        apiService = new APIService({
            baseURL: 'https://test-api.com',
            cacheTimeout: 1000,
            backgroundRefreshThreshold: 500
        });

        await apiService.initialize();
    });

    afterEach(async () => {
        if (apiService) {
            await apiService.destroy();
        }
    });

    describe('initialization', () => {
        it('initializes and destroys dependencies', async () => {
            expect(mockCacheService.initialize).toHaveBeenCalled();
            expect(mockHttpClient.initialize).toHaveBeenCalled();

            await apiService.destroy();

            expect(mockCacheService.destroy).toHaveBeenCalled();
            expect(mockHttpClient.destroy).toHaveBeenCalled();
        });
    });

    describe('fetchBusinesses', () => {
        it('returns cached businesses when available', async () => {
            const cachedBusinesses: Business[] = [
                {
                    id: 'cached-business',
                    name: 'Cached Business',
                    category: 'gastronomia',
                    description: 'Cached description',
                    rating: 5,
                    location: [testLocation],
                    image: 'https://example.com/cached.jpg',
                    benefits: []
                }
            ];
            mockCacheService.get.mockReturnValue(cachedBusinesses);
            mockCacheService.getEntryMetadata.mockReturnValue({
                timestamp: Date.now(),
                ttl: 1000,
                version: '1.0.0',
                size: 1
            });

            const result = await apiService.fetchBusinesses();

            expect(mockCacheService.get).toHaveBeenCalledWith('businesses');
            expect(mockCacheService.getEntryMetadata).toHaveBeenCalledWith('businesses');
            expect(benefitsAPI.getBenefits).not.toHaveBeenCalled();
            expect(result).toEqual(cachedBusinesses);
        });

        it('refreshes stale cached businesses in the background', async () => {
            const cachedBusinesses: Business[] = [
                {
                    id: 'cached-business',
                    name: 'Cached Business',
                    category: 'gastronomia',
                    description: 'Cached description',
                    rating: 5,
                    location: [testLocation],
                    image: 'https://example.com/cached.jpg',
                    benefits: []
                }
            ];
            mockCacheService.get.mockReturnValue(cachedBusinesses);
            mockCacheService.getEntryMetadata.mockReturnValue({
                timestamp: Date.now() - 600,
                ttl: 1000,
                version: '1.0.0',
                size: 1
            });
            apiMocks.getBenefits.mockResolvedValue([makeBenefit()]);

            const result = await apiService.fetchBusinesses();
            await Promise.resolve();

            expect(result).toEqual(cachedBusinesses);
            expect(benefitsAPI.getBenefits).toHaveBeenCalledWith();
            expect(mockCacheService.set).toHaveBeenCalledWith('businesses', expect.any(Array));
        });

        it('fetches current benefits, groups them by merchant, and caches businesses', async () => {
            mockCacheService.get.mockReturnValue(null);
            apiMocks.getBenefits.mockResolvedValue([
                makeBenefit(),
                makeBenefit({
                    id: 'benefit-2',
                    bank: 'BBVA',
                    benefitTitle: '3 cuotas sin interés',
                    discountPercentage: null,
                    installments: 3,
                    cardTypes: [{ name: 'Mastercard Black', category: 'Black', mode: 'credit' }]
                })
            ]);

            const result = await apiService.fetchBusinesses();

            expect(benefitsAPI.getBenefits).toHaveBeenCalledWith();
            expect(mockCacheService.set).toHaveBeenCalledWith('businesses', expect.any(Array));
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                id: 'restaurante-test',
                name: 'Restaurante Test',
                category: 'gastronomia',
                description: 'Descuento en restaurantes',
                rating: 5,
                location: [testLocation]
            });
            expect(result[0].benefits).toHaveLength(2);
            expect(result[0].benefits[0]).toMatchObject({
                bankName: 'Banco Test',
                cardName: 'Visa Gold',
                cardTypes: ['Visa Gold'],
                benefit: '10% OFF',
                rewardRate: '10%',
                condicion: 'Con tarjeta activa',
                textoAplicacion: 'https://example.com/apply',
                validUntil: '2026-12-31'
            });
            expect(result[0].benefits[1]).toMatchObject({
                bankName: 'BBVA',
                cardName: 'Mastercard Black',
                rewardRate: '3 cuotas s/int',
                installments: 3
            });
        });

        it('normalizes malformed but recoverable API fields', async () => {
            mockCacheService.get.mockReturnValue(null);
            apiMocks.getBenefits.mockResolvedValue([
                makeBenefit({
                    categories: ['INVALID_CATEGORY'] as Benefit['categories'],
                    discountPercentage: null,
                    cardTypes: [],
                    benefitTitle: '',
                    description: '',
                    termsAndConditions: null,
                    link: null
                })
            ]);

            const result = await apiService.fetchBusinesses();

            expect(result).toHaveLength(1);
            expect(result[0].category).toBe('otros');
            expect(result[0].image).toContain('pexels');
            expect(result[0].benefits[0]).toMatchObject({
                cardName: 'Credit Card',
                rewardRate: 'N/A'
            });
        });

        it('returns stale cache data when the API fails after a cache miss', async () => {
            const staleData = [{ id: 'stale', name: 'Stale Business' }] as Business[];
            mockCacheService.get
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(staleData);
            apiMocks.getBenefits.mockRejectedValue(new NetworkError('API failed'));

            const result = await apiService.fetchBusinesses();

            expect(result).toEqual(staleData);
        });

        it('falls back to an empty array when the API returns no businesses and no stale cache exists', async () => {
            mockCacheService.get.mockReturnValue(null);
            apiMocks.getBenefits.mockResolvedValue([]);

            const result = await apiService.fetchBusinesses();

            expect(result).toEqual([]);
            expect(mockCacheService.set).not.toHaveBeenCalled();
        });
    });

    describe('connection status', () => {
        it('delegates connection status to the HTTP client', () => {
            mockHttpClient.getConnectionStatus.mockReturnValue('slow');
            mockHttpClient.isOnline.mockReturnValue(false);

            expect(apiService.getConnectionStatus()).toBe('slow');
            expect(apiService.isOnline()).toBe(false);
        });
    });

    describe('cache management', () => {
        it('clears cache and returns cache stats', () => {
            const mockStats = {
                totalEntries: 5,
                totalSize: 1024,
                hitRate: 0.8,
                missRate: 0.2
            };
            mockCacheService.getStats.mockReturnValue(mockStats);

            apiService.clearCache();

            expect(mockCacheService.clear).toHaveBeenCalled();
            expect(apiService.getCacheStats()).toEqual(mockStats);
        });
    });

    describe('error handling', () => {
        it('throws when used before initialization', async () => {
            const uninitializedService = new APIService();

            await expect(uninitializedService.fetchBusinesses()).rejects.toThrow('APIService is not initialized');
        });

        it('throws when used after destroy', async () => {
            await apiService.destroy();

            await expect(apiService.fetchBusinesses()).rejects.toThrow('APIService is not initialized');
        });
    });
});
