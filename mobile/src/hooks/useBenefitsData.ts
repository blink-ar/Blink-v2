import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Business } from '../types';
import { RawMongoBenefit } from '../types/mongodb';
import { fetchBusinessesPaginated, BusinessesApiResponse } from '../services/api';
import { getRawBenefits } from '../services/rawBenefitsApi';
import { useGeolocation } from './useGeolocation';
import { ITEMS_PER_PAGE } from '../constants';

export const queryKeys = {
  businesses: ['businesses'] as const,
  featuredBenefits: ['featuredBenefits'] as const,
};

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

export interface BenefitsFilters {
  search?: string;
  category?: string;
  bank?: string;
  minDiscount?: number;
  maxDistance?: number;
  availableDay?: string;
  network?: string;
  cardMode?: 'credit' | 'debit';
  hasInstallments?: boolean;
}

export function useBenefitsData(filters?: BenefitsFilters): UseBenefitsDataReturn {
  const { position, loading: positionLoading } = useGeolocation();

  const {
    data,
    isLoading: isLoadingBusinesses,
    isFetchingNextPage,
    error: businessesError,
    fetchNextPage,
    hasNextPage,
    refetch: refetchBusinesses,
  } = useInfiniteQuery({
    queryKey: [...queryKeys.businesses, filters],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchBusinessesPaginated({
        limit: ITEMS_PER_PAGE,
        offset: pageParam,
        ...(position && {
          lat: position.latitude,
          lng: position.longitude,
        }),
        ...(filters?.search && { search: filters.search }),
        ...(filters?.category && filters.category !== 'all' && { category: filters.category }),
        ...(filters?.bank && { bank: filters.bank }),
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

  const {
    data: featuredBenefits = [],
    isLoading: isLoadingFeatured,
    error: featuredError,
    refetch: refetchFeatured,
  } = useQuery({
    queryKey: queryKeys.featuredBenefits,
    queryFn: () => getRawBenefits({ limit: 10 }),
  });

  const businesses = useMemo(() => {
    const allBusinesses = data?.pages.flatMap(page => page.businesses) ?? [];
    const seenIds = new Set();
    return allBusinesses.filter(business => {
      if (seenIds.has(business.id)) return false;
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
    await Promise.all([refetchBusinesses(), refetchFeatured()]);
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
    enabled: !positionLoading,
    staleTime: 0,
  });

  const businesses = useMemo(() => {
    const allBusinesses = data?.pages.flatMap(page => page.businesses) ?? [];
    const seenIds = new Set();
    return allBusinesses.filter(business => {
      if (seenIds.has(business.id)) return false;
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
      if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
  };
}
