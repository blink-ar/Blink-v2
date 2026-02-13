import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomNav from '../components/neo/BottomNav';
import FilterPanel from '../components/neo/FilterPanel';
import { useBenefitsData } from '../hooks/useBenefitsData';
import { useEnrichedBusinesses } from '../hooks/useEnrichedBusinesses';
import { Business, Category } from '../types';

function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Init from URL params
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialBank = searchParams.get('bank') || '';

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBanks, setSelectedBanks] = useState(initialBank ? [initialBank] : []);
  
  // Filter panel state
  const [showFilters, setShowFilters] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number | undefined>(undefined);
  const [minDiscount, setMinDiscount] = useState<number | undefined>(undefined);
  const [availableDay, setAvailableDay] = useState<string | undefined>(undefined);
  const [cardMode, setCardMode] = useState<'credit' | 'debit' | undefined>(undefined);
  const [network, setNetwork] = useState<string | undefined>(undefined);
  const [hasInstallments, setHasInstallments] = useState<boolean | undefined>(undefined);

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

  // Get max discount for a business
  const getMaxDiscount = (business: Business) => {
    let max = 0;
    business.benefits.forEach((b) => {
      const m = b.rewardRate.match(/(\d+)%/);
      if (m) max = Math.max(max, parseInt(m[1]));
    });
    return max;
  };

  // Get best benefit text
  const getBestBenefitText = (business: Business) => {
    const max = getMaxDiscount(business);
    if (max > 0) return `HASTA ${max}% OFF`;
    // Check for installments
    const withInstallments = business.benefits.find((b) => b.installments && b.installments > 0);
    if (withInstallments) return `${withInstallments.installments} CUOTAS S/INT`;
    return 'VER BENEFICIOS';
  };

  // Get abbreviated bank names
  const getBankBadges = (business: Business) => {
    const seen = new Set<string>();
    const badges: string[] = [];
    business.benefits.forEach((b) => {
      if (b.bankName && !seen.has(b.bankName)) {
        seen.add(b.bankName);
        // Abbreviate to 3-4 chars
        const abbr = b.bankName
          .replace(/banco\s*/i, '')
          .substring(0, 4)
          .toUpperCase();
        badges.push(abbr);
      }
    });
    return badges;
  };

  // Active filter pills info
  const getCategoryLabel = () => {
    if (!selectedCategory || selectedCategory === 'all') return null;
    const labels: Record<string, string> = {
      gastronomia: 'Gastronomía', moda: 'Moda', entretenimiento: 'Entretenimiento',
      deportes: 'Deportes', regalos: 'Regalos', viajes: 'Viajes',
      automotores: 'Automotores', belleza: 'Belleza', jugueterias: 'Jugueterías',
      hogar: 'Hogar', electro: 'Electro', shopping: 'Supermercado', otros: 'Otros',
    };
    return labels[selectedCategory] || selectedCategory;
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
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
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

        {/* Filter Pills */}
        <div className="w-full overflow-x-auto no-scrollbar border-t-2 border-blink-ink bg-white py-3">
          <div className="flex px-4 gap-3 min-w-max">
            <button
              onClick={() => setShowFilters(true)}
              className="px-4 py-1.5 rounded-full border-2 border-blink-ink bg-blink-ink text-white font-bold uppercase text-sm shadow-hard-sm whitespace-nowrap flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">tune</span>
              Filtros
            </button>
            <button
              onClick={() => {
                if (selectedBanks.length > 0) setSelectedBanks([]);
              }}
              className={`px-4 py-1.5 rounded-full border-2 border-blink-ink font-bold uppercase text-sm shadow-hard-sm whitespace-nowrap transition-colors ${
                selectedBanks.length > 0
                  ? 'bg-blink-ink text-white'
                  : 'bg-white text-blink-ink hover:bg-primary/20'
              }`}
            >
              Bancos
            </button>
            {getCategoryLabel() ? (
              <button
                onClick={() => setSelectedCategory('')}
                className="px-4 py-1.5 rounded-full border-2 border-blink-ink bg-blink-ink text-white font-bold uppercase text-sm shadow-hard-sm whitespace-nowrap"
              >
                Categoría: {getCategoryLabel()}
              </button>
            ) : (
              <button
                className="px-4 py-1.5 rounded-full border-2 border-blink-ink bg-white text-blink-ink font-bold uppercase text-sm shadow-hard-sm whitespace-nowrap hover:bg-primary/20 transition-colors"
              >
                Categoría
              </button>
            )}
            {availableDay ? (
              <button
                onClick={() => setAvailableDay(undefined)}
                className="px-4 py-1.5 rounded-full border-2 border-blink-ink bg-blink-ink text-white font-bold uppercase text-sm shadow-hard-sm whitespace-nowrap"
              >
                Día: {availableDay === 'today' ? 'Hoy' : availableDay}
              </button>
            ) : (
              <button
                className="px-4 py-1.5 rounded-full border-2 border-blink-ink bg-white text-blink-ink font-bold uppercase text-sm shadow-hard-sm whitespace-nowrap hover:bg-primary/20 transition-colors"
              >
                Día
              </button>
            )}
            <button
              className="px-4 py-1.5 rounded-full border-2 border-blink-ink bg-white text-blink-ink font-bold uppercase text-sm shadow-hard-sm whitespace-nowrap hover:bg-primary/20 transition-colors"
            >
              Tarjetas
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
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-full bg-blink-surface border-2 border-blink-ink shadow-hard h-40 animate-pulse" />
          ))
        ) : enrichedBusinesses.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 64 }}>search_off</span>
            <p className="font-display text-xl uppercase mt-4">Sin resultados</p>
            <p className="font-mono text-sm text-blink-muted mt-2">Probá con otro término o filtro</p>
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
                      {visibleBadges.map((badge, i) => (
                        <div
                          key={i}
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
            {isLoadingMore ? 'Cargando...' : 'Cargar más tiendas'}
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
