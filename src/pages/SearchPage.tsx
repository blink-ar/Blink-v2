import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import BottomNav from '../components/neo/BottomNav';
import { SkeletonCard } from '../components/skeletons';
import BankFilterSheet, { BankFilterOption } from '../components/neo/BankFilterSheet';
import CategoryFilterSheet, { CATEGORY_OPTIONS } from '../components/neo/CategoryFilterSheet';
import UnifiedFilterSheet, { type UnifiedFilterValues } from '../components/neo/UnifiedFilterSheet';
import { useBenefitsData } from '../hooks/useBenefitsData';
import { useEnrichedBusinesses } from '../hooks/useEnrichedBusinesses';
import { useFallbackSearch } from '../hooks/useFallbackSearch';
import { fetchBanks, fetchBusinessesPaginated, fetchBusinessById } from '../services/api';
import { Business } from '../types';
import { buildBankOptions, toBankDescriptor } from '../utils/banks';
import {
  trackFilterApply,
  trackNoResults,
  trackSearchIntent,
  trackSelectBusiness,
} from '../analytics/intentTracking';
import { formatDistance } from '../utils/distance';
import { useGeolocation } from '../hooks/useGeolocation';
import { encodeGeohash } from '../utils/geohash';

interface SearchFilterState {
  selectedBanksKey: string;
  onlineOnly: boolean;
  maxDistance: number | undefined;
  minDiscount: number | undefined;
  availableDay: string | undefined;
  cardMode: 'credit' | 'debit' | undefined;
  network: string | undefined;
  hasInstallments: boolean | undefined;
}

const BANK_STORAGE_KEY = 'blink.search.selectedBanks';

const readStoredBanks = (): string[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = window.localStorage.getItem(BANK_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return Array.from(
      new Set(
        parsed
          .map((bank) => toBankDescriptor(bank).token)
          .filter(Boolean),
      ),
    );
  } catch {
    return [];
  }
};

export const SEARCH_PARAMS_KEY = 'searchPageParams';

function SearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Persist current search params so BottomNav can restore them on return
  useEffect(() => {
    sessionStorage.setItem(SEARCH_PARAMS_KEY, location.search);
  }, [location.search]);

  // Init all state from URL params so filters survive navigation
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBanks, setSelectedBanks] = useState<string[]>(() => {
    const bankParam = searchParams.get('bank');
    if (!bankParam) return readStoredBanks();

    const parsedTokens = bankParam
      .split(',')
      .map((bank) => toBankDescriptor(bank).token)
      .filter(Boolean);

    return Array.from(new Set(parsedTokens));
  });

  // Filter panel state
  const [showFilters, setShowFilters] = useState(false);
  const [showBankSheet, setShowBankSheet] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(searchParams.get('online') === '1');
  const [maxDistance] = useState<number | undefined>(searchParams.get('distance') ? Number(searchParams.get('distance')) : undefined);
  const [minDiscount, setMinDiscount] = useState<number | undefined>(searchParams.get('discount') ? Number(searchParams.get('discount')) : undefined);
  const [availableDay, setAvailableDay] = useState<string | undefined>(searchParams.get('day') || undefined);
  const [cardMode, setCardMode] = useState<'credit' | 'debit' | undefined>((searchParams.get('card') || undefined) as 'credit' | 'debit' | undefined);
  const [network] = useState<string | undefined>(searchParams.get('network') || undefined);
  const [hasInstallments, setHasInstallments] = useState<boolean | undefined>(searchParams.get('installments') === '1' ? true : undefined);
  const [sortByDistance, setSortByDistance] = useState(searchParams.get('nearby') === '1');

  const { data: availableBankNames = [] } = useQuery({
    queryKey: ['availableBanks'],
    queryFn: fetchBanks,
    staleTime: 1000 * 60 * 30,
  });

  // Sync filter state back to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedBanks.length > 0) params.set('bank', selectedBanks.join(','));
    if (onlineOnly) params.set('online', '1');
    if (maxDistance !== undefined) params.set('distance', String(maxDistance));
    if (minDiscount !== undefined) params.set('discount', String(minDiscount));
    if (availableDay) params.set('day', availableDay);
    if (cardMode) params.set('card', cardMode);
    if (network) params.set('network', network);
    if (hasInstallments) params.set('installments', '1');
    if (sortByDistance) params.set('nearby', '1');
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, selectedCategory, selectedBanks, onlineOnly, maxDistance, minDiscount, availableDay, cardMode, network, hasInstallments, sortByDistance, setSearchParams]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Persist selected banks between sessions
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (selectedBanks.length === 0) {
      window.localStorage.removeItem(BANK_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify(selectedBanks));
  }, [selectedBanks]);

  const { position } = useGeolocation();

  const {
    businesses,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    totalBusinesses,
    proximityUnavailable,
  } = useBenefitsData({
    search: debouncedSearch.trim() || undefined,
    category: selectedCategory && selectedCategory !== 'all' ? selectedCategory : undefined,
    bank: selectedBanks.length > 0 ? selectedBanks.join(',') : undefined,
    minDiscount,
    maxDistance,
    availableDay,
    network,
    cardMode,
    hasInstallments,
    onlineOnly,
    sortByDistance,
  });

  const enrichedBusinesses = useEnrichedBusinesses(businesses, {
    minDiscount,
    maxDistance,
    availableDay,
    network,
    cardMode,
    hasInstallments,
  });

  const strictMatches = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return enrichedBusinesses;
    return enrichedBusinesses.filter((b) => 
      b.name.toLowerCase().includes(term) || 
      (b as any).aliases?.some((a: string) => a.toLowerCase().includes(term))
    );
  }, [enrichedBusinesses, debouncedSearch]);

  const hasSelectedBanks = selectedBanks.length > 0;
  const hasSearchTerm = debouncedSearch.trim().length > 0;

  // When a bank filter is active the API only returns filtered benefits per merchant.
  // Batch-fetch full business data so cards can show all their bank badges.
  const [fullBusinessesMap, setFullBusinessesMap] = useState<Map<string, Business>>(new Map());
  const enrichedIds = useMemo(() => enrichedBusinesses.map(b => b.id).join(','), [enrichedBusinesses]);

  useEffect(() => {
    if (!hasSelectedBanks || !enrichedIds) { setFullBusinessesMap(new Map()); return; }
    let cancelled = false;
    Promise.all(enrichedIds.split(',').map(id => fetchBusinessById(id))).then(results => {
      if (cancelled) return;
      setFullBusinessesMap(prev => {
        const next = new Map(prev);
        results.forEach(b => { if (b) next.set(b.id, b); });
        return next;
      });
    });
    return () => { cancelled = true; };
  }, [enrichedIds, hasSelectedBanks]);
  const primaryResultsEmpty = !isLoading && strictMatches.length === 0 && hasSearchTerm;

  // Stable signature to re-trigger fallback queries when intent changes
  const searchIntentSignature = [
    debouncedSearch.trim(),
    selectedCategory,
    selectedBanks.join(','),
  ].join('|');

  const {
    otherBanksBusinesses,
    resolvedTotalOtherBanks,
    isOtherBanksLoading,
    relativeBusinesses,
    isRelativeLoading,
  } = useFallbackSearch({
    primaryResultsEmpty,
    filters: {
      search: debouncedSearch.trim() || undefined,
      category: selectedCategory && selectedCategory !== 'all' ? selectedCategory : undefined,
      bank: selectedBanks.length > 0 ? selectedBanks.join(',') : undefined,
      onlineOnly,
      sortByDistance,
    },
    searchIntentSignature,
  });

  // Case 1: bank filter active + empty primary + other-bank results exist
  const showOtherBanksFallback = primaryResultsEmpty && hasSelectedBanks && otherBanksBusinesses.length > 0;
  // Case 2: still empty (no banks narrowing things down, or banks also failed)
  const showRelativesFallback = primaryResultsEmpty && !showOtherBanksFallback;

  // Label for the relatives section
  const relativesLabel = (() => {
    const cat = CATEGORY_OPTIONS.find((o) => o.token === selectedCategory);
    return cat ? `Otros beneficios en ${cat.label}` : 'Quizás te interese';
  })();

  // Typed display arrays for the two fallback lists
  const otherBanksItems: (Business | null)[] = isOtherBanksLoading
    ? Array.from({ length: 3 }, () => null)
    : otherBanksBusinesses;

  const relativeItems: (Business | null)[] = isRelativeLoading
    ? Array.from({ length: 4 }, () => null)
    : relativeBusinesses;

  const businessBankNames = useMemo(() => {
    const names = new Set<string>();
    businesses.forEach((business) => {
      business.benefits.forEach((benefit) => {
        if (benefit.bankName) {
          names.add(benefit.bankName);
        }
      });
    });
    return Array.from(names);
  }, [businesses]);

  const bankOptions = useMemo<BankFilterOption[]>(() => {
    return buildBankOptions(availableBankNames, businessBankNames, selectedBanks);
  }, [availableBankNames, businessBankNames, selectedBanks]);

  const activeFilterCount = [
    selectedBanks.length > 0,
    !!selectedCategory,
    minDiscount !== undefined,
    availableDay !== undefined,
    cardMode !== undefined,
    onlineOnly,
    hasInstallments === true,
    sortByDistance,
  ].filter(Boolean).length;

  const currentFilterState = useMemo<SearchFilterState>(() => ({
    selectedBanksKey: selectedBanks.join(','),
    onlineOnly,
    maxDistance,
    minDiscount,
    availableDay,
    cardMode,
    network,
    hasInstallments,
  }), [
    selectedBanks,
    onlineOnly,
    maxDistance,
    minDiscount,
    availableDay,
    cardMode,
    network,
    hasInstallments,
  ]);

  const previousFilterStateRef = useRef<SearchFilterState>(currentFilterState);
  const hasInitializedFiltersRef = useRef(false);
  const searchIntentSignatureRef = useRef('');
  const noResultsSignatureRef = useRef('');

  // Infinite scroll sentinel — primary results
  const sentinelRef = useRef<HTMLDivElement>(null);
  const infiniteScrollStateRef = useRef({ hasMore, isLoadingMore, loadMore });

  // Keep ref values fresh every render (no deps = runs every render)
  useEffect(() => {
    infiniteScrollStateRef.current = { hasMore, isLoadingMore, loadMore };
  });

  // Create IntersectionObserver once on mount
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const { hasMore: more, isLoadingMore: loading, loadMore: load } = infiniteScrollStateRef.current;
          if (more && !loading) load();
        }
      },
      { rootMargin: '300px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // ── Related by category (infinite scroll tail) ──────────────────────────────
  // Derives the category from the first search result and fetches more businesses
  // from that category so the list never feels empty.
  const matchedCategory = hasSearchTerm && !isLoading && enrichedBusinesses.length > 0
    ? (enrichedBusinesses[0].category || (enrichedBusinesses[0] as any).categories?.[0] as string | undefined)?.toLowerCase()
    : undefined;

  const primaryIds = useMemo(
    () => new Set(strictMatches.map((b) => b.id)),
    [strictMatches],
  );

  const {
    data: relatedPages,
    isLoading: isRelatedLoading,
    isFetchingNextPage: isRelatedFetchingMore,
    fetchNextPage: fetchRelatedNext,
    hasNextPage: relatedHasMore,
  } = useInfiniteQuery({
    queryKey: [
      'related_by_category',
      matchedCategory,
      selectedBanks.join(','),
      sortByDistance,
      sortByDistance && position ? position.latitude : null,
      sortByDistance && position ? position.longitude : null,
      !sortByDistance && position ? encodeGeohash(position.latitude, position.longitude) : null,
    ],
    queryFn: async ({ pageParam = 0 }) =>
      fetchBusinessesPaginated({
        limit: 20,
        offset: pageParam,
        category: matchedCategory,
        bank: selectedBanks.length > 0 ? selectedBanks.join(',') : undefined,
        ...(sortByDistance && position 
          ? { lat: position.latitude, lng: position.longitude }
          : position ? { geohash: encodeGeohash(position.latitude, position.longitude) } : {}),
      }),
    getNextPageParam: (last) =>
      last.pagination.hasMore
        ? last.pagination.offset + last.pagination.limit
        : undefined,
    initialPageParam: 0,
    enabled: !!matchedCategory,
    staleTime: 1000 * 60 * 5,
  });

  const relatedBusinesses = useMemo(() => {
    const all = relatedPages?.pages.flatMap((p) => p.businesses) ?? [];
    // deduplicate against primary results and within related pages
    const seen = new Set(primaryIds);
    return all.filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });
  }, [relatedPages, primaryIds]);

  const relatedSentinelRef = useRef<HTMLDivElement>(null);
  const relatedScrollStateRef = useRef({ relatedHasMore, isRelatedFetchingMore, fetchRelatedNext });

  useEffect(() => {
    relatedScrollStateRef.current = { relatedHasMore, isRelatedFetchingMore, fetchRelatedNext };
  });

  useEffect(() => {
    const sentinel = relatedSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const { relatedHasMore: more, isRelatedFetchingMore: loading, fetchRelatedNext: load } =
            relatedScrollStateRef.current;
          if (more && !loading) load();
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Category label for the related section
  const relatedCategoryLabel = useMemo(() => {
    const cat = CATEGORY_OPTIONS.find((o) => o.token === matchedCategory);
    return cat ? cat.label : '';
  }, [matchedCategory]);

  // Scroll position restoration: read saved Y on mount, then apply once data is loaded
  const pendingScrollRef = useRef<number | null>(null);
  useLayoutEffect(() => {
    const key = 'blink.search.scrollY';
    const saved = sessionStorage.getItem(key);
    if (saved) {
      sessionStorage.removeItem(key);
      pendingScrollRef.current = Number(saved);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  useEffect(() => {
    if (!isLoading && pendingScrollRef.current !== null) {
      const y = pendingScrollRef.current;
      pendingScrollRef.current = null;
      window.scrollTo({ top: y, behavior: 'instant' });
    }
  }, [isLoading]);

  useEffect(() => {
    if (!hasInitializedFiltersRef.current) {
      hasInitializedFiltersRef.current = true;
      previousFilterStateRef.current = currentFilterState;
      return;
    }

    const previous = previousFilterStateRef.current;

    if (previous.selectedBanksKey !== currentFilterState.selectedBanksKey) {
      const selectedBanks = currentFilterState.selectedBanksKey
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean);

      if (selectedBanks.length === 0) {
        trackFilterApply({
          source: 'search_filters',
          filterType: 'bank',
          filterValue: 'none',
          activeFilterCount,
        });
      } else {
        selectedBanks.forEach((token) => {
          trackFilterApply({
            source: 'search_filters',
            filterType: 'bank',
            filterValue: token,
            activeFilterCount,
          });
        });
      }
    }

    if (previous.onlineOnly !== currentFilterState.onlineOnly) {
      trackFilterApply({
        source: 'search_filters',
        filterType: 'online',
        filterValue: currentFilterState.onlineOnly,
        activeFilterCount,
      });
    }

    if (previous.maxDistance !== currentFilterState.maxDistance) {
      trackFilterApply({
        source: 'search_filters',
        filterType: 'distance',
        filterValue: currentFilterState.maxDistance,
        activeFilterCount,
      });
    }

    if (previous.minDiscount !== currentFilterState.minDiscount) {
      trackFilterApply({
        source: 'search_filters',
        filterType: 'discount',
        filterValue: currentFilterState.minDiscount,
        activeFilterCount,
      });
    }

    if (previous.availableDay !== currentFilterState.availableDay) {
      trackFilterApply({
        source: 'search_filters',
        filterType: 'day',
        filterValue: currentFilterState.availableDay,
        activeFilterCount,
      });
    }

    if (previous.cardMode !== currentFilterState.cardMode) {
      trackFilterApply({
        source: 'search_filters',
        filterType: 'card_mode',
        filterValue: currentFilterState.cardMode,
        activeFilterCount,
      });
    }

    if (previous.network !== currentFilterState.network) {
      trackFilterApply({
        source: 'search_filters',
        filterType: 'network',
        filterValue: currentFilterState.network,
        activeFilterCount,
      });
    }

    if (previous.hasInstallments !== currentFilterState.hasInstallments) {
      trackFilterApply({
        source: 'search_filters',
        filterType: 'installments',
        filterValue: currentFilterState.hasInstallments,
        activeFilterCount,
      });
    }

    previousFilterStateRef.current = currentFilterState;
  }, [activeFilterCount, currentFilterState]);

  useEffect(() => {
    if (isLoading) return;

    const normalizedSearch = debouncedSearch.trim();
    const hasFilters = activeFilterCount > 0;
    if (!normalizedSearch && !hasFilters) return;

    const signature = [
      normalizedSearch,
      selectedCategory,
      currentFilterState.selectedBanksKey,
      activeFilterCount,
      enrichedBusinesses.length,
    ].join('|');

    if (searchIntentSignatureRef.current === signature) return;
    searchIntentSignatureRef.current = signature;

    trackSearchIntent({
      source: 'search_page',
      searchTerm: normalizedSearch,
      resultsCount: enrichedBusinesses.length,
      hasFilters,
      activeFilterCount,
      category: selectedCategory || undefined,
    });
  }, [
    activeFilterCount,
    currentFilterState.selectedBanksKey,
    debouncedSearch,
    enrichedBusinesses.length,
    isLoading,
    selectedCategory,
  ]);

  useEffect(() => {
    if (isLoading) return;
    if (enrichedBusinesses.length > 0) return;

    const normalizedSearch = debouncedSearch.trim();
    if (!normalizedSearch && activeFilterCount === 0) return;

    const signature = [
      normalizedSearch,
      selectedCategory,
      currentFilterState.selectedBanksKey,
      activeFilterCount,
      'empty',
    ].join('|');

    if (noResultsSignatureRef.current === signature) return;
    noResultsSignatureRef.current = signature;

    trackNoResults({
      source: 'search_page',
      searchTerm: normalizedSearch,
      activeFilterCount,
      category: selectedCategory || undefined,
    });
  }, [
    activeFilterCount,
    currentFilterState.selectedBanksKey,
    debouncedSearch,
    enrichedBusinesses.length,
    isLoading,
    selectedCategory,
  ]);

  // Get max discount for a business
  const getMaxDiscount = (business: Business) => {
    let max = 0;
    business.benefits.forEach((benefit) => {
      const match = benefit.rewardRate.match(/(\d+)%/);
      if (match) max = Math.max(max, parseInt(match[1], 10));
    });
    return max;
  };

  // Get max installments for a business
  const getMaxInstallments = (business: Business) => {
    let max = 0;
    business.benefits.forEach((benefit) => {
      if (benefit.installments && benefit.installments > max) max = benefit.installments;
    });
    return max;
  };

  // Get abbreviated bank names — use full business data when available (bank filter strips benefits)
  const getBankBadges = (business: Business) => {
    const source = fullBusinessesMap.get(business.id) ?? business;
    const seen = new Set<string>();
    const badges: string[] = [];
    source.benefits.forEach((benefit) => {
      if (benefit.bankName && !seen.has(benefit.bankName)) {
        seen.add(benefit.bankName);
        badges.push(toBankDescriptor(benefit.bankName).code);
      }
    });
    return badges;
  };

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearch('');
  };

  const handleFiltersApply = (values: UnifiedFilterValues) => {
    setSelectedBanks(values.selectedBanks);
    setSelectedCategory(values.selectedCategory);
    setMinDiscount(values.minDiscount);
    setAvailableDay(values.availableDay);
    setCardMode(values.cardMode);
    setOnlineOnly(values.onlineOnly);
    setHasInstallments(values.hasInstallments);
    setSortByDistance(values.sortByDistance);
    setShowFilters(false);
  };

  const handleBusinessSelect = (business: Business, position: number) => {
    sessionStorage.setItem('blink.search.scrollY', String(window.scrollY));
    trackSelectBusiness({
      source: 'search_results',
      businessId: business.id,
      category: business.category,
      position,
    });
    navigate(`/business/${business.id}`, { state: { business } });
  };

  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Sticky Header */}
      <header
        className="sticky top-0 z-40 w-full"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(232,230,225,0.8)',
        }}
      >
        <div className="px-4 py-3 flex items-center gap-2.5">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-blink-bg text-blink-muted hover:bg-gray-100 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <div
            className="flex-1 h-11 flex items-center px-3 gap-2 rounded-xl"
            style={{ background: '#F7F6F4', border: '1px solid #E8E6E1' }}
          >
            <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 18 }}>search</span>
            <input
              className="flex-1 bg-transparent text-sm text-blink-ink placeholder-blink-muted focus:outline-none"
              placeholder="Buscar tiendas y beneficios..."
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              autoFocus={false}
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="text-blink-muted hover:text-blink-ink transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-150 active:scale-95 ${
              activeFilterCount > 0
                ? 'bg-primary text-white'
                : 'bg-blink-bg border border-blink-border text-blink-muted hover:border-primary/30'
            }`}
            aria-label="Abrir filtros"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>tune</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-primary text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick filter pills — active ones float to the front */}
        {(() => {
          const activeCat = CATEGORY_OPTIONS.find((o) => o.token === selectedCategory);
          const pills = [
            {
              key: 'banks',
              active: selectedBanks.length > 0,
              isSheet: true,
              node: (
                <button
                  key="banks"
                  onClick={() => setShowBankSheet(true)}
                  className={`flex items-center h-9 gap-1.5 px-3 rounded-xl text-sm font-medium cursor-pointer transition-all duration-150 active:scale-95 ${
                    selectedBanks.length > 0
                      ? 'bg-primary/10 border border-primary/30 text-primary'
                      : 'bg-blink-bg border border-blink-border text-blink-ink hover:border-primary/30'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>account_balance</span>
                  {selectedBanks.length > 0 ? (
                    <span className="font-semibold">{selectedBanks.length} banco{selectedBanks.length !== 1 ? 's' : ''}</span>
                  ) : (
                    <span>Bancos</span>
                  )}
                  <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 16 }}>expand_more</span>
                </button>
              ),
            },
            {
              key: 'category',
              active: !!activeCat,
              isSheet: true,
              node: (
                <button
                  key="category"
                  onClick={() => setShowCategorySheet(true)}
                  className={`flex items-center h-9 gap-1.5 px-3 rounded-xl text-sm font-medium cursor-pointer transition-all duration-150 active:scale-95 ${
                    activeCat
                      ? 'bg-primary/10 border border-primary/30 text-primary'
                      : 'bg-blink-bg border border-blink-border text-blink-ink hover:border-primary/30'
                  }`}
                >
                  {activeCat
                    ? <span style={{ fontSize: 16, lineHeight: 1 }}>{activeCat.emoji}</span>
                    : <span className="material-symbols-outlined" style={{ fontSize: 18 }}>category</span>
                  }
                  <span className={activeCat ? 'font-semibold' : ''}>{activeCat ? activeCat.label : 'Categoría'}</span>
                  <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 16 }}>expand_more</span>
                </button>
              ),
            },
            {
              key: 'proximity',
              active: sortByDistance,
              pinned: true,
              node: (
                <button
                  key="proximity"
                  onClick={() => setSortByDistance(!sortByDistance)}
                  className={`flex items-center h-9 gap-1.5 px-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 ${
                    sortByDistance
                      ? 'bg-primary text-white'
                      : 'bg-blink-bg border border-blink-border text-blink-ink hover:border-primary/30'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>near_me</span>
                  <span>Cerca tuyo</span>
                </button>
              ),
            },
            {
              key: 'online',
              active: onlineOnly,
              node: (
                <button
                  key="online"
                  onClick={() => setOnlineOnly(!onlineOnly)}
                  className={`flex items-center h-9 gap-1.5 px-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 ${
                    onlineOnly
                      ? 'bg-primary text-white'
                      : 'bg-blink-bg border border-blink-border text-blink-ink hover:border-primary/30'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>language</span>
                  <span>Online</span>
                </button>
              ),
            },
            {
              key: 'installments',
              active: hasInstallments === true,
              node: (
                <button
                  key="installments"
                  onClick={() => setHasInstallments(hasInstallments === true ? undefined : true)}
                  className={`h-9 px-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 ${
                    hasInstallments === true
                      ? 'bg-primary text-white'
                      : 'bg-blink-bg border border-blink-border text-blink-ink hover:border-primary/30'
                  }`}
                >
                  Cuotas s/int.
                </button>
              ),
            },
            {
              key: 'discount',
              active: minDiscount !== undefined,
              node: (
                <button
                  key="discount"
                  onClick={() => setMinDiscount(minDiscount === undefined ? 20 : undefined)}
                  className={`h-9 px-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 ${
                    minDiscount !== undefined
                      ? 'bg-primary text-white'
                      : 'bg-blink-bg border border-blink-border text-blink-ink hover:border-primary/30'
                  }`}
                >
                  20%+ desc.
                </button>
              ),
            },
          ];

          // Pinned pills always stay first; remaining pills sort active-first
          const pinnedPills = pills.filter((p) => (p as any).pinned);
          const otherPills = pills.filter((p) => !(p as any).pinned);
          const sorted = [
            ...pinnedPills,
            ...otherPills.filter((p) => p.active),
            ...otherPills.filter((p) => !p.active),
          ];

          return (
            <div className="w-full overflow-x-auto no-scrollbar pb-3 px-4">
              <div className="flex gap-2 min-w-max items-center">
                {sorted.map((p) => p.node)}
              </div>
            </div>
          );
        })()}
      </header>

      {/* Results */}
      <main className="flex-1 px-4 py-5 space-y-3 pb-28">
        {/* Location-unavailable banner — shown when "Más cercanos" is active but GPS is denied */}
        {proximityUnavailable && (
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
            style={{ background: '#FFF7ED', border: '1px solid #FED7AA', color: '#C2410C' }}
          >
            <span className="material-symbols-outlined shrink-0" style={{ fontSize: 18 }}>location_off</span>
            <span>Activá tu ubicación para ordenar por cercanía</span>
          </div>
        )}

        <div className="flex justify-between items-center mb-2">
          <h1 className="font-semibold text-base text-blink-ink">Tiendas</h1>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: '#EEF2FF', color: '#4338CA' }}
          >
            {totalBusinesses} resultados
          </span>
        </div>

        {isLoading && !enrichedBusinesses.length ? (
          Array.from({ length: 5 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))
        ) : showOtherBanksFallback ? (
          /* ── CASE 1: Selected banks have no match, but other banks do ── */
          <div>
            {/* Friendly notice banner */}
            <div
              className="flex items-center gap-3 p-4 rounded-2xl mb-5"
              style={{
                background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                border: '1px solid #C7D2FE',
              }}
            >
              <span className="material-symbols-outlined shrink-0" style={{ fontSize: 22, color: '#6366F1' }}>
                account_balance
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: '#3730A3' }}>
                  No hay resultados para tus bancos
                </p>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: '#4338CA' }}>
                  Encontramos{' '}
                  <span className="font-bold">
                    {resolvedTotalOtherBanks > 1 ? `${resolvedTotalOtherBanks} opciones` : '1 opción'}
                  </span>{' '}
                  en otros bancos
                </p>
              </div>

            </div>

            {/* Preview list of other-bank businesses */}
            <div className="space-y-3">
              {otherBanksItems.map((business, index) => {
                if (!business) return <SkeletonCard key={index} />;
                const bankBadges = getBankBadges(business);
                const visibleBadges = bankBadges.slice(0, 3);
                const remaining = bankBadges.length - 3;
                const maxDiscount = getMaxDiscount(business);
                const maxInstallments = getMaxInstallments(business);
                const categoryStyle = {
                  gastronomia: { bg: '#EEF2FF', color: '#6366F1' },
                  moda:        { bg: '#EDE9FE', color: '#7C3AED' },
                  viajes:      { bg: '#E0F2FE', color: '#0284C7' },
                }[business.category as string] ?? { bg: '#DCFCE7', color: '#16A34A' };
                return (
                  <div
                    key={business.id}
                    onClick={() => handleBusinessSelect(business, index + 1)}
                    className="w-full bg-white rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] overflow-hidden flex"
                    style={{ border: '1px solid #E8E6E1', boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
                  >
                    <div className="flex items-center gap-3 px-3.5 py-3 flex-1 min-w-0">
                      <div
                        className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center overflow-hidden"
                        style={{ background: business.image ? '#F7F6F4' : categoryStyle.bg, border: '1px solid rgba(0,0,0,0.07)' }}
                      >
                        {business.image ? (
                          <img alt={business.name} className="w-full h-full object-cover" src={business.image} loading="lazy" />
                        ) : (
                          <span className="font-black text-base leading-none" style={{ color: categoryStyle.color }}>{business.name?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-[13.5px] text-blink-ink leading-snug mb-[7px] truncate">{business.name}</h2>
                        <div className="flex items-center gap-1.5">
                          {visibleBadges.map((badge) => (
                            <span key={`ob-${business.id}-${badge}`} className="text-[8.5px] font-black tracking-widest px-1.5 py-[3px] rounded-md leading-none" style={{ background: '#1E293B', color: '#E2E8F0' }}>{badge}</span>
                          ))}
                          {remaining > 0 && (
                            <span className="text-[8.5px] font-bold px-1.5 py-[3px] rounded-md leading-none" style={{ background: '#F1F5F9', color: '#94A3B8' }}>+{remaining}</span>
                          )}
                          <span className="text-[10px] text-blink-muted ml-1.5">{business.benefits.length} {business.benefits.length !== 1 ? 'beneficios' : 'beneficio'}</span>
                        </div>
                      </div>
                      {maxDiscount > 0 ? (
                        <div className="shrink-0 flex flex-col items-center text-center" style={{ minWidth: 38 }}>
                          <span className="text-[7px] font-bold text-emerald-500 uppercase tracking-[0.12em] leading-none mb-[3px]">hasta</span>
                          <span className="text-[22px] font-black text-emerald-600 leading-none tracking-tight">{maxDiscount}%</span>
                          <span className="text-[8px] font-bold text-emerald-500 leading-none mt-[2px] tracking-wide">OFF</span>
                        </div>
                      ) : maxInstallments > 0 ? (
                        <div className="shrink-0 flex flex-col items-center text-center" style={{ minWidth: 38 }}>
                          <span className="text-[7px] font-bold uppercase tracking-[0.12em] leading-none mb-[3px]" style={{ color: '#818CF8' }}>hasta</span>
                          <span className="text-[22px] font-black leading-none tracking-tight" style={{ color: '#6366F1' }}>{maxInstallments}</span>
                          <span className="text-[7px] font-bold leading-none mt-[2px] tracking-wide" style={{ color: '#818CF8' }}>cuotas</span>
                        </div>
                      ) : (
                        <div className="shrink-0" style={{ minWidth: 38 }} />
                      )}
                      <span className="material-symbols-outlined shrink-0" style={{ fontSize: 16, color: '#D1D5DB' }}>chevron_right</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : showRelativesFallback ? (
          /* ── CASE 2: No results at all — show "not found" + category relatives ── */
          <div>
            {/* Not-found header */}
            <div className="text-center pt-8 pb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: '#FEF3C7' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#D97706' }}>search_off</span>
              </div>
              <p className="font-semibold text-lg text-blink-ink">
                No encontramos "{debouncedSearch.trim()}"
              </p>
              <p className="text-sm text-blink-muted mt-1">
                No tenemos ese negocio todavía
              </p>
            </div>

            {/* Relatives section — category-based or general popular */}
            {(isRelativeLoading || relativeBusinesses.length > 0) && (
              <>
                <div className="flex items-center gap-2 mb-3 px-0.5">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#6366F1' }}>auto_awesome</span>
                  <p className="font-semibold text-sm text-blink-ink">{relativesLabel}</p>
                </div>
                <div className="space-y-3">
                  {relativeItems.map((business, index) => {
                    if (!business) return <SkeletonCard key={index} />;
                    const bankBadges = getBankBadges(business);
                    const visibleBadges = bankBadges.slice(0, 3);
                    const remaining = bankBadges.length - 3;
                    const maxDiscount = getMaxDiscount(business);
                    const maxInstallments = getMaxInstallments(business);
                    const categoryStyle = {
                      gastronomia: { bg: '#EEF2FF', color: '#6366F1' },
                      moda:        { bg: '#EDE9FE', color: '#7C3AED' },
                      viajes:      { bg: '#E0F2FE', color: '#0284C7' },
                    }[business.category as string] ?? { bg: '#DCFCE7', color: '#16A34A' };
                    return (
                      <div
                        key={business.id}
                        onClick={() => handleBusinessSelect(business, index + 1)}
                        className="w-full bg-white rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] overflow-hidden flex"
                        style={{ border: '1px solid #E8E6E1', boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
                      >
                        <div className="flex items-center gap-3 px-3.5 py-3 flex-1 min-w-0">
                          <div
                            className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center overflow-hidden"
                            style={{ background: business.image ? '#F7F6F4' : categoryStyle.bg, border: '1px solid rgba(0,0,0,0.07)' }}
                          >
                            {business.image ? (
                              <img alt={business.name} className="w-full h-full object-cover" src={business.image} loading="lazy" />
                            ) : (
                              <span className="font-black text-base leading-none" style={{ color: categoryStyle.color }}>{business.name?.charAt(0)}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h2 className="font-bold text-[13.5px] text-blink-ink leading-snug mb-[7px] truncate">{business.name}</h2>
                            <div className="flex items-center gap-1.5">
                              {visibleBadges.map((badge) => (
                                <span key={`rel-${business.id}-${badge}`} className="text-[8.5px] font-black tracking-widest px-1.5 py-[3px] rounded-md leading-none" style={{ background: '#1E293B', color: '#E2E8F0' }}>{badge}</span>
                              ))}
                              {remaining > 0 && (
                                <span className="text-[8.5px] font-bold px-1.5 py-[3px] rounded-md leading-none" style={{ background: '#F1F5F9', color: '#94A3B8' }}>+{remaining}</span>
                              )}
                              <span className="text-[10px] text-blink-muted ml-1.5">{business.benefits.length} {business.benefits.length !== 1 ? 'beneficios' : 'beneficio'}</span>
                            </div>
                          </div>
                          {maxDiscount > 0 ? (
                            <div className="shrink-0 flex flex-col items-center text-center" style={{ minWidth: 38 }}>
                              <span className="text-[7px] font-bold text-emerald-500 uppercase tracking-[0.12em] leading-none mb-[3px]">hasta</span>
                              <span className="text-[22px] font-black text-emerald-600 leading-none tracking-tight">{maxDiscount}%</span>
                              <span className="text-[8px] font-bold text-emerald-500 leading-none mt-[2px] tracking-wide">OFF</span>
                            </div>
                          ) : maxInstallments > 0 ? (
                            <div className="shrink-0 flex flex-col items-center text-center" style={{ minWidth: 38 }}>
                              <span className="text-[7px] font-bold uppercase tracking-[0.12em] leading-none mb-[3px]" style={{ color: '#818CF8' }}>hasta</span>
                              <span className="text-[22px] font-black leading-none tracking-tight" style={{ color: '#6366F1' }}>{maxInstallments}</span>
                              <span className="text-[7px] font-bold leading-none mt-[2px] tracking-wide" style={{ color: '#818CF8' }}>cuotas</span>
                            </div>
                          ) : (
                            <div className="shrink-0" style={{ minWidth: 38 }} />
                          )}
                          <span className="material-symbols-outlined shrink-0" style={{ fontSize: 16, color: '#D1D5DB' }}>chevron_right</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : strictMatches.length === 0 ? (
          /* ── Generic empty (filters applied, no search term) ── */
          <div className="text-center py-16">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: '#EEF2FF' }}
            >
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 32 }}>search_off</span>
            </div>
            <p className="font-semibold text-lg text-blink-ink">Sin resultados</p>
            <p className="text-sm text-blink-muted mt-1">Probá con otro término o filtro</p>
          </div>
        ) : (
          strictMatches.map((business, index) => {
            const bankBadges = getBankBadges(business);
            const visibleBadges = bankBadges.slice(0, 3);
            const remaining = bankBadges.length - 3;
            const maxDiscount = getMaxDiscount(business);
            const maxInstallments = getMaxInstallments(business);

            const categoryStyle = {
              gastronomia: { bg: '#EEF2FF', color: '#6366F1' },
              moda:        { bg: '#EDE9FE', color: '#7C3AED' },
              viajes:      { bg: '#E0F2FE', color: '#0284C7' },
            }[business.category as string] ?? { bg: '#DCFCE7', color: '#16A34A' };

            return (
              <div
                key={business.id}
                onClick={() => handleBusinessSelect(business, index + 1)}
                className="w-full bg-white rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] overflow-hidden flex"
                style={{ border: '1px solid #E8E6E1', boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
              >

                <div className="flex items-center gap-3 px-3.5 py-3 flex-1 min-w-0">
                  {/* Logo */}
                  <div
                    className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center overflow-hidden"
                    style={{
                      background: business.image ? '#F7F6F4' : categoryStyle.bg,
                      border: '1px solid rgba(0,0,0,0.07)',
                    }}
                  >
                    {business.image ? (
                      <img
                        alt={business.name}
                        className="w-full h-full object-cover"
                        src={business.image}
                        loading="lazy"
                      />
                    ) : (
                      <span className="font-black text-base leading-none" style={{ color: categoryStyle.color }}>
                        {business.name?.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {/* Name + distance row */}
                    <h2 className="font-bold text-[13.5px] text-blink-ink leading-snug mb-[7px] flex items-center gap-1 min-w-0">
                      <span className="truncate">{business.name}</span>
                      {(business.distanceText || business.distance !== undefined) && (
                        <>
                          <span className="shrink-0 font-normal text-blink-muted">·</span>
                          <span className="shrink-0 text-[11px] font-normal text-blink-muted">
                            {business.distanceText || formatDistance(business.distance!)}
                          </span>
                        </>
                      )}
                    </h2>

                    {/* Banks + count row */}
                    <div className="flex items-center gap-1.5">
                      {visibleBadges.map((badge) => (
                        <span
                          key={`${business.id}-${badge}`}
                          className="text-[8.5px] font-black tracking-widest px-1.5 py-[3px] rounded-md leading-none"
                          style={{ background: '#1E293B', color: '#E2E8F0' }}
                        >
                          {badge}
                        </span>
                      ))}
                      {remaining > 0 && (
                        <span
                          className="text-[8.5px] font-bold px-1.5 py-[3px] rounded-md leading-none"
                          style={{ background: '#F1F5F9', color: '#94A3B8' }}
                        >
                          +{remaining}
                        </span>
                      )}
                      <span className="text-[10px] text-blink-muted ml-1.5">
                        {business.benefits.length} {business.benefits.length !== 1 ? 'beneficios' : 'beneficio'}
                      </span>
                    </div>
                  </div>

                  {/* Benefit — typographic right column, no box */}
                  {maxDiscount > 0 ? (
                    <div className="shrink-0 flex flex-col items-center text-center" style={{ minWidth: 38 }}>
                      <span className="text-[7px] font-bold text-emerald-500 uppercase tracking-[0.12em] leading-none mb-[3px]">hasta</span>
                      <span className="text-[22px] font-black text-emerald-600 leading-none tracking-tight">{maxDiscount}%</span>
                      <span className="text-[8px] font-bold text-emerald-500 leading-none mt-[2px] tracking-wide">OFF</span>
                    </div>
                  ) : maxInstallments > 0 ? (
                    <div className="shrink-0 flex flex-col items-center text-center" style={{ minWidth: 38 }}>
                      <span className="text-[7px] font-bold uppercase tracking-[0.12em] leading-none mb-[3px]" style={{ color: '#818CF8' }}>hasta</span>
                      <span className="text-[22px] font-black leading-none tracking-tight" style={{ color: '#6366F1' }}>{maxInstallments}</span>
                      <span className="text-[7px] font-bold leading-none mt-[2px] tracking-wide" style={{ color: '#818CF8' }}>cuotas</span>
                    </div>
                  ) : (
                    <div className="shrink-0" style={{ minWidth: 38 }} />
                  )}

                  {/* Chevron — always at far right, vertically centered */}
                  <span className="material-symbols-outlined shrink-0" style={{ fontSize: 16, color: '#D1D5DB' }}>chevron_right</span>
                </div>
              </div>
            );
          })
        )}

        {/* Infinite scroll sentinel — triggers loadMore when entering viewport */}
        <div ref={sentinelRef} className="h-px" aria-hidden="true" />

        {/* Loading indicator shown while fetching next page */}
        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Related by category - show when we have results or when starting to load them */}
        {!isLoading && (isRelatedLoading || relatedBusinesses.length > 0) && (
          <div className="mt-8 pt-10 border-t border-blink-border">
            <h2 className="mb-4 font-bold text-lg text-blink-ink">
              {relatedCategoryLabel ? `Más en ${relatedCategoryLabel}` : 'Más opciones relacionadas'}
            </h2>
            
            <div className="space-y-3">
              {isRelatedLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={`related-skeleton-${i}`} />
                ))
              ) : (
                relatedBusinesses.map((business, index) => {
                  const bankBadges = getBankBadges(business);
                  const visibleBadges = bankBadges.slice(0, 3);
                  const remaining = bankBadges.length - 3;
                  const maxDiscount = getMaxDiscount(business);
                  const maxInstallments = getMaxInstallments(business);

                  const categoryStyle = {
                    gastronomia: { bg: '#EEF2FF', color: '#6366F1' },
                    moda:        { bg: '#EDE9FE', color: '#7C3AED' },
                    viajes:      { bg: '#E0F2FE', color: '#0284C7' },
                  }[business.category as string] ?? { bg: '#DCFCE7', color: '#16A34A' };

                  return (
                    <div
                      key={`related-${business.id}-${index}`}
                      onClick={() => {
                        if (!business.id) return;
                        trackSelectBusiness({
                          source: 'search_related',
                          businessId: business.id,
                          category: business.category,
                          position: index,
                        });
                        navigate(`/business/${business.id}`, { state: { business } });
                      }}
                      className="w-full bg-white rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] overflow-hidden flex"
                      style={{ border: '1px solid #E8E6E1', boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
                    >
                      <div className="flex items-center gap-3 px-3.5 py-3 flex-1 min-w-0">
                        {/* Logo */}
                        <div
                          className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center overflow-hidden"
                          style={{
                            background: business.image ? '#F7F6F4' : categoryStyle.bg,
                            border: '1px solid rgba(0,0,0,0.07)',
                          }}
                        >
                          {business.image ? (
                            <img
                              alt={business.name}
                              className="w-full h-full object-cover"
                              src={business.image}
                              loading="lazy"
                            />
                          ) : (
                            <span className="font-black text-base leading-none" style={{ color: categoryStyle.color }}>
                              {business.name?.charAt(0)}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h2 className="font-bold text-[13.5px] text-blink-ink leading-snug mb-[7px] flex items-center gap-1 min-w-0">
                            <span className="truncate">{business.name}</span>
                            {(business.distanceText || business.distance !== undefined) && (
                              <>
                                <span className="shrink-0 font-normal text-blink-muted">·</span>
                                <span className="shrink-0 text-[11px] font-normal text-blink-muted">
                                  {business.distanceText || formatDistance(business.distance!)}
                                </span>
                              </>
                            )}
                          </h2>

                          <div className="flex items-center gap-1.5">
                            {visibleBadges.map((badge) => (
                              <span
                                key={`rel-${business.id}-${badge}`}
                                className="text-[8.5px] font-black tracking-widest px-1.5 py-[3px] rounded-md leading-none"
                                style={{ background: '#1E293B', color: '#E2E8F0' }}
                              >
                                {badge}
                              </span>
                            ))}
                            {remaining > 0 && (
                              <span
                                className="text-[8.5px] font-bold px-1.5 py-[3px] rounded-md leading-none"
                                style={{ background: '#F1F5F9', color: '#94A3B8' }}
                              >
                                +{remaining}
                              </span>
                            )}
                            <span className="text-[10px] text-blink-muted ml-1.5">
                              {business.benefits.length} {business.benefits.length !== 1 ? 'beneficios' : 'beneficio'}
                            </span>
                          </div>
                        </div>

                        {maxDiscount > 0 ? (
                          <div className="shrink-0 flex flex-col items-center text-center" style={{ minWidth: 38 }}>
                            <span className="text-[7px] font-bold text-emerald-500 uppercase tracking-[0.12em] leading-none mb-[3px]">hasta</span>
                            <span className="text-[22px] font-black text-emerald-600 leading-none tracking-tight">{maxDiscount}%</span>
                            <span className="text-[8px] font-bold text-emerald-500 leading-none mt-[2px] tracking-wide">OFF</span>
                          </div>
                        ) : maxInstallments > 0 ? (
                          <div className="shrink-0 flex flex-col items-center text-center" style={{ minWidth: 38 }}>
                            <span className="text-[7px] font-bold uppercase tracking-[0.12em] leading-none mb-[3px]" style={{ color: '#818CF8' }}>hasta</span>
                            <span className="text-[22px] font-black leading-none tracking-tight" style={{ color: '#6366F1' }}>{maxInstallments}</span>
                            <span className="text-[7px] font-bold leading-none mt-[2px] tracking-wide" style={{ color: '#818CF8' }}>cuotas</span>
                          </div>
                        ) : (
                          <div className="shrink-0" style={{ minWidth: 38 }} />
                        )}
                        <span className="material-symbols-outlined shrink-0" style={{ fontSize: 16, color: '#D1D5DB' }}>chevron_right</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Infinite scroll sentinel for related category */}
            <div ref={relatedSentinelRef} className="h-px mt-4" aria-hidden="true" />
            
            {/* Loading more indicator for related */}
            {isRelatedFetchingMore && (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}
      </main>

      <BankFilterSheet
        isOpen={showBankSheet}
        options={bankOptions}
        selectedTokens={selectedBanks}
        onClose={() => setShowBankSheet(false)}
        onApply={(tokens) => {
          setSelectedBanks(tokens);
          setShowBankSheet(false);
        }}
      />

      <CategoryFilterSheet
        isOpen={showCategorySheet}
        selected={selectedCategory}
        onClose={() => setShowCategorySheet(false)}
        onApply={(category) => {
          setSelectedCategory(category);
          setShowCategorySheet(false);
        }}
      />

      <UnifiedFilterSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        bankOptions={bankOptions}
        values={{
          selectedBanks,
          selectedCategory,
          minDiscount,
          availableDay,
          cardMode,
          onlineOnly,
          hasInstallments,
          sortByDistance,
        }}
        onApply={handleFiltersApply}
      />

      <BottomNav />
    </div>
  );
}

export default SearchPage;
