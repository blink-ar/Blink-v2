import { useQuery, type QueryClient } from '@tanstack/react-query';
import { Business } from '../types';
import { fetchBusinessesPaginated } from '../services/api';

/**
 * Number of merchants pulled into the in-memory directory used for
 * instant, network-free search-as-you-type. Bounded so the one-time payload
 * stays small; the long tail beyond this is still served by the network
 * `/api/search` path, so nothing is lost — local search just covers the most
 * relevant merchants for an instant first paint.
 */
const DIRECTORY_SIZE = 200;

export const merchantDirectoryQueryKey = ['merchantDirectory', DIRECTORY_SIZE] as const;

const fetchDirectory = async (): Promise<Business[]> => {
  const response = await fetchBusinessesPaginated({ limit: DIRECTORY_SIZE, offset: 0 });
  return response.businesses ?? [];
};

/**
 * Warm the directory cache ahead of navigation (e.g. when the user shows
 * search intent on the home page) so instant matching is ready the moment they
 * land on the search page. No-op if it's already cached and fresh.
 */
export function prefetchMerchantDirectory(queryClient: QueryClient): void {
  queryClient.prefetchQuery({
    queryKey: merchantDirectoryQueryKey,
    queryFn: fetchDirectory,
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Loads a bounded, unfiltered, location-independent set of fully-hydrated
 * businesses once and keeps it cached. SearchPage filters this set on the
 * client for every keystroke so the store list reacts instantly, while the
 * debounced `/api/search` request backfills the authoritative complete result.
 *
 * Location-independent on purpose: the directory is only the corpus for text
 * matching, distance/proximity is layered on by the network results when they
 * arrive, which keeps this entry highly cacheable across the session.
 */
export function useMerchantDirectory() {
  const { data, isLoading } = useQuery({
    queryKey: merchantDirectoryQueryKey,
    queryFn: fetchDirectory,
    // The corpus rarely changes within a session and a slightly stale list is
    // perfectly fine for instant matching — keep it warm for a long time.
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  return {
    directory: data ?? [],
    isDirectoryLoading: isLoading,
  };
}
