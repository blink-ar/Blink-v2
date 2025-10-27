import { describe, it, expect, beforeEach } from 'vitest';
import { CategoryFilterServiceImpl, CategoryConfig } from '../CategoryFilterService';
import { Business, Category, CanonicalLocation } from '../../types';

// Helper function to create a location object for tests
const createTestLocation = (address: string): CanonicalLocation[] => [{
    lat: 0,
    lng: 0,
    formattedAddress: address,
    source: 'address' as const,
    provider: 'google' as const,
    confidence: 1.0,
    raw: address,
    updatedAt: new Date().toISOString()
}];

describe('CategoryFilterService', () => {
    let service: CategoryFilterServiceImpl;
    let mockBusinesses: Business[];

    beforeEach(() => {
        service = new CategoryFilterServiceImpl();
        mockBusinesses = [
            {
                id: '1',
                name: 'Restaurant Gastronomico',
                category: 'gastronomia premium',
                description: 'Fine dining',
                rating: 4.5,
                location: createTestLocation('Downtown'),
                image: 'image1.jpg',
                benefits: []
            },
            {
                id: '2',
                name: 'Moda Store',
                category: 'moda y accesorios',
                description: 'Fashion store',
                rating: 4.2,
                location: createTestLocation('Mall'),
                image: 'image2.jpg',
                benefits: []
            },
            {
                id: '3',
                name: 'Tech Store',
                category: 'electrodomesticos',
                description: 'Electronics',
                rating: 4.0,
                location: createTestLocation('Tech District'),
                image: 'image3.jpg',
                benefits: []
            },
            {
                id: '4',
                name: 'Home Decor',
                category: 'decoracion hogar',
                description: 'Home decoration',
                rating: 4.3,
                location: createTestLocation('Home Center'),
                image: 'image4.jpg',
                benefits: []
            },
            {
                id: '5',
                name: 'Sports Store',
                category: 'deportes extremos',
                description: 'Sports equipment',
                rating: 4.1,
                location: createTestLocation('Sports Complex'),
                image: 'image5.jpg',
                benefits: []
            }
        ];
    });

    describe('filterBusinessesByCategory', () => {
        it('should return all businesses when category is "all"', () => {
            const result = service.filterBusinessesByCategory(mockBusinesses, 'all');
            expect(result).toHaveLength(5);
            expect(result).toEqual(mockBusinesses);
        });

        it('should filter businesses by gastronomia category using includes matching', () => {
            const result = service.filterBusinessesByCategory(mockBusinesses, 'gastronomia');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('1');
            expect(result[0].category).toBe('gastronomia premium');
        });

        it('should filter businesses by moda category using includes matching', () => {
            const result = service.filterBusinessesByCategory(mockBusinesses, 'moda');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('2');
            expect(result[0].category).toBe('moda y accesorios');
        });

        it('should filter businesses by electro category using multiple patterns', () => {
            const result = service.filterBusinessesByCategory(mockBusinesses, 'electro');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('3');
            expect(result[0].category).toBe('electrodomesticos');
        });

        it('should filter businesses by hogar category using multiple patterns', () => {
            const result = service.filterBusinessesByCategory(mockBusinesses, 'hogar');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('4');
            expect(result[0].category).toBe('decoracion hogar');
        });

        it('should filter businesses by deportes category', () => {
            const result = service.filterBusinessesByCategory(mockBusinesses, 'deportes');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('5');
            expect(result[0].category).toBe('deportes extremos');
        });

        it('should return empty array when no businesses match category', () => {
            const result = service.filterBusinessesByCategory(mockBusinesses, 'viajes');
            expect(result).toHaveLength(0);
        });

        it('should handle businesses with non-string categories', () => {
            const businessesWithInvalidCategory = [
                ...mockBusinesses,
                {
                    id: '6',
                    name: 'Invalid Business',
                    category: null as any,
                    description: 'Invalid category',
                    rating: 3.0,
                    location: createTestLocation('Unknown'),
                    image: 'image6.jpg',
                    benefits: []
                }
            ];

            const result = service.filterBusinessesByCategory(businessesWithInvalidCategory, 'gastronomia');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('1');
        });

        it('should fallback to exact matching when category config not found', () => {
            const unknownCategory = 'unknown_category' as Category;
            const businessWithUnknownCategory: Business = {
                id: '7',
                name: 'Unknown Business',
                category: 'unknown_category',
                description: 'Unknown category business',
                rating: 3.5,
                location: createTestLocation('Unknown'),
                image: 'image7.jpg',
                benefits: []
            };

            const result = service.filterBusinessesByCategory([businessWithUnknownCategory], unknownCategory);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('7');
        });

        it('should be case insensitive', () => {
            const businessWithUpperCase: Business = {
                id: '8',
                name: 'Upper Case Business',
                category: 'GASTRONOMIA PREMIUM',
                description: 'Upper case category',
                rating: 4.0,
                location: createTestLocation('Uptown'),
                image: 'image8.jpg',
                benefits: []
            };

            const result = service.filterBusinessesByCategory([businessWithUpperCase], 'gastronomia');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('8');
        });
    });

    describe('getCategoryConfig', () => {
        it('should return all category configurations', () => {
            const configs = service.getCategoryConfig();
            expect(configs).toHaveLength(14); // All default categories
            expect(configs.find(c => c.value === 'all')).toBeDefined();
            expect(configs.find(c => c.value === 'gastronomia')).toBeDefined();
            expect(configs.find(c => c.value === 'moda')).toBeDefined();
        });

        it('should return a copy of configurations (not reference)', () => {
            const configs1 = service.getCategoryConfig();
            const configs2 = service.getCategoryConfig();
            expect(configs1).not.toBe(configs2);
            expect(configs1).toEqual(configs2);
        });
    });

    describe('addCategoryConfig', () => {
        it('should add new category configuration', () => {
            const newConfig: CategoryConfig = {
                value: 'otros' as Category,
                label: 'Test Category',
                patterns: ['test'],
                matchType: 'includes'
            };

            service.addCategoryConfig(newConfig);
            const configs = service.getCategoryConfig();
            const addedConfig = configs.find(c => c.value === 'otros');

            expect(addedConfig).toBeDefined();
            expect(addedConfig?.label).toBe('Test Category');
            expect(addedConfig?.patterns).toEqual(['test']);
            expect(addedConfig?.matchType).toBe('includes');
        });

        it('should update existing category configuration', () => {
            const updatedConfig: CategoryConfig = {
                value: 'gastronomia',
                label: 'Updated Gastronomía',
                patterns: ['gastronom', 'restaurant'],
                matchType: 'startsWith'
            };

            service.addCategoryConfig(updatedConfig);
            const configs = service.getCategoryConfig();
            const config = configs.find(c => c.value === 'gastronomia');

            expect(config?.label).toBe('Updated Gastronomía');
            expect(config?.patterns).toEqual(['gastronom', 'restaurant']);
            expect(config?.matchType).toBe('startsWith');
        });
    });

    describe('different match types', () => {
        let customService: CategoryFilterServiceImpl;

        beforeEach(() => {
            const customConfigs: CategoryConfig[] = [
                {
                    value: 'exact_test' as Category,
                    label: 'Exact Test',
                    patterns: ['exact'],
                    matchType: 'exact'
                },
                {
                    value: 'starts_test' as Category,
                    label: 'Starts Test',
                    patterns: ['start'],
                    matchType: 'startsWith'
                },
                {
                    value: 'includes_test' as Category,
                    label: 'Includes Test',
                    patterns: ['incl'],
                    matchType: 'includes'
                }
            ];
            customService = new CategoryFilterServiceImpl(customConfigs);
        });

        it('should match exactly with exact matchType', () => {
            const businesses: Business[] = [
                { ...mockBusinesses[0], id: '1', category: 'exact' },
                { ...mockBusinesses[0], id: '2', category: 'exact match' },
                { ...mockBusinesses[0], id: '3', category: 'not exact' }
            ];

            const result = customService.filterBusinessesByCategory(businesses, 'exact_test' as Category);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('1');
        });

        it('should match prefix with startsWith matchType', () => {
            const businesses: Business[] = [
                { ...mockBusinesses[0], id: '1', category: 'start here' },
                { ...mockBusinesses[0], id: '2', category: 'starting point' },
                { ...mockBusinesses[0], id: '3', category: 'not start' }
            ];

            const result = customService.filterBusinessesByCategory(businesses, 'starts_test' as Category);
            expect(result).toHaveLength(2);
            expect(result.map(b => b.id)).toEqual(['1', '2']);
        });

        it('should match substring with includes matchType', () => {
            const businesses: Business[] = [
                { ...mockBusinesses[0], id: '1', category: 'includes here' },
                { ...mockBusinesses[0], id: '2', category: 'this incl that' },
                { ...mockBusinesses[0], id: '3', category: 'no match' }
            ];

            const result = customService.filterBusinessesByCategory(businesses, 'includes_test' as Category);
            expect(result).toHaveLength(2);
            expect(result.map(b => b.id)).toEqual(['1', '2']);
        });
    });

    describe('multiple patterns', () => {
        it('should match any of multiple patterns', () => {
            const businesses: Business[] = [
                { ...mockBusinesses[0], id: '1', category: 'electrodomesticos' },
                { ...mockBusinesses[0], id: '2', category: 'tecnologia avanzada' },
                { ...mockBusinesses[0], id: '3', category: 'moda y estilo' }
            ];

            const result = service.filterBusinessesByCategory(businesses, 'electro');
            expect(result).toHaveLength(2);
            expect(result.map(b => b.id)).toEqual(['1', '2']);
        });
    });
});