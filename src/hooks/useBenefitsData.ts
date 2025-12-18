import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Business } from '../types';
import { RawMongoBenefit } from '../types/mongodb';
import { fetchBusinessesPaginated, BusinessesApiResponse } from '../services/api';
import { getRawBenefits } from '../services/rawBenefitsApi';
import { useGeolocation } from './useGeolocation';

// Query keys for cache management
export const queryKeys = {
    businesses: ['businesses'] as const,
    featuredBenefits: ['featuredBenefits'] as const,
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
}

/**
 * Hook for accessing benefits data with React Query
 * Uses the new /api/businesses endpoint with proper server-side pagination
 */
export function useBenefitsData(): UseBenefitsDataReturn {
    const { position, loading: positionLoading } = useGeolocation();

    // Fetch businesses with infinite query for pagination
    // Wait for position to finish loading before starting the query
    const {
        data,
        isLoading: isLoadingBusinesses,
        isFetchingNextPage,
        error: businessesError,
        fetchNextPage,
        hasNextPage,
        refetch: refetchBusinesses,
    } = useInfiniteQuery({
        queryKey: queryKeys.businesses,
        queryFn: async ({ pageParam = 0 }) => {
            return fetchBusinessesPaginated({
                limit: ITEMS_PER_PAGE,
                offset: pageParam,
                ...(position && {
                    lat: position.latitude,
                    lng: position.longitude,
                }),
            });
        },
        getNextPageParam: (lastPage: BusinessesApiResponse) => {
            if (lastPage.pagination.hasMore) {
                return lastPage.pagination.offset + lastPage.pagination.limit;
            }
            return undefined;
        },
        initialPageParam: 0,
        enabled: !positionLoading, // Wait for position to finish loading
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
    };
}

/**
 * Hook for accessing only businesses data with pagination
 */
export function useBusinessesData() {
    const { position, loading: positionLoading } = useGeolocation();

    const {
        data,
        isLoading,
        isFetchingNextPage,
        error,
        fetchNextPage,
        hasNextPage,
    } = useInfiniteQuery({
        queryKey: queryKeys.businesses,
        queryFn: async ({ pageParam = 0 }) => {
            return fetchBusinessesPaginated({
                limit: ITEMS_PER_PAGE,
                offset: pageParam,
                ...(position && {
                    lat: position.latitude,
                    lng: position.longitude,
                }),
            });
        },
        getNextPageParam: (lastPage: BusinessesApiResponse) => {
            if (lastPage.pagination.hasMore) {
                return lastPage.pagination.offset + lastPage.pagination.limit;
            }
            return undefined;
        },
        initialPageParam: 0,
        enabled: !positionLoading, // Wait for position to finish loading
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
