import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBusinessFilter } from '../useBusinessFilter';
import { Business, Category } from '../../types';

describe('useBusinessFilter', () => {
    let mockBusinesses: Business[];

    beforeEach(() => {
        mockBusinesses = [
            {
                id: '1',
                name: 'Restaurant Gastronomico',
                category: 'gastronomia premium',
                description: 'Fine dining restaurant',
                rating: 4.5,
                location: 'Downtown',
                image: 'image1.jpg',
                benefits: []
            },
            {
                id: '2',
                name: 'Moda Boutique',
                category: 'moda y accesorios',
                description: 'Fashion boutique',
                rating: 4.2,
                location: 'Shopping Mall',
                image: 'image2.jpg',
                benefits: []
            },
            {
                id: '3',
                name: 'Tech Store',
                category: 'electrodomesticos',
                description: 'Electronics and technology',
                rating: 4.0,
                location: 'Tech District',
                image: 'image3.jpg',
                benefits: []
            },
            {
                id: '4',
                name: 'Home Decor',
                category: 'decoracion hogar',
                description: 'Home decoration items',
                rating: 4.3,
                location: 'Home Center',
                image: 'image4.jpg',
                benefits: []
            },
            {
                id: '5',
                name: 'Sports Equipment',
                category: 'deportes extremos',
                description: 'Sports and outdoor equipment',
                rating: 4.1,
                location: 'Sports Complex',
                image: 'image5.jpg',
                benefits: []
            }
        ];
    });

    describe('category filtering', () => {
        it('should return all businesses when category is "all"', () => {
            const { result } = renderHook(() => useBusinessFilter(mockBusinesses));

            expect(result.current.selectedCategory).toBe('all');
            expect(result.current.filteredBusinesses).toHaveLength(5);
            expect(result.current.filteredBusinesses).toEqual(mockBusinesses);
        });

        it('should filter businesses by gastronomia category', () => {
            const { result } = renderHook(() => useBusinessFilter(mockBusinesses));

            act(() => {
                result.current.setSelectedCategory('gastronomia');
            });

            expect(result.current.selectedCategory).toBe('gastronomia');
            expect(result.current.filteredBusinesses).toHaveLength(1);
            expect(result.current.filteredBusinesses[0].id).toBe('1');
        });

        it('should filter businesses by moda category', () => {
            const { result } = renderHook(() => useBusinessFilter(mockBusinesses));

            act(() => {
                result.current.setSelectedCategory('moda');
            });

            expect(result.current.filteredBusinesses).toHaveLength(1);
            expect(result.current.filteredBusinesses[0].id).toBe('2');
        });

        it('should filter businesses by electro category', () => {
            const { result } = renderHook(() => useBusinessFilter(mockBusinesses));

            act(() => {
                result.current.setSelectedCategory('electro');
            });

            expect(result.current.filteredBusinesses).toHaveLength(1);
            expect(result.current.filteredBusinesses[0].id).toBe('3');
        });

        it('should filter businesses by hogar category', () => {
            const { result } = renderHook(() => useBusinessFilter(mockBusinesses));

            act(() => {
                result.current.setSelectedCategory('hogar');
            });

            expect(result.current.filteredBusinesses).toHaveLength(1);
            expect(result.current.filteredBusinesses[0].id).toBe('4');
        });

        it('should filter businesses by deportes category', () => {
            const { result } = renderHook(() => useBusinessFilter(mockBusinesses));

            act(() => {
                result.current.setSelectedCategory('deportes');
            });

            expect(result.current.filteredBusinesses).toHaveLength(1);
            expect(result.current.filteredBusinesses[0].id).toBe('5');
        });

        it('should return empty array when no businesses match category', () => {
            const { result } = renderHook(() => useBusinessFilter(mockBusinesses));

            act(() => {
                result.current.setSelectedCategory('viajes');
            });

            expect(result.current.filteredBusinesses).toHaveLength(0);
        });
    });

    describe('search filtering', () => {
        it('should filter businesses by name', () => {
            const { result } = renderHook(() => useBusinessFilter(mockBusinesses));

            act(() => {
                result.current.setSearchTerm('Restaurant');
            });

            expect(result.current.filteredBusinesses).toHaveLength(1);
            expect(result.current.filteredBusinesses[0].id).toBe('1');
        });

        it('should filter businesses by description', () => {
            const { result } = renderHook(() => useBusinessFilter(mockBusinesses));

            act(() => {
                result.current.setSearchTerm('Fashion');
            });

            expect(result.current.filteredBusinesses).toHaveLength(1);
            expect(result.current.filteredBusinesses[0].id).toBe('2');
        });

        it('should filter businesses by location', () => {
            const { result } = renderHook(() => useBusinessFilter(mockBusinesses));

            act(() => {
                result.current.setSearchTerm('Downtown');
            });

            expect(result.current.filteredBusinesses).toHaveLength(1);
            expect(result.current.filteredBusinesses[0].id).toBe('1');
        });

        it('should filter businesses by category string', () => {
            const { result } = renderHook(() => useBusinessFilter(mockBusinesses));

            act(() => {
                result.current.setSearchTerm('electrodomesticos');
            });

            expect(result.current.filteredBusinesses).toHaveLength(1);
            expect(result.current.filteredBusinesses[0].id).toBe('3');
        });

        it('should be case insensitive', () => {
            const { result } = renderHook(() => useBusinessFilter(mockBusinesses));

            act(() => {
                result.current.setSearchTerm('RESTAURANT');
            });

            expect(result.current.filteredBusinesses).toHaveLength(1);
            expect(result.current.filteredBusinesses[0].id).toBe('1');
        });

        it('should return all businesses when search term is empty', () => {
            const { result } = renderHook(() => useBusinessFilter(mockBusinesses));

            act(() => {
                result.current.setSearchTerm('');
            });

            expect(result.current.filteredBusinesses).toHaveLength(5);
        });

        it('should handle whitespace-only search terms', () => {
            const { result } = renderHook(() => useBusinessFilter(mockBusinesses));

            act(() => {
                result.current.setSearchTerm('   ');
            });

            expect(result.current.filteredBusinesses).toHaveLength(5);
        });
    });

    describe('combined filtering', () => {
        it('should apply both category and search filters', () => {
            const { result } = renderHook(() => useBusinessFilter(mockBusinesses));

            act(() => {
                result.current.setSelectedCategory('gastronomia');
                result.current.setSearchTerm('Fine');
            });

            expect(result.current.filteredBusinesses).toHaveLength(1);
            expect(result.current.filteredBusinesses[0].id).toBe('1');
        });

        it('should return empty when search does not match filtered category', () => {
            const { result } = renderHook(() => useBusinessFilter(mockBusinesses));

            act(() => {
                result.current.setSelectedCategory('gastronomia');
                result.current.setSearchTerm('Technology');
            });

            expect(result.current.filteredBusinesses).toHaveLength(0);
        });

        it('should work with category filter and partial name match', () => {
            const { result } = renderHook(() => useBusinessFilter(mockBusinesses));

            act(() => {
                result.current.setSelectedCategory('moda');
                result.current.setSearchTerm('Boutique');
            });

            expect(result.current.filteredBusinesses).toHaveLength(1);
            expect(result.current.filteredBusinesses[0].id).toBe('2');
        });
    });

    describe('state management', () => {
        it('should initialize with default values', () => {
            const { result } = renderHook(() => useBusinessFilter(mockBusinesses));

            expect(result.current.searchTerm).toBe('');
            expect(result.current.selectedCategory).toBe('all');
        });

        it('should update search term', () => {
            const { result } = renderHook(() => useBusinessFilter(mockBusinesses));

            act(() => {
                result.current.setSearchTerm('test search');
            });

            expect(result.current.searchTerm).toBe('test search');
        });

        it('should update selected category', () => {
            const { result } = renderHook(() => useBusinessFilter(mockBusinesses));

            act(() => {
                result.current.setSelectedCategory('moda');
            });

            expect(result.current.selectedCategory).toBe('moda');
        });
    });

    describe('edge cases', () => {
        it('should handle empty businesses array', () => {
            const { result } = renderHook(() => useBusinessFilter([]));

            expect(result.current.filteredBusinesses).toHaveLength(0);
        });

        it('should handle businesses with null/undefined category', () => {
            const businessesWithInvalidCategory = [
                ...mockBusinesses,
                {
                    id: '6',
                    name: 'Invalid Business',
                    category: null as any,
                    description: 'Business with null category',
                    rating: 3.0,
                    location: 'Unknown',
                    image: 'image6.jpg',
                    benefits: []
                }
            ];

            const { result } = renderHook(() => useBusinessFilter(businessesWithInvalidCategory));

            // Should include the business with null category when category is 'all'
            expect(result.current.filteredBusinesses).toHaveLength(6);

            // Should find the business by name search even with null category
            act(() => {
                result.current.setSearchTerm('Invalid');
            });

            expect(result.current.filteredBusinesses).toHaveLength(1);
            expect(result.current.filteredBusinesses[0].id).toBe('6');

            // Should not match when filtering by a specific category
            act(() => {
                result.current.setSearchTerm('');
                result.current.setSelectedCategory('gastronomia');
            });

            expect(result.current.filteredBusinesses).toHaveLength(1); // Only the gastronomia business
            expect(result.current.filteredBusinesses[0].id).toBe('1');
        });
    });
});