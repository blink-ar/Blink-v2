import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { APIService } from '../APIService';
import { CacheService } from '../CacheService';
import { HTTPClient } from '../HTTPClient';
import { NetworkError, ValidationError } from '../base';

// Mock the dependencies
vi.mock('../CacheService');
vi.mock('../HTTPClient');

// Mock localStorage for CacheService
const mockStorage = {
    store: {} as Record<string, string>,
    getItem: vi.fn((key: string) => mockStorage.store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
        mockStorage.store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
        delete mockStorage.store[key];
    }),
    clear: vi.fn(() => {
        mockStorage.store = {};
    }),
    key: vi.fn((index: number) => {
        const keys = Object.keys(mockStorage.store);
        return keys[index] || null;
    }),
    get length() {
        return Object.keys(mockStorage.store).length;
    }
};

Object.defineProperty(global, 'localStorage', {
    value: mockStorage
});

describe('APIService', () => {
    let apiService: APIService;
    let mockCacheService: any;
    let mockHttpClient: any;

    const mockAPIResponse = {
        BANCO_TEST: [
            {
                _id: { $oid: '507f1f77bcf86cd799439011' },
                id: 'test-benefit-1',
                beneficios: [
                    {
                        tipo: 'descuento',
                        cuando: 'siempre',
                        valor: '10%',
                        cuota: { $numberInt: '1' },
                        tope: 'sin tope',
                        claseDeBeneficio: 'descuento',
                        casuistica: { descripcion: 'Descuento en restaurantes' },
                        condicion: 'con tarjeta',
                        requisitos: ['tarjeta activa']
                    }
                ],
                cabecera: 'Restaurante de prueba',
                destacado: true,
                details: {
                    beneficio: {
                        titulo: 'Restaurante Test',
                        rubros: [{ id: 1, nombre: 'gastronomia' }],
                        subtitulo: 'Comida deliciosa',
                        imagen: 'https://example.com/image.jpg',
                        vigencia: '2024-12-31',
                        subcabecera: 'Subcabecera',
                        cabecera: 'Cabecera'
                    }
                }
            }
        ]
    };

    beforeEach(async () => {
        vi.clearAllMocks();
        mockStorage.clear();

        // Create mock instances
        mockCacheService = {
            initialize: vi.fn().mockResolvedValue(undefined),
            destroy: vi.fn().mockResolvedValue(undefined),
            get: vi.fn(),
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
            get: vi.fn(),
            getConnectionStatus: vi.fn().mockReturnValue('online'),
            isOnline: vi.fn().mockReturnValue(true)
        };

        // Mock the constructors
        (CacheService as any).mockImplementation(() => mockCacheService);
        (HTTPClient as any).mockImplementation(() => mockHttpClient);

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
        it('should initialize successfully', async () => {
            expect(mockCacheService.initialize).toHaveBeenCalled();
            expect(mockHttpClient.initialize).toHaveBeenCalled();
        });

        it('should destroy dependencies on destroy', async () => {
            await apiService.destroy();

            expect(mockCacheService.destroy).toHaveBeenCalled();
            expect(mockHttpClient.destroy).toHaveBeenCalled();
        });
    });

    describe('fetchBusinesses', () => {
        it('should return cached data when available', async () => {
            const cachedBusinesses = [
                {
                    id: 'cached-business',
                    name: 'Cached Business',
                    category: 'gastronomia',
                    description: 'Cached description',
                    rating: 5,
                    location: [{
                        lat: 0,
                        lng: 0,
                        formattedAddress: 'Test location',
                        source: 'address' as const,
                        provider: 'google' as const,
                        confidence: 1.0,
                        raw: 'Test location',
                        updatedAt: new Date().toISOString()
                    }],
                    image: 'https://example.com/cached.jpg',
                    benefits: []
                }
            ];

            mockCacheService.get.mockReturnValue(cachedBusinesses);

            const result = await apiService.fetchBusinesses();

            expect(mockCacheService.get).toHaveBeenCalledWith('businesses');
            expect(result).toEqual(cachedBusinesses);
            // Note: Background refresh may be triggered, so we don't check if HTTP client was not called
        });

        it('should fetch from API when no cache available', async () => {
            mockCacheService.get.mockReturnValue(null);
            mockHttpClient.get.mockResolvedValue({
                data: mockAPIResponse,
                status: 200,
                statusText: 'OK',
                headers: new Headers(),
                url: 'https://test-api.com/api/benefits'
            });

            const result = await apiService.fetchBusinesses();

            expect(mockHttpClient.get).toHaveBeenCalledWith('/api/benefits');
            expect(mockCacheService.set).toHaveBeenCalledWith('businesses', expect.any(Array));
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Restaurante Test');
        });

        it('should transform API response correctly', async () => {
            mockCacheService.get.mockReturnValue(null);
            mockHttpClient.get.mockResolvedValue({
                data: mockAPIResponse,
                status: 200,
                statusText: 'OK',
                headers: new Headers(),
                url: 'https://test-api.com/api/benefits'
            });

            const result = await apiService.fetchBusinesses();

            expect(result).toHaveLength(1);

            const business = result[0];
            expect(business.id).toBe('restaurante-test');
            expect(business.name).toBe('Restaurante Test');
            expect(business.category).toBe('gastronomia');
            expect(business.description).toBe('Restaurante de prueba');
            expect(business.benefits).toHaveLength(1);

            const benefit = business.benefits[0];
            expect(benefit.bankName).toBe('Banco Test');
            expect(benefit.benefit).toBe('Descuento en restaurantes');
            expect(benefit.rewardRate).toBe('10%');
        });

        it('should extract all beneficios fields correctly', async () => {
            const extendedAPIResponse = {
                BANCO_TEST: [
                    {
                        _id: { $oid: '507f1f77bcf86cd799439011' },
                        id: 'test-benefit-extended',
                        beneficios: [
                            {
                                tipo: 'cashback',
                                cuando: '2024-01-01 a 2024-12-31',
                                valor: '15%',
                                cuota: { $numberInt: '1' },
                                tope: '$50.000',
                                claseDeBeneficio: 'reembolso',
                                casuistica: { descripcion: 'Cashback en supermercados' },
                                condicion: 'compras mayores a $10.000',
                                requisitos: ['tarjeta activa', 'compra mínima $10.000'],
                                usos: ['supermercados', 'almacenes', 'tiendas de conveniencia'],
                                textoAplicacion: 'Aplica automáticamente al pagar con la tarjeta'
                            }
                        ],
                        cabecera: 'Supermercado de prueba',
                        destacado: true,
                        details: {
                            beneficio: {
                                titulo: 'Supermercado Test',
                                rubros: [{ id: 2, nombre: 'supermercados' }],
                                subtitulo: 'Ahorra en tus compras',
                                imagen: 'https://example.com/supermarket.jpg',
                                vigencia: '2024-12-31',
                                subcabecera: 'Subcabecera',
                                cabecera: 'Cabecera'
                            }
                        }
                    }
                ]
            };

            mockCacheService.get.mockReturnValue(null);
            mockHttpClient.get.mockResolvedValue({
                data: extendedAPIResponse,
                status: 200,
                statusText: 'OK',
                headers: new Headers(),
                url: 'https://test-api.com/api/benefits'
            });

            const result = await apiService.fetchBusinesses();
            const benefit = result[0].benefits[0];

            // Verify all new fields are extracted correctly
            expect(benefit.tipo).toBe('cashback');
            expect(benefit.cuando).toBe('2024-01-01 a 2024-12-31');
            expect(benefit.valor).toBe('15%');
            expect(benefit.tope).toBe('$50.000');
            expect(benefit.claseDeBeneficio).toBe('reembolso');
            expect(benefit.condicion).toBe('compras mayores a $10.000');
            expect(benefit.requisitos).toEqual(['tarjeta activa', 'compra mínima $10.000']);
            expect(benefit.usos).toEqual(['supermercados', 'almacenes', 'tiendas de conveniencia']);
            expect(benefit.textoAplicacion).toBe('Aplica automáticamente al pagar con la tarjeta');
        });

        it('should handle missing or empty beneficios fields gracefully', async () => {
            const partialAPIResponse = {
                BANCO_TEST: [
                    {
                        _id: { $oid: '507f1f77bcf86cd799439011' },
                        id: 'test-benefit-partial',
                        beneficios: [
                            {
                                tipo: 'descuento',
                                valor: '5%',
                                casuistica: { descripcion: 'Descuento parcial' },
                                requisitos: ['', 'tarjeta activa', ''], // Mix of empty and valid
                                usos: [] // Empty array
                                // Missing: cuando, tope, claseDeBeneficio, condicion, textoAplicacion
                            }
                        ],
                        cabecera: 'Negocio parcial',
                        destacado: false,
                        details: {
                            beneficio: {
                                titulo: 'Negocio Test Parcial',
                                rubros: [{ id: 3, nombre: 'otros' }],
                                subtitulo: 'Datos parciales',
                                imagen: 'https://example.com/partial.jpg',
                                vigencia: '2024-12-31',
                                subcabecera: 'Subcabecera',
                                cabecera: 'Cabecera'
                            }
                        }
                    }
                ]
            };

            mockCacheService.get.mockReturnValue(null);
            mockHttpClient.get.mockResolvedValue({
                data: partialAPIResponse,
                status: 200,
                statusText: 'OK',
                headers: new Headers(),
                url: 'https://test-api.com/api/benefits'
            });

            const result = await apiService.fetchBusinesses();
            const benefit = result[0].benefits[0];

            // Verify present fields are extracted
            expect(benefit.tipo).toBe('descuento');
            expect(benefit.valor).toBe('5%');
            expect(benefit.requisitos).toEqual(['tarjeta activa']); // Empty strings filtered out

            // Verify missing fields are undefined
            expect(benefit.cuando).toBeUndefined();
            expect(benefit.tope).toBeUndefined();
            expect(benefit.claseDeBeneficio).toBeUndefined();
            expect(benefit.condicion).toBeUndefined();
            expect(benefit.usos).toBeUndefined(); // Empty array becomes undefined
            expect(benefit.textoAplicacion).toBeUndefined();
        });

        it('should handle network errors gracefully', async () => {
            mockCacheService.get.mockReturnValue(null);
            mockHttpClient.get.mockRejectedValue(new NetworkError('Network failed'));

            const result = await apiService.fetchBusinesses();

            // Should fall back to mock data
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });

        it('should return stale cache data on API error', async () => {
            const staleData = [{ id: 'stale', name: 'Stale Business' }];

            mockCacheService.get
                .mockReturnValueOnce(null) // First call (fresh cache check)
                .mockReturnValueOnce(staleData); // Second call (stale cache fallback)

            mockHttpClient.get.mockRejectedValue(new NetworkError('API failed'));

            const result = await apiService.fetchBusinesses();

            expect(result).toEqual(staleData);
        });

        it('should handle empty API response', async () => {
            mockCacheService.get.mockReturnValue(null);
            mockHttpClient.get.mockResolvedValue({
                data: {},
                status: 200,
                statusText: 'OK',
                headers: new Headers(),
                url: 'https://test-api.com/api/benefits'
            });

            const result = await apiService.fetchBusinesses();

            // Should fall back to mock data when API returns empty
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });

        it('should handle malformed API response', async () => {
            mockCacheService.get.mockReturnValue(null);
            mockHttpClient.get.mockResolvedValue({
                data: {
                    INVALID_BANK: [
                        {
                            // Missing required fields
                            id: 'invalid'
                        }
                    ]
                },
                status: 200,
                statusText: 'OK',
                headers: new Headers(),
                url: 'https://test-api.com/api/benefits'
            });

            const result = await apiService.fetchBusinesses();

            // Should handle malformed data gracefully
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('data validation and sanitization', () => {
        it('should validate and sanitize business data', async () => {
            const malformedResponse = {
                TEST_BANK: [
                    {
                        _id: { $oid: '507f1f77bcf86cd799439011' },
                        id: 'test',
                        beneficios: [
                            {
                                valor: '  15%  ', // Extra whitespace
                                casuistica: { descripcion: 'Test   benefit   with   spaces' }
                            }
                        ],
                        cabecera: 'Test Business',
                        details: {
                            beneficio: {
                                titulo: 'Test Business',
                                rubros: [{ id: 1, nombre: 'INVALID_CATEGORY' }], // Invalid category
                                imagen: 'invalid-url' // Invalid URL
                            }
                        }
                    }
                ]
            };

            mockCacheService.get.mockReturnValue(null);
            mockHttpClient.get.mockResolvedValue({
                data: malformedResponse,
                status: 200,
                statusText: 'OK',
                headers: new Headers(),
                url: 'https://test-api.com/api/benefits'
            });

            const result = await apiService.fetchBusinesses();

            expect(result).toHaveLength(1);

            const business = result[0];
            expect(business.category).toBe('otros'); // Should default to 'otros' for invalid category
            expect(business.image).toContain('pexels'); // Should use default image for invalid URL

            const benefit = business.benefits[0];
            expect(benefit.rewardRate).toBe('15%'); // Should trim whitespace
            expect(benefit.benefit).toBe('Test benefit with spaces'); // Should normalize spaces
        });

        it('should assign consistent colors to banks', async () => {
            mockCacheService.get.mockReturnValue(null);
            mockHttpClient.get.mockResolvedValue({
                data: mockAPIResponse,
                status: 200,
                statusText: 'OK',
                headers: new Headers(),
                url: 'https://test-api.com/api/benefits'
            });

            const result = await apiService.fetchBusinesses();
            const benefit = result[0].benefits[0];

            expect(benefit.color).toMatch(/^bg-\w+-500$/); // Should be a valid Tailwind color class
        });

        it('should format BBVA bank name correctly', async () => {
            const bbvaResponse = {
                BBVA_GO_V3: [
                    {
                        _id: { $oid: '507f1f77bcf86cd799439011' },
                        id: 'bbva-benefit-1',
                        beneficios: [
                            {
                                tipo: 'descuento',
                                valor: '15%',
                                casuistica: { descripcion: 'Descuento BBVA' }
                            }
                        ],
                        cabecera: 'Beneficio BBVA',
                        details: {
                            beneficio: {
                                titulo: 'BBVA Business',
                                rubros: [{ id: 1, nombre: 'gastronomia' }]
                            }
                        }
                    }
                ]
            };

            mockCacheService.get.mockReturnValue(null);
            mockHttpClient.get.mockResolvedValue({
                data: bbvaResponse,
                status: 200,
                statusText: 'OK',
                headers: new Headers(),
                url: 'https://test-api.com/api/benefits'
            });

            const result = await apiService.fetchBusinesses();
            const benefit = result[0].benefits[0];

            expect(benefit.bankName).toBe('BBVA'); // Should be formatted as just "BBVA"
        });
    });

    describe('connection status', () => {
        it('should return connection status from HTTP client', () => {
            mockHttpClient.getConnectionStatus.mockReturnValue('slow');

            expect(apiService.getConnectionStatus()).toBe('slow');
            expect(mockHttpClient.getConnectionStatus).toHaveBeenCalled();
        });

        it('should return online status from HTTP client', () => {
            mockHttpClient.isOnline.mockReturnValue(false);

            expect(apiService.isOnline()).toBe(false);
            expect(mockHttpClient.isOnline).toHaveBeenCalled();
        });
    });

    describe('cache management', () => {
        it('should clear cache', () => {
            apiService.clearCache();

            expect(mockCacheService.clear).toHaveBeenCalled();
        });

        it('should return cache statistics', () => {
            const mockStats = {
                totalEntries: 5,
                totalSize: 1024,
                hitRate: 0.8,
                missRate: 0.2
            };

            mockCacheService.getStats.mockReturnValue(mockStats);

            expect(apiService.getCacheStats()).toEqual(mockStats);
            expect(mockCacheService.getStats).toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        it('should throw error when not initialized', async () => {
            const uninitializedService = new APIService();

            await expect(uninitializedService.fetchBusinesses()).rejects.toThrow('APIService is not initialized');
        });

        it('should throw error when destroyed', async () => {
            await apiService.destroy();

            await expect(apiService.fetchBusinesses()).rejects.toThrow('APIService is not initialized');
        });

        it('should handle validation errors', async () => {
            mockCacheService.get.mockReturnValue(null);
            mockHttpClient.get.mockResolvedValue({
                data: null, // Invalid response
                status: 200,
                statusText: 'OK',
                headers: new Headers(),
                url: 'https://test-api.com/api/benefits'
            });

            const result = await apiService.fetchBusinesses();

            // Should fall back to mock data on validation error
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('should handle businesses with no benefits', async () => {
            const responseWithNoBenefits = {
                TEST_BANK: [
                    {
                        _id: { $oid: '507f1f77bcf86cd799439011' },
                        id: 'test',
                        beneficios: [], // Empty benefits array
                        cabecera: 'Test Business',
                        details: {
                            beneficio: {
                                titulo: 'Test Business',
                                rubros: [{ id: 1, nombre: 'gastronomia' }]
                            }
                        }
                    }
                ]
            };

            mockCacheService.get.mockReturnValue(null);
            mockHttpClient.get.mockResolvedValue({
                data: responseWithNoBenefits,
                status: 200,
                statusText: 'OK',
                headers: new Headers(),
                url: 'https://test-api.com/api/benefits'
            });

            const result = await apiService.fetchBusinesses();

            expect(result).toHaveLength(1);
            expect(result[0].benefits).toHaveLength(1); // Should still create a benefit with default values
        });

        it('should handle duplicate business titles', async () => {
            const responseWithDuplicates = {
                BANK_A: [
                    {
                        _id: { $oid: '1' },
                        id: 'test-1',
                        beneficios: [{ valor: '10%', casuistica: { descripcion: 'Benefit A' } }],
                        cabecera: 'Test Business',
                        details: {
                            beneficio: {
                                titulo: 'Same Business',
                                rubros: [{ id: 1, nombre: 'gastronomia' }]
                            }
                        }
                    }
                ],
                BANK_B: [
                    {
                        _id: { $oid: '2' },
                        id: 'test-2',
                        beneficios: [{ valor: '15%', casuistica: { descripcion: 'Benefit B' } }],
                        cabecera: 'Test Business',
                        details: {
                            beneficio: {
                                titulo: 'Same Business', // Same title
                                rubros: [{ id: 1, nombre: 'gastronomia' }]
                            }
                        }
                    }
                ]
            };

            mockCacheService.get.mockReturnValue(null);
            mockHttpClient.get.mockResolvedValue({
                data: responseWithDuplicates,
                status: 200,
                statusText: 'OK',
                headers: new Headers(),
                url: 'https://test-api.com/api/benefits'
            });

            const result = await apiService.fetchBusinesses();

            expect(result).toHaveLength(1); // Should merge into one business
            expect(result[0].benefits).toHaveLength(2); // Should have benefits from both banks
        });
    });
});