import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Business } from '../types';
import { RawMongoBenefit } from '../types/mongodb';
import { fetchBusinessesPaginated, BusinessesApiResponse } from '../services/api';
import { getRawBenefits } from '../services/rawBenefitsApi';
import { useGeolocation } from './useGeolocation';
import { encodeGeohash } from '../utils/geohash';

// Query keys for cache management
export const queryKeys = {
    businesses: ['businesses'] as const,
    featuredBenefits: ['featuredBenefits'] as const,
    subscriptions: ['bankSubscriptions'] as const,
};

const ITEMS_PER_PAGE = 20;

interface UseBenefitsDataReturn {
    businesses: Business[];
    featuredBenefits: RawMongoBenefit[];
    isLoading: boolean;
    isLoadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    loadMore: () => void;
    refreshData: () => Promise<void>;
    totalBusinesses: number;
    /** True when the user wants proximity sort but geolocation is unavailable/denied */
    proximityUnavailable: boolean;
}

export interface BenefitsFilters {
    search?: string;
    category?: string;
    bank?: string;
    subscription?: string; // Bank subscription ID from bank_subscriptions collection
    // New filters
    minDiscount?: number; // Minimum discount percentage
    maxDistance?: number; // Maximum distance in km
    availableDay?: string; // Specific day of the week (e.g., 'monday', 'today')
    network?: string; // Payment network (VISA, Mastercard, etc.)
    cardMode?: 'credit' | 'debit'; // Card type
    hasInstallments?: boolean; // Filter for installment availability
    sortByDistance?: boolean; // Send exact coords to server for precise distance sort (bypasses CDN)
}

/**
 * Hook for accessing benefits data with React Query
 * Uses the new /api/businesses endpoint with proper server-side pagination and filtering
 */
export function useBenefitsData(filters?: BenefitsFilters): UseBenefitsDataReturn {
    const { position, loading: positionLoading } = useGeolocation();
    const wantsSortByDistance = filters?.sortByDistance ?? false;
    // Only use proximity sort when the filter is active AND we have real coordinates.
    // If position is null (geolocation denied/unavailable) we fall back to geohash.
    const sortByDistance = wantsSortByDistance && position !== null;
    const geohash = !sortByDistance && position
        ? encodeGeohash(position.latitude, position.longitude)
        : undefined;

    // Fetch businesses with infinite query for pagination.
    // sortByDistance=true → sends exact lat/lng to server (precise sort, bypasses CDN cache).
    // sortByDistance=false → sends geohash (CDN-cached, approximate proximity sort).
    const {
        data,
        isLoading: isLoadingBusinesses,
        isFetchingNextPage,
        error: businessesError,
        fetchNextPage,
        hasNextPage,
        refetch: refetchBusinesses,
    } = useInfiniteQuery({
        queryKey: sortByDistance
            ? [...queryKeys.businesses, 'exact', position!.latitude, position!.longitude, filters]
            : [...queryKeys.businesses, geohash, filters],
        queryFn: async ({ pageParam = 0 }) => {
            return fetchBusinessesPaginated({
                limit: ITEMS_PER_PAGE,
                offset: pageParam,
                ...(sortByDistance && position
                    ? { lat: position.latitude, lng: position.longitude }
                    : geohash ? { geohash } : {}),
                ...(filters?.search && { search: filters.search }),
                ...(filters?.category && filters.category !== 'all' && { category: filters.category }),
                ...(filters?.bank && { bank: filters.bank }),
                ...(filters?.subscription && { subscription: filters.subscription }),
            });
        },
        getNextPageParam: (lastPage: BusinessesApiResponse) => {
            if (lastPage.pagination.hasMore) {
                return lastPage.pagination.offset + lastPage.pagination.limit;
            }
            return undefined;
        },
        initialPageParam: 0,
        // Wait for geolocation to resolve (so the first request already has a geohash or
        // exact coordinates). Once geolocation settles, always fire — even if position is
        // null (denied). In that case sortByDistance stays false (see above), so we fall
        // back to the geohash/no-location key instead of the 'exact' key, preventing
        // pollution of the proximity-sorted cache entry.
        enabled: !positionLoading,
        staleTime: 0,
    });

    // No need for refetch useEffect - enabled option handles waiting for position

    // Fetch featured benefits
    const {
        data: featuredBenefits = [],
        isLoading: isLoadingFeatured,
        error: featuredError,
        refetch: refetchFeatured,
    } = useQuery({
        queryKey: queryKeys.featuredBenefits,
        queryFn: () => getRawBenefits({ limit: 10 }),
    });

    // Flatten all pages into a single array of businesses and deduplicate by ID
    const businesses = useMemo(() => {
        const allBusinesses = data?.pages.flatMap(page => page.businesses) ?? [];
        const seenIds = new Set();
        return allBusinesses.filter(business => {
            if (seenIds.has(business.id)) {
                return false;
            }
            seenIds.add(business.id);
            return true;
        });
    }, [data?.pages]);

    const totalBusinesses = data?.pages[0]?.pagination.total ?? 0;

    const isLoading = isLoadingBusinesses || isLoadingFeatured;
    const isLoadingMore = isFetchingNextPage;

    const error = businessesError
        ? (businessesError as Error).message
        : featuredError
            ? (featuredError as Error).message
            : null;

    const loadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const refreshData = async () => {
        await Promise.all([
            refetchBusinesses(),
            refetchFeatured(),
        ]);
    };

    return {
        businesses,
        featuredBenefits,
        isLoading,
        isLoadingMore,
        error,
        hasMore: hasNextPage ?? false,
        loadMore,
        refreshData,
        totalBusinesses,
        // True when user wants proximity sort but geolocation was denied/unavailable
        proximityUnavailable: wantsSortByDistance && !positionLoading && position === null,
    };
}

/**
 * Hook for accessing only businesses data with pagination
 */
export function useBusinessesData() {
    const { position, loading: positionLoading } = useGeolocation();
    const geohash = position ? encodeGeohash(position.latitude, position.longitude) : undefined;

    const {
        data,
        isLoading,
        isFetchingNextPage,
        error,
        fetchNextPage,
        hasNextPage,
    } = useInfiniteQuery({
        queryKey: [...queryKeys.businesses, geohash],
        queryFn: async ({ pageParam = 0 }) => {
            return fetchBusinessesPaginated({
                limit: ITEMS_PER_PAGE,
                offset: pageParam,
                ...(geohash && { geohash }),
            });
        },
        getNextPageParam: (lastPage: BusinessesApiResponse) => {
            if (lastPage.pagination.hasMore) {
                return lastPage.pagination.offset + lastPage.pagination.limit;
            }
            return undefined;
        },
        initialPageParam: 0,
        enabled: !positionLoading,
        staleTime: 0,
    });

    const businesses = useMemo(() => {
        const allBusinesses = data?.pages.flatMap(page => page.businesses) ?? [];
        const seenIds = new Set();
        return allBusinesses.filter(business => {
            if (seenIds.has(business.id)) {
                return false;
            }
            seenIds.add(business.id);
            return true;
        });
    }, [data?.pages]);

    return {
        businesses,
        isLoading,
        isLoadingMore: isFetchingNextPage,
        error: error ? (error as Error).message : null,
        hasMore: hasNextPage ?? false,
        loadMore: () => {
            if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        },
    };
}

/**
 * Hook for accessing only featured benefits
 */
export function useFeaturedBenefits() {
    const {
        data: featuredBenefits = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: queryKeys.featuredBenefits,
        queryFn: () => getRawBenefits({ limit: 10 }),
    });

    return {
        featuredBenefits,
        isLoading,
        error: error ? (error as Error).message : null,
    };
}
