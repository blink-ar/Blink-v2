import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Business } from '../types';
import { RawMongoBenefit } from '../types/mongodb';
import { fetchBusinessesPaginated, BusinessesApiResponse, getRawBenefits } from '../services/api';
import { useGeolocation } from './useGeolocation';
import { encodeGeohash } from '../utils/geohash';
import { ITEMS_PER_PAGE } from '../constants';

export const queryKeys = {
  businesses: ['businesses'] as const,
  featuredBenefits: ['featuredBenefits'] as const,
  subscriptions: ['bankSubscriptions'] as const,
};

export interface BenefitsFilters {
  search?: string;
  category?: string;
  bank?: string;
  subscription?: string;
  minDiscount?: number;
  maxDistance?: number;
  availableDay?: string;
  network?: string;
  cardMode?: 'credit' | 'debit';
  hasInstallments?: boolean;
  onlineOnly?: boolean;
  sortByDistance?: boolean;
}

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
  proximityUnavailable: boolean;
}

export function useBenefitsData(filters?: BenefitsFilters): UseBenefitsDataReturn {
  const { position, loading: positionLoading } = useGeolocation();
  const wantsSortByDistance = filters?.sortByDistance ?? false;
  const sortByDistance = wantsSortByDistance && position !== null;
  const geohash = !sortByDistance && position
    ? encodeGeohash(position.latitude, position.longitude)
    : undefined;

  const filtersKey = Object.fromEntries(
    Object.entries(filters || {}).filter(([, v]) => v !== undefined && v !== false && v !== '' && v !== 0),
  );

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
      ? [...queryKeys.businesses, 'exact', position!.latitude, position!.longitude, filtersKey]
      : [...queryKeys.businesses, geohash, filtersKey],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchBusinessesPaginated({
        limit: ITEMS_PER_PAGE,
        offset: pageParam as number,
        ...(sortByDistance && position
          ? { lat: position.latitude, lng: position.longitude }
          : geohash ? { geohash } : {}),
        ...(filters?.search && { search: filters.search }),
        ...(filters?.category && filters.category !== 'all' && { category: filters.category }),
        ...(filters?.bank && { bank: filters.bank }),
        ...(filters?.subscription && { subscription: filters.subscription }),
        ...(filters?.onlineOnly && { online: true }),
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
    const all = data?.pages.flatMap((page) => page.businesses) ?? [];
    const seen = new Set<string>();
    return all.filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
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
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
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
    proximityUnavailable: wantsSortByDistance && !positionLoading && position === null,
  };
}

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
        offset: pageParam as number,
        ...(geohash ? { geohash } : {}),
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
    const all = data?.pages.flatMap((page) => page.businesses) ?? [];
    const seen = new Set<string>();
    return all.filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
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
