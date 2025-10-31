import { useState, useEffect, useCallback } from 'react';
import { Business } from '../types';
import { RawMongoBenefit } from '../types/mongodb';
import { getBenefitsDataService } from '../services/BenefitsDataService';

interface UseBenefitsDataReturn {
    // Data
    businesses: Business[];
    rawBenefits: RawMongoBenefit[];
    featuredBenefits: RawMongoBenefit[];

    // Loading states
    isLoading: boolean;
    isRefreshing: boolean;

    // Error state
    error: string | null;

    // Actions
    refreshData: () => Promise<void>;
    clearCache: () => void;

    // Cache info
    isCached: boolean;
    cacheStats: {
        totalEntries: number;
        totalSize: number;
        hitRate: number;
        missRate: number;
        oldestEntry: number;
        newestEntry: number;
    } | null;
}

/**
 * Hook for accessing cached benefits data
 * 
 * This hook provides a unified interface to all benefits data with caching,
 * preventing unnecessary API calls when navigating between pages.
 */
export function useBenefitsData(): UseBenefitsDataReturn {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [rawBenefits, setRawBenefits] = useState<RawMongoBenefit[]>([]);
    const [featuredBenefits, setFeaturedBenefits] = useState<RawMongoBenefit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize data service and load initial data
    useEffect(() => {
        let isMounted = true;

        const initializeAndLoadData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Initialize the service
                const dataService = getBenefitsDataService();
                await dataService.initialize();

                if (!isMounted) return;

                // Check if we have cached data
                const hasBusinessesCache = dataService.isDataCached('businesses');
                const hasFeaturedCache = dataService.isDataCached('featured_benefits');

                // Load data (will use cache if available)
                const [businessesData, featuredData] = await Promise.all([
                    dataService.getAllBusinesses(),
                    dataService.getFeaturedBenefits()
                ]);

                if (!isMounted) return;

                setBusinesses(businessesData);
                setFeaturedBenefits(featuredData);
                setRawBenefits(featuredData); // For now, use featured as raw benefits

            } catch (err) {
                if (!isMounted) return;

                const errorMessage = err instanceof Error ? err.message : 'Failed to load benefits data';
                setError(errorMessage);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        initializeAndLoadData();

        return () => {
            isMounted = false;
        };
    }, []);

    // Refresh data function
    const refreshData = useCallback(async () => {
        try {
            setIsRefreshing(true);
            setError(null);



            // Force refresh all data
            const dataService = getBenefitsDataService();
            const [businessesData, featuredData] = await Promise.all([
                dataService.getAllBusinesses(true),
                dataService.getFeaturedBenefits(true)
            ]);

            setBusinesses(businessesData);
            setFeaturedBenefits(featuredData);
            setRawBenefits(featuredData);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to refresh benefits data';
            setError(errorMessage);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // Clear cache function
    const clearCache = useCallback(() => {
        getBenefitsDataService().clearCache();
    }, []);

    // Get cache info
    const dataService = getBenefitsDataService();
    const isCached = dataService.isDataCached('businesses') &&
        dataService.isDataCached('featured_benefits');

    const cacheStats = dataService.getCacheStats();

    return {
        // Data
        businesses,
        rawBenefits,
        featuredBenefits,

        // Loading states
        isLoading,
        isRefreshing,

        // Error state
        error,

        // Actions
        refreshData,
        clearCache,

        // Cache info
        isCached,
        cacheStats
    };
}

/**
 * Hook for accessing only businesses data (lighter version)
 */
export function useBusinessesData() {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadBusinesses = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const dataService = getBenefitsDataService();
                await dataService.initialize();

                if (!isMounted) return;

                const businessesData = await dataService.getAllBusinesses();

                if (!isMounted) return;

                setBusinesses(businessesData);

            } catch (err) {
                if (!isMounted) return;

                const errorMessage = err instanceof Error ? err.message : 'Failed to load businesses';
                setError(errorMessage);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadBusinesses();

        return () => {
            isMounted = false;
        };
    }, []);

    return { businesses, isLoading, error };
}

/**
 * Hook for accessing only featured benefits (lighter version)
 */
export function useFeaturedBenefits() {
    const [featuredBenefits, setFeaturedBenefits] = useState<RawMongoBenefit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadFeatured = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const dataService = getBenefitsDataService();
                await dataService.initialize();

                if (!isMounted) return;

                const featuredData = await dataService.getFeaturedBenefits();

                if (!isMounted) return;

                setFeaturedBenefits(featuredData);

            } catch (err) {
                if (!isMounted) return;

                const errorMessage = err instanceof Error ? err.message : 'Failed to load featured benefits';
                setError(errorMessage);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadFeatured();

        return () => {
            isMounted = false;
        };
    }, []);

    return { featuredBenefits, isLoading, error };
}