import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Business } from '../types';
import { RawMongoBenefit } from '../types/mongodb';
import { fetchAllBusinessesComplete } from '../services/api';
import { getRawBenefits } from '../services/rawBenefitsApi';

// Query keys for cache management
export const queryKeys = {
    businesses: ['businesses'] as const,
    featuredBenefits: ['featuredBenefits'] as const,
};

interface UseBenefitsDataReturn {
    businesses: Business[];
    rawBenefits: RawMongoBenefit[];
    featuredBenefits: RawMongoBenefit[];
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
    refreshData: () => Promise<void>;
    clearCache: () => void;
}

/**
 * Hook for accessing benefits data with React Query caching
 *
 * Uses TanStack Query for:
 * - Automatic caching (in-memory)
 * - Request deduplication
 * - Background refetching
 * - Retry logic on failure
 */
export function useBenefitsData(): UseBenefitsDataReturn {
    const queryClient = useQueryClient();

    // Fetch all businesses
    const {
        data: businesses = [],
        isLoading: isLoadingBusinesses,
        isFetching: isFetchingBusinesses,
        error: businessesError,
        refetch: refetchBusinesses,
    } = useQuery({
        queryKey: queryKeys.businesses,
        queryFn: fetchAllBusinessesComplete,
    });

    // Fetch featured benefits (first 10)
    const {
        data: featuredBenefits = [],
        isLoading: isLoadingFeatured,
        isFetching: isFetchingFeatured,
        error: featuredError,
        refetch: refetchFeatured,
    } = useQuery({
        queryKey: queryKeys.featuredBenefits,
        queryFn: () => getRawBenefits({ limit: 10 }),
    });

    const isLoading = isLoadingBusinesses || isLoadingFeatured;
    const isRefreshing = (isFetchingBusinesses || isFetchingFeatured) && !isLoading;

    const error = businessesError
        ? (businessesError as Error).message
        : featuredError
            ? (featuredError as Error).message
            : null;

    const refreshData = async () => {
        await Promise.all([
            refetchBusinesses(),
            refetchFeatured(),
        ]);
    };

    const clearCache = () => {
        queryClient.clear();
    };

    return {
        businesses,
        rawBenefits: featuredBenefits,
        featuredBenefits,
        isLoading,
        isRefreshing,
        error,
        refreshData,
        clearCache,
    };
}

/**
 * Hook for accessing only businesses data (lighter version)
 */
export function useBusinessesData() {
    const {
        data: businesses = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: queryKeys.businesses,
        queryFn: fetchAllBusinessesComplete,
    });

    return {
        businesses,
        isLoading,
        error: error ? (error as Error).message : null,
    };
}

/**
 * Hook for accessing only featured benefits (lighter version)
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
