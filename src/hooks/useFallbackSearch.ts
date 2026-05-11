import { useQuery } from '@tanstack/react-query';
import { fetchBusinessesPaginated } from '../services/api';
import { useGeolocation } from './useGeolocation';
import { encodeGeohash } from '../utils/geohash';
import { BenefitsFilters, queryKeys } from './useBenefitsData';

interface FallbackSearchParams {
  primaryResultsEmpty: boolean;
  filters: BenefitsFilters;
  searchIntentSignature: string;
}

export function useFallbackSearch({ primaryResultsEmpty, filters, searchIntentSignature }: FallbackSearchParams) {
  const { position, loading: positionLoading } = useGeolocation();

  const hasSelectedBanks = !!filters.bank;
  const hasSearchTerm = !!(filters.search && filters.search.trim().length > 0);

  const wantsSortByDistance = filters.sortByDistance ?? false;
  const sortByDistance = wantsSortByDistance && position !== null;
  const geohash = !sortByDistance && position
    ? encodeGeohash(position.latitude, position.longitude)
    : undefined;

  const baseQueryKey = sortByDistance
    ? ['exact', position!.latitude, position!.longitude]
    : [geohash];

  // Case 1: Same search without bank filter — are there results in other banks?
  const {
    data: otherBanksData,
    isLoading: isOtherBanksLoading,
  } = useQuery({
    queryKey: [
      ...queryKeys.businesses,
      'fallback_other_banks',
      ...baseQueryKey,
      searchIntentSignature,
    ],
    queryFn: () =>
      fetchBusinessesPaginated({
        limit: 10,
        offset: 0,
        search: filters.search,
        category: filters.category,
        ...(sortByDistance && position
          ? { lat: position.latitude, lng: position.longitude }
          : geohash ? { geohash } : {}),
        online: filters.onlineOnly,
      }),
    enabled: !!(primaryResultsEmpty && hasSelectedBanks && !positionLoading),
    staleTime: 1000 * 60 * 5,
  });

  // Case 2: No results at all — fetch general popular results (no search, no category filter)
  const {
    data: relativeData,
    isLoading: isRelativeLoading,
  } = useQuery({
    queryKey: [
      ...queryKeys.businesses,
      'fallback_popular',
      ...baseQueryKey,
    ],
    queryFn: () =>
      fetchBusinessesPaginated({
        limit: 10,
        offset: 0,
        ...(sortByDistance && position
          ? { lat: position.latitude, lng: position.longitude }
          : geohash ? { geohash } : {}),
      }),
    enabled: !!(primaryResultsEmpty && hasSearchTerm && !positionLoading),
    staleTime: 1000 * 60 * 10,
  });

  return {
    otherBanksBusinesses: otherBanksData?.businesses ?? [],
    resolvedTotalOtherBanks: otherBanksData?.pagination.total ?? 0,
    isOtherBanksLoading,
    relativeBusinesses: relativeData?.businesses ?? [],
    isRelativeLoading,
  };
}
