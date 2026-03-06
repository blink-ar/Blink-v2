import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomNav from '../components/neo/BottomNav';
import BankFilterSheet, { BankFilterOption } from '../components/neo/BankFilterSheet';
import CategoryFilterSheet, { CATEGORY_OPTIONS } from '../components/neo/CategoryFilterSheet';
import FilterPanel from '../components/neo/FilterPanel';
import { useBenefitsData } from '../hooks/useBenefitsData';
import { useEnrichedBusinesses } from '../hooks/useEnrichedBusinesses';
import { fetchBanks } from '../services/api';
import { Business } from '../types';
import {
  trackFilterApply,
  trackNoResults,
  trackSearchIntent,
  trackSelectBusiness,
} from '../analytics/intentTracking';
import { formatDistance } from '../utils/distance';

interface BankDescriptor {
  token: string;
  code: string;
  label: string;
}

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

const KNOWN_BANKS: BankDescriptor[] = [
  { token: 'galicia', code: 'GAL', label: 'GALICIA' },
  { token: 'santander', code: 'SAN', label: 'SANTANDER' },
  { token: 'bbva', code: 'BBVA', label: 'BBVA' },
  { token: 'macro', code: 'MAC', label: 'MACRO' },
  { token: 'modo', code: 'MODO', label: 'MODO' },
  { token: 'icbc', code: 'ICBC', label: 'ICBC' },
  { token: 'hsbc', code: 'HSBC', label: 'HSBC' },
  { token: 'amex', code: 'AMEX', label: 'AMEX' },
  { token: 'naranja', code: 'NX', label: 'NARANJA X' },
  { token: 'nacion', code: 'BNA', label: 'NACION' },
  { token: 'ciudad', code: 'CIU', label: 'CIUDAD' },
  { token: 'patagonia', code: 'PAT', label: 'PATAGONIA' },
  { token: 'visa', code: 'VISA', label: 'VISA' },
  { token: 'mastercard', code: 'MC', label: 'MASTERCARD' },
];

const asBankText = (value: unknown): string => {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;
    const candidates = [
      objectValue.bank,
      objectValue.name,
      objectValue.label,
      objectValue.code,
      objectValue.value,
      objectValue.id,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' || typeof candidate === 'number') {
        return String(candidate);
      }
    }
  }
  return '';
};

const normalizeText = (value: unknown) =>
  asBankText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const sanitizeBankName = (value: unknown) =>
  normalizeText(value)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getKnownDescriptor = (normalized: string): BankDescriptor | null => {
  if (normalized.includes('galic')) return KNOWN_BANKS[0];
  if (normalized.includes('santand')) return KNOWN_BANKS[1];
  if (normalized.includes('bbva')) return KNOWN_BANKS[2];
  if (normalized.includes('macro')) return KNOWN_BANKS[3];
  if (normalized.includes('modo')) return KNOWN_BANKS[4];
  if (normalized.includes('icbc')) return KNOWN_BANKS[5];
  if (normalized.includes('hsbc')) return KNOWN_BANKS[6];
  if (normalized.includes('amex') || normalized.includes('american express')) return KNOWN_BANKS[7];
  if (normalized.includes('naranja x') || normalized.includes('naranjax') || normalized === 'nx') return KNOWN_BANKS[8];
  if (normalized.includes('nacion')) return KNOWN_BANKS[9];
  if (normalized.includes('ciudad')) return KNOWN_BANKS[10];
  if (normalized.includes('patagonia')) return KNOWN_BANKS[11];
  if (normalized.includes('visa')) return KNOWN_BANKS[12];
  if (normalized.includes('master')) return KNOWN_BANKS[13];
  return null;
};

const toBankDescriptor = (bankValue: unknown): BankDescriptor => {
  const sanitized = sanitizeBankName(bankValue).replace(/^banco\s+/, '').trim();
  if (!sanitized) {
    return {
      token: 'bank',
      code: 'BANK',
      label: 'BANCO',
    };
  }

  const known = getKnownDescriptor(sanitized);
  if (known) return known;

  const words = sanitized.split(' ').filter(Boolean);
  const token = words[0];
  const codeSource = words.length > 1 ? words.map((word) => word[0]).join('') : words[0];
  const code = codeSource.slice(0, 4).toUpperCase();

  return {
    token,
    code,
    label: sanitized.toUpperCase().slice(0, 18),
  };
};

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

function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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
  const [maxDistance, setMaxDistance] = useState<number | undefined>(searchParams.get('distance') ? Number(searchParams.get('distance')) : undefined);
  const [minDiscount, setMinDiscount] = useState<number | undefined>(searchParams.get('discount') ? Number(searchParams.get('discount')) : undefined);
  const [availableDay, setAvailableDay] = useState<string | undefined>(searchParams.get('day') || undefined);
  const [cardMode, setCardMode] = useState<'credit' | 'debit' | undefined>((searchParams.get('card') || undefined) as 'credit' | 'debit' | undefined);
  const [network, setNetwork] = useState<string | undefined>(searchParams.get('network') || undefined);
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
    sortByDistance,
  });

  const enrichedBusinesses = useEnrichedBusinesses(businesses, {
    onlineOnly,
    minDiscount,
    maxDistance,
    availableDay,
    network,
    cardMode,
    hasInstallments,
  });

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
    const optionMap = new Map<string, BankFilterOption>();
    const knownOrder = new Map(KNOWN_BANKS.map((bank, index) => [bank.token, index]));

    const addOption = (bankName: unknown) => {
      const descriptor = toBankDescriptor(bankName);
      if (!optionMap.has(descriptor.token)) {
        optionMap.set(descriptor.token, descriptor);
      }
    };

    availableBankNames.forEach(addOption);
    businessBankNames.forEach(addOption);
    selectedBanks.forEach(addOption);

    return Array.from(optionMap.values()).sort((a, b) => {
      const orderA = knownOrder.get(a.token);
      const orderB = knownOrder.get(b.token);
      if (orderA !== undefined && orderB !== undefined) return orderA - orderB;
      if (orderA !== undefined) return -1;
      if (orderB !== undefined) return 1;
      return a.label.localeCompare(b.label, 'es');
    });
  }, [availableBankNames, businessBankNames, selectedBanks]);

  const bankMap = useMemo(
    () => new Map(bankOptions.map((option) => [option.token, option])),
    [bankOptions],
  );

  const selectedBankPreview = selectedBanks
    .slice(0, 3)
    .map((token) => ({
      token,
      code: bankMap.get(token)?.code || toBankDescriptor(token).code,
    }));

  const activeFilterCount = [
    availableDay !== undefined,
    cardMode !== undefined,
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

  // Infinite scroll sentinel
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

  // Scroll position restoration on mount
  useLayoutEffect(() => {
    const key = 'blink.search.scrollY';
    const saved = sessionStorage.getItem(key);
    if (saved) {
      sessionStorage.removeItem(key);
      window.scrollTo({ top: Number(saved), behavior: 'instant' });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

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

  // Get best benefit text
  const getBestBenefitText = (business: Business) => {
    const max = getMaxDiscount(business);
    if (max > 0) return `HASTA ${max}% OFF`;
    const withInstallments = business.benefits.find((benefit) => benefit.installments && benefit.installments > 0);
    if (withInstallments) return `${withInstallments.installments} CUOTAS S/INT`;
    return 'VER BENEFICIOS';
  };

  // Get abbreviated bank names
  const getBankBadges = (business: Business) => {
    const seen = new Set<string>();
    const badges: string[] = [];
    business.benefits.forEach((benefit) => {
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

        {/* Compact filter controls */}
        <div className="w-full overflow-x-auto no-scrollbar pb-3 px-4">
          <div className="flex gap-2 min-w-max items-center">

            {/* Bank filter button */}
            <button
              onClick={() => setShowBankSheet(true)}
              className={`flex items-center h-9 gap-1.5 px-3 rounded-xl text-sm font-medium cursor-pointer transition-all duration-150 active:scale-95 ${
                selectedBanks.length > 0
                  ? 'bg-primary/10 border border-primary/30 text-primary'
                  : 'bg-blink-bg border border-blink-border text-blink-ink hover:border-primary/30'
              }`}
            >
              {selectedBanks.length > 0 ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>account_balance</span>
                  <span className="font-semibold">{selectedBanks.length} banco{selectedBanks.length !== 1 ? 's' : ''}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>account_balance</span>
                  <span>Bancos</span>
                </>
              )}
              <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 16 }}>expand_more</span>
            </button>

            {/* Category filter button */}
            {(() => {
              const activeCat = CATEGORY_OPTIONS.find((o) => o.token === selectedCategory);
              return (
                <button
                  onClick={() => setShowCategorySheet(true)}
                  className={`flex items-center h-9 gap-1.5 px-3 rounded-xl text-sm font-medium cursor-pointer transition-all duration-150 active:scale-95 ${
                    activeCat
                      ? 'bg-primary/10 border border-primary/30 text-primary'
                      : 'bg-blink-bg border border-blink-border text-blink-ink hover:border-primary/30'
                  }`}
                >
                  {activeCat ? (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{activeCat.icon}</span>
                      <span className="font-semibold">{activeCat.label}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>category</span>
                      <span>Categoría</span>
                    </>
                  )}
                  <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 16 }}>expand_more</span>
                </button>
              );
            })()}

            {/* Proximity sort */}
            <button
              onClick={() => setSortByDistance(!sortByDistance)}
              className={`flex items-center h-9 gap-1.5 px-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 ${
                sortByDistance
                  ? 'bg-primary text-white'
                  : 'bg-blink-bg border border-blink-border text-blink-ink hover:border-primary/30'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>near_me</span>
              <span>Más cercanos</span>
            </button>

            {/* Online only */}
            <button
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

            {/* Installments */}
            <button
              onClick={() => setHasInstallments(hasInstallments === true ? undefined : true)}
              className={`h-9 px-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 ${
                hasInstallments === true
                  ? 'bg-primary text-white'
                  : 'bg-blink-bg border border-blink-border text-blink-ink hover:border-primary/30'
              }`}
            >
              Cuotas s/int.
            </button>

            {/* Min discount */}
            <button
              onClick={() => setMinDiscount(minDiscount === undefined ? 20 : undefined)}
              className={`h-9 px-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 ${
                minDiscount !== undefined
                  ? 'bg-primary text-white'
                  : 'bg-blink-bg border border-blink-border text-blink-ink hover:border-primary/30'
              }`}
            >
              20%+ desc.
            </button>
          </div>
        </div>
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
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="w-full h-24 rounded-2xl animate-pulse"
              style={{ background: '#F3F4F6' }}
            />
          ))
        ) : enrichedBusinesses.length === 0 ? (
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
          enrichedBusinesses.map((business, index) => {
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
                        className="w-full h-full object-contain p-1"
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

      {/* Filter Panel */}
      <FilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        minDiscount={minDiscount}
        onMinDiscountChange={setMinDiscount}
        availableDay={availableDay}
        onAvailableDayChange={setAvailableDay}
        cardMode={cardMode}
        onCardModeChange={setCardMode}
      />

      <BottomNav />
    </div>
  );
}

export default SearchPage;
