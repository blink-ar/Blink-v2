import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomNav from '../components/neo/BottomNav';
import BankFilterSheet, { BankFilterOption } from '../components/neo/BankFilterSheet';
import FilterPanel from '../components/neo/FilterPanel';
import { useBenefitsData } from '../hooks/useBenefitsData';
import { useEnrichedBusinesses } from '../hooks/useEnrichedBusinesses';
import { fetchBanks } from '../services/api';
import { Business } from '../types';

interface BankDescriptor {
  token: string;
  code: string;
  label: string;
}

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

function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Init all state from URL params so filters survive navigation
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('q') || '');
  const [selectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBanks, setSelectedBanks] = useState<string[]>(() => {
    const bankParam = searchParams.get('bank');
    if (!bankParam) return [];

    const parsedTokens = bankParam
      .split(',')
      .map((bank) => toBankDescriptor(bank).token)
      .filter(Boolean);

    return Array.from(new Set(parsedTokens));
  });

  // Filter panel state
  const [showFilters, setShowFilters] = useState(false);
  const [showBankSheet, setShowBankSheet] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(searchParams.get('online') === '1');
  const [maxDistance, setMaxDistance] = useState<number | undefined>(searchParams.get('distance') ? Number(searchParams.get('distance')) : undefined);
  const [minDiscount, setMinDiscount] = useState<number | undefined>(searchParams.get('discount') ? Number(searchParams.get('discount')) : undefined);
  const [availableDay, setAvailableDay] = useState<string | undefined>(searchParams.get('day') || undefined);
  const [cardMode, setCardMode] = useState<'credit' | 'debit' | undefined>((searchParams.get('card') || undefined) as 'credit' | 'debit' | undefined);
  const [network, setNetwork] = useState<string | undefined>(searchParams.get('network') || undefined);
  const [hasInstallments, setHasInstallments] = useState<boolean | undefined>(searchParams.get('installments') === '1' ? true : undefined);

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
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, selectedCategory, selectedBanks, onlineOnly, maxDistance, minDiscount, availableDay, cardMode, network, hasInstallments, setSearchParams]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    businesses,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    totalBusinesses,
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

    const addOption = (bankName: unknown) => {
      const descriptor = toBankDescriptor(bankName);
      if (!optionMap.has(descriptor.token)) {
        optionMap.set(descriptor.token, descriptor);
      }
    };

    availableBankNames.forEach(addOption);
    businessBankNames.forEach(addOption);
    selectedBanks.forEach(addOption);

    return Array.from(optionMap.values()).sort((a, b) => a.label.localeCompare(b.label, 'es'));
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
    selectedCategory && selectedCategory !== 'all',
    onlineOnly,
    maxDistance !== undefined,
    minDiscount !== undefined,
    availableDay !== undefined,
    cardMode !== undefined,
    network !== undefined,
    hasInstallments !== undefined,
  ].filter(Boolean).length;

  // Get max discount for a business
  const getMaxDiscount = (business: Business) => {
    let max = 0;
    business.benefits.forEach((benefit) => {
      const match = benefit.rewardRate.match(/(\d+)%/);
      if (match) max = Math.max(max, parseInt(match[1], 10));
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

  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 w-full bg-blink-bg border-b-2 border-blink-ink">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center justify-center w-10 h-10 bg-white border-2 border-blink-ink shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <span className="material-symbols-outlined text-blink-ink" style={{ fontSize: 24 }}>arrow_back</span>
          </button>
          <div className="flex-1 h-10 relative">
            <input
              className="w-full h-full border-2 border-blink-ink bg-white px-3 pr-10 font-display uppercase tracking-tight text-blink-ink placeholder-gray-400 focus:outline-none focus:ring-0 shadow-hard"
              placeholder="BUSCAR..."
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              autoFocus={false}
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-0 top-0 h-full w-10 flex items-center justify-center bg-blink-ink border-l-2 border-blink-ink"
              >
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>close</span>
              </button>
            )}
          </div>
        </div>

        {/* Compact filter controls */}
        <div className="w-full overflow-x-auto no-scrollbar border-t-2 border-blink-ink bg-blink-bg py-3">
          <div className="flex px-4 gap-3 min-w-max items-center">
            <button
              onClick={() => setShowFilters(true)}
              className="relative w-12 h-12 border-2 border-blink-ink bg-blink-ink text-white shadow-hard-sm flex items-center justify-center"
              aria-label="Abrir filtros"
            >
              <span className="material-symbols-outlined text-xl">tune</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 h-6 min-w-6 px-1 border-2 border-blink-ink bg-primary text-blink-ink font-mono text-[10px] leading-none flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowBankSheet(true)}
              className="h-12 border-2 border-blink-ink bg-white shadow-hard-sm flex items-center shrink-0"
            >
              {selectedBanks.length > 0 ? (
                <div className="flex items-center h-full">
                  {selectedBankPreview.map((bank) => (
                    <span
                      key={bank.token}
                      className="h-full min-w-10 px-2 border-r border-blink-ink flex items-center justify-center font-display text-sm tracking-tight"
                    >
                      {bank.code}
                    </span>
                  ))}
                  <span className="h-full px-2 border-r border-blink-ink bg-primary flex items-center justify-center font-display text-sm">
                    {selectedBanks.length}
                  </span>
                </div>
              ) : (
                <span className="px-3 font-display text-sm uppercase">Bancos</span>
              )}
              <span className="w-10 h-full flex items-center justify-center border-l border-blink-ink">
                <span className="material-symbols-outlined text-xl">expand_more</span>
              </span>
            </button>

            <span className="h-8 w-px bg-blink-ink/20" />

            <button
              onClick={() => setHasInstallments(hasInstallments === true ? undefined : true)}
              className={`h-12 px-4 border-2 border-blink-ink shadow-hard-sm font-mono text-sm uppercase ${
                hasInstallments === true
                  ? 'bg-primary text-blink-ink'
                  : 'bg-white text-blink-ink'
              }`}
            >
              Cuotas
            </button>

            <button
              onClick={() => setMinDiscount(minDiscount === undefined ? 20 : undefined)}
              className={`h-12 px-4 border-2 border-blink-ink shadow-hard-sm font-mono text-sm uppercase ${
                minDiscount !== undefined
                  ? 'bg-primary text-blink-ink'
                  : 'bg-white text-blink-ink'
              }`}
            >
              Descuento
            </button>
          </div>
        </div>
      </header>

      {/* Results */}
      <main className="flex-1 px-4 py-6 space-y-5 pb-24">
        <div className="flex justify-between items-end border-b-2 border-blink-ink pb-2 mb-4">
          <h1 className="font-display text-2xl leading-none">TIENDAS</h1>
          <span className="font-mono text-sm font-bold bg-primary px-2 py-0.5 border-2 border-blink-ink">
            {totalBusinesses} TIENDAS
          </span>
        </div>

        {isLoading && !enrichedBusinesses.length ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="w-full bg-blink-surface border-2 border-blink-ink shadow-hard h-40 animate-pulse" />
          ))
        ) : enrichedBusinesses.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 64 }}>search_off</span>
            <p className="font-display text-xl uppercase mt-4">Sin resultados</p>
            <p className="font-mono text-sm text-blink-muted mt-2">Proba con otro termino o filtro</p>
          </div>
        ) : (
          enrichedBusinesses.map((business) => {
            const bankBadges = getBankBadges(business);
            const visibleBadges = bankBadges.slice(0, 3);
            const remaining = bankBadges.length - 3;

            return (
              <div
                key={business.id}
                onClick={() => navigate(`/business/${business.id}`, { state: { business } })}
                className="w-full bg-blink-surface border-2 border-blink-ink shadow-hard flex flex-col active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
              >
                <div className="flex p-4 gap-4 items-center">
                  {/* Logo */}
                  <div className="w-24 h-24 shrink-0 border-2 border-blink-ink bg-white flex items-center justify-center p-2 overflow-hidden">
                    {business.image ? (
                      <img
                        alt={business.name}
                        className="w-full h-full object-contain grayscale"
                        src={business.image}
                        loading="lazy"
                      />
                    ) : (
                      <span className="font-display text-2xl text-blink-muted">
                        {business.name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-center h-full gap-1">
                    <h2 className="font-display text-lg uppercase leading-tight tracking-tight">
                      {business.name}
                    </h2>
                    <div className="bg-blink-ink text-primary p-1 w-fit border border-primary">
                      <span className="font-display text-xl leading-none block">
                        {getBestBenefitText(business)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {visibleBadges.map((badge) => (
                        <div
                          key={`${business.id}-${badge}`}
                          className="h-6 w-10 border border-blink-ink flex items-center justify-center bg-gray-100 text-[10px] font-bold font-mono"
                        >
                          {badge}
                        </div>
                      ))}
                      {remaining > 0 && (
                        <span className="text-xs font-bold text-gray-400">+{remaining}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="material-symbols-outlined text-blink-ink text-3xl">chevron_right</span>
                  </div>
                </div>
                <div className="bg-gray-100 border-t-2 border-blink-ink py-2 px-4 flex justify-between items-center">
                  <span className="font-mono text-xs font-bold text-blink-ink flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full border border-blink-ink" />
                    {business.benefits.length} BENEFICIOS ACTIVOS
                  </span>
                  <span className="font-mono text-xs text-gray-500">VER TODOS</span>
                </div>
              </div>
            );
          })
        )}

        {/* Load More */}
        {hasMore && (
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="w-full py-3 border-2 border-dashed border-blink-ink font-mono text-sm font-bold uppercase hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? 'Cargando...' : 'Cargar mas tiendas'}
          </button>
        )}
      </main>

      {/* Floating Map Button */}
      <div className="fixed bottom-24 right-4 z-30">
        <button
          onClick={() => navigate('/map')}
          className="flex items-center gap-2 bg-blink-ink text-white px-5 py-3 border-2 border-white shadow-hard hover:bg-blink-ink/90 transition-colors group active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <span className="material-symbols-outlined group-hover:rotate-12 transition-transform" style={{ fontSize: 20 }}>map</span>
          <span className="font-display uppercase tracking-wider text-sm">Mapa</span>
        </button>
      </div>

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

      {/* Filter Panel */}
      <FilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onlineOnly={onlineOnly}
        onOnlineChange={setOnlineOnly}
        maxDistance={maxDistance}
        onMaxDistanceChange={setMaxDistance}
        minDiscount={minDiscount}
        onMinDiscountChange={setMinDiscount}
        availableDay={availableDay}
        onAvailableDayChange={setAvailableDay}
        cardMode={cardMode}
        onCardModeChange={setCardMode}
        network={network}
        onNetworkChange={setNetwork}
        hasInstallments={hasInstallments}
        onHasInstallmentsChange={setHasInstallments}
      />

      <BottomNav />
    </div>
  );
}

export default SearchPage;
