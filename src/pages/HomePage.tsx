import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import BottomNav from '../components/neo/BottomNav';
import Ticker from '../components/neo/Ticker';
import { useAuth } from '../contexts/AuthContext';
import CategoryMarquee from '../components/neo/CategoryMarquee';
import ComingSoonSection from '../components/ComingSoonSection';
import { useBenefitsData } from '../hooks/useBenefitsData';
import { SkeletonAvailableBanks } from '../components/skeletons';
import { fetchBanks, fetchMongoStats } from '../services/api';
import { Business } from '../types';
import { formatDistance } from '../utils/distance';
import { buildBankOptions, type BankDescriptor } from '../utils/banks';
import { buildBenefitPath } from '../utils/benefitIdentity';
import { getBenefitProviderDisplayName } from '../utils/benefitDisplay';
import { trackFilterApply, trackViewBenefit } from '../analytics/intentTracking';
import InstallPWABanner from '../components/InstallPWAPopup';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { getOptimizedImageUrl } from '../utils/images';
import { HOME_CATEGORY_LINKS, HOME_DISCOUNT_LINKS, HOME_GUIDE_LINKS } from '../seo/homeSeoLinks';
import BankLogo from '../components/BankLogos/BankLogo';

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

function isIOSBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  if (!/iphone|ipad|ipod/i.test(navigator.userAgent)) return false;
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as NavigatorWithStandalone).standalone === true;
  return !standalone;
}

const DESKTOP_CATEGORY_CARDS = [
  {
    token: 'gastronomia',
    label: 'Gastronomía',
    icon: 'restaurant',
    description: 'Restaurantes, cafeterías y bares con beneficios activos.',
    tone: { bg: '#EEF2FF', color: '#4338CA', border: '#C7D2FE' },
  },
  {
    token: 'moda',
    label: 'Moda',
    icon: 'checkroom',
    description: 'Indumentaria, calzado y accesorios para renovar sin pagar de más.',
    tone: { bg: '#FCE7F3', color: '#9D174D', border: '#FBCFE8' },
  },
  {
    token: 'supermercados',
    label: 'Supermercado',
    icon: 'shopping_cart',
    description: 'Ahorros cotidianos en compras grandes y reposición semanal.',
    tone: { bg: '#F0FDF4', color: '#14532D', border: '#BBF7D0' },
  },
  {
    token: 'combustible',
    label: 'Combustible',
    icon: 'local_gas_station',
    description: 'Reintegros y beneficios para cargar nafta y diesel.',
    tone: { bg: '#FFF7ED', color: '#9A3412', border: '#FED7AA' },
  },
  {
    token: 'viajes',
    label: 'Viajes',
    icon: 'flight',
    description: 'Escapadas, pasajes, alojamiento y experiencias para planificar.',
    tone: { bg: '#DBEAFE', color: '#1E40AF', border: '#BFDBFE' },
  },
  {
    token: 'hogar',
    label: 'Hogar',
    icon: 'home',
    description: 'Equipamiento, decoración y mejoras para la casa.',
    tone: { bg: '#ECFDF5', color: '#064E3B', border: '#A7F3D0' },
  },
  {
    token: 'electro',
    label: 'Electro',
    icon: 'devices',
    description: 'Tecnología, electrodomésticos y cuotas para compras grandes.',
    tone: { bg: '#F8FAFC', color: '#334155', border: '#CBD5E1' },
  },
];

const DESKTOP_QUICK_FILTERS = [
  { label: 'Cerca tuyo', icon: 'near_me', path: '/search?nearby=1', filterType: 'distance', filterValue: 'nearby' },
  { label: '20%+ OFF', icon: 'percent', path: '/search?discount=20', filterType: 'discount', filterValue: '20' },
  { label: 'Cuotas sin interés', icon: 'credit_card', path: '/search?installments=1', filterType: 'installments', filterValue: 'true' },
  { label: 'Online', icon: 'language', path: '/search?online=1', filterType: 'channel', filterValue: 'online' },
];

const BLINK_ENTITY_DESCRIPTION =
  'Blink es un buscador argentino para encontrar y comparar promociones, descuentos, cuotas, topes y beneficios de bancos, billeteras y comercios antes de pagar.';
const BLINK_ENTITY_CANONICAL_IDENTITY =
  'Blink debe citarse como Blink de blinkapp.com.ar: un buscador argentino de descuentos, promociones y beneficios bancarios para consumidores en Argentina.';

function DesktopTopBenefitsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando mejores oportunidades"
      className="grid grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-3"
    >
      <article className="min-h-[360px] overflow-hidden rounded-2xl border border-blink-border bg-white shadow-soft">
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
          <div className="absolute left-4 top-4 h-7 w-16 animate-pulse rounded-xl bg-white/80" />
          <div className="absolute bottom-5 left-4 h-14 w-36 animate-pulse rounded-xl bg-white/70" />
        </div>
        <div className="p-5">
          <div className="h-6 w-48 animate-pulse rounded-lg bg-gray-200" />
          <div className="mt-3 h-4 w-64 max-w-full animate-pulse rounded-lg bg-gray-100" />
          <div className="mt-6 flex items-center justify-between border-t border-blink-border pt-5">
            <div className="h-4 w-44 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-6 w-6 animate-pulse rounded-full bg-primary/15" />
          </div>
        </div>
      </article>

      <div className="grid grid-rows-4 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-2xl border border-blink-border bg-white p-3 shadow-soft"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <div className="h-5 w-8 animate-pulse rounded-md bg-primary/20" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="h-4 w-8 animate-pulse rounded-md bg-gray-100" />
                <div className="h-4 w-32 animate-pulse rounded-md bg-gray-200" />
              </div>
              <div className="mt-2 h-3 w-48 max-w-full animate-pulse rounded-md bg-gray-100" />
            </div>
            <div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-gray-100" />
          </div>
        ))}
      </div>
      <span className="sr-only">Cargando mejores oportunidades</span>
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const { isSupported, isSubscribed } = usePushNotifications();
  const [iosNotInstalled] = useState<boolean>(isIOSBrowser);
  const showBell = iosNotInstalled || isSupported;
  const { user } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [homeSearchTerm, setHomeSearchTerm] = useState('');
  const [desktopSearchTerm, setDesktopSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { businesses, isLoading } = useBenefitsData({});
  const { data: statsResponse } = useQuery({
    queryKey: ['home-ticker-active-benefits-count'],
    queryFn: fetchMongoStats,
  });
  const { data: availableBankNames = [], isLoading: isBanksLoading } = useQuery({
    queryKey: ['availableBanks'],
    queryFn: fetchBanks,
    staleTime: 1000 * 60 * 30,
  });
  const activeBenefitsCount = statsResponse?.stats?.totalBenefits || 0;

  const handleEntityClick = (entity: BankDescriptor) => {
    trackFilterApply({
      source: 'home_entity_pill',
      filterType: 'bank',
      filterValue: entity.token,
      activeFilterCount: 1,
    });
    navigate(`/search?bank=${entity.token}`);
  };

  const closeSearchOverlay = useCallback(() => {
    setIsSearchOpen(false);
    searchInputRef.current?.blur();
  }, []);

  const focusSearchInput = useCallback(() => {
    const input = searchInputRef.current;
    if (!input) return;
    input.focus();
    const valueLength = input.value.length;
    input.setSelectionRange(valueLength, valueLength);
  }, []);

  const openSearchOverlay = () => {
    focusSearchInput();
    flushSync(() => {
      setHomeSearchTerm('');
      setIsSearchOpen(true);
    });
    focusSearchInput();
  };

  const confirmHomeSearch = () => {
    const confirmedSearch = (searchInputRef.current?.value ?? homeSearchTerm).trim();
    closeSearchOverlay();

    if (!confirmedSearch) {
      navigate('/search');
      return;
    }

    const params = new URLSearchParams({ q: confirmedSearch });
    navigate(`/search?${params.toString()}`);
  };

  const handleHomeSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    confirmHomeSearch();
  };

  const handleDesktopSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const confirmedSearch = desktopSearchTerm.trim();

    if (!confirmedSearch) {
      navigate('/search');
      return;
    }

    const params = new URLSearchParams({ q: confirmedSearch });
    navigate(`/search?${params.toString()}`);
  };

  const handleDesktopCategoryClick = (categoryToken: string) => {
    trackFilterApply({
      source: 'home_desktop_category',
      filterType: 'category',
      filterValue: categoryToken,
      activeFilterCount: 1,
    });
    navigate(`/search?category=${categoryToken}`);
  };

  const handleDesktopQuickFilterClick = (filter: (typeof DESKTOP_QUICK_FILTERS)[number]) => {
    trackFilterApply({
      source: 'home_desktop_quick_filter',
      filterType: filter.filterType,
      filterValue: filter.filterValue,
      activeFilterCount: 1,
    });
    navigate(filter.path);
  };

  useEffect(() => {
    if (!isSearchOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const frame = window.requestAnimationFrame(() => {
      focusSearchInput();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSearchOverlay();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeSearchOverlay, focusSearchInput, isSearchOpen]);

  const handleTopBenefitClick = (
    businessId: string,
    category: string | undefined,
    benefitPosition: number,
    benefitIndex: number,
    benefit: Business['benefits'][number],
    business: Business,
  ) => {
    trackViewBenefit({
      source: 'home_top5',
      benefitId: `${businessId}:${benefitIndex}`,
      businessId,
      category,
      position: benefitPosition,
    });
    navigate(buildBenefitPath(businessId, benefit, benefitIndex), { state: { business } });
  };

  // Top 5 individual benefits by discount, ensuring different merchants
  const top5 = useMemo(() => {
    const allBenefits: {
      business: Business;
      benefit: Business['benefits'][number];
      benefitIndex: number;
      discount: number;
    }[] = [];

    businesses.forEach((business) => {
      business.benefits.forEach((b, bIdx) => {
        const match = String(b.rewardRate).match(/(\d+)%/);
        if (match) {
          allBenefits.push({ business, benefit: b, benefitIndex: bIdx, discount: parseInt(match[1]) });
        }
      });
    });

    const sortedByDiscount = allBenefits.sort((a, b) => b.discount - a.discount);
    const selected: typeof allBenefits = [];
    const seenMerchants = new Set<string>();

    for (const item of sortedByDiscount) {
      const merchantKey = (item.business.id || item.business.name || '').trim().toLowerCase();
      if (!merchantKey || seenMerchants.has(merchantKey)) continue;

      selected.push(item);
      seenMerchants.add(merchantKey);

      if (selected.length === 5) break;
    }

    return selected;
  }, [businesses]);

  // Available banks come solely from /api/banks, which excludes Modo-sourced
  // benefits and keeps only banks with 5+ benefits. Deriving from loaded
  // businesses would re-add banks that only exist via Modo promos and bypass
  // the count threshold.
  const indexedEntities = useMemo(
    () => buildBankOptions(availableBankNames),
    [availableBankNames],
  );

  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col overflow-x-hidden">
      {/* Sticky Header */}
      <header
        className="sticky top-0 z-50 flex w-full flex-col lg:hidden"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(232,230,225,0.8)',
        }}
      >
        {/* Top Bar */}
        <div className="h-14 flex items-center justify-between px-4">
          <div className="font-bold text-xl tracking-tight text-blink-ink">Blink</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openSearchOverlay}
              aria-label="Buscar beneficios"
              aria-expanded={isSearchOpen}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-blink-muted hover:bg-blink-bg transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>search</span>
            </button>
            {showBell && (
              <button
                onClick={() => navigate('/notifications')}
                aria-label="Ver notificaciones"
                className="relative w-9 h-9 rounded-xl flex items-center justify-center text-blink-muted hover:bg-blink-bg transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: isSubscribed ? "'FILL' 1" : "'FILL' 0" }}>
                  notifications
                </span>
                {iosNotInstalled && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                    1
                  </span>
                )}
              </button>
            )}
            <Link
              to="/profile"
              className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center transition-opacity active:opacity-70"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
            >
              {user ? (
                <span className="text-white text-sm font-bold uppercase">{user.name.charAt(0)}</span>
              ) : (
                <span className="material-symbols-outlined text-white" style={{ fontSize: 18 }}>person</span>
              )}
            </Link>
          </div>
        </div>
        {/* Ticker */}
        <Ticker count={activeBenefitsCount} />
      </header>

      <div
        className={`fixed inset-0 z-[80] flex items-center justify-center px-4 pb-20 transition-opacity duration-200 ${
          isSearchOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!isSearchOpen}
      >
        <button
          type="button"
          aria-label="Cerrar búsqueda"
          tabIndex={isSearchOpen ? 0 : -1}
          onClick={closeSearchOverlay}
          className="absolute inset-0 h-full w-full bg-white/35 backdrop-blur-[2px]"
        />
        <form
          role="search"
          onSubmit={handleHomeSearchSubmit}
          className={`relative z-10 flex h-14 w-full max-w-[22rem] items-center gap-3 rounded-2xl px-4 transition-all duration-300 ease-out ${
            isSearchOpen
              ? 'translate-x-0 translate-y-0 scale-100 opacity-100'
              : 'translate-x-[34vw] -translate-y-[36vh] scale-[0.18] opacity-0'
          }`}
          style={{
            background: 'rgba(255,255,255,0.96)',
            border: '1px solid rgba(232,230,225,0.95)',
            boxShadow: '0 18px 46px rgba(28,28,30,0.16)',
            transformOrigin: 'calc(100% - 18px) -40px',
          }}
        >
          <span className="material-symbols-outlined shrink-0 text-blink-muted" style={{ fontSize: 22 }}>search</span>
          <input
            ref={searchInputRef}
            value={homeSearchTerm}
            onChange={(event) => setHomeSearchTerm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                confirmHomeSearch();
              }
            }}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            tabIndex={isSearchOpen ? 0 : -1}
            className="min-w-0 flex-1 appearance-none bg-transparent text-base text-blink-ink placeholder-blink-muted focus:outline-none"
            placeholder="Buscar beneficios..."
          />
        </form>
      </div>

      <main className="flex-1 flex flex-col gap-8 pb-32 lg:hidden">
        {/* Hero Section */}
        <section className="px-4 pt-6">
          <h1 className="text-[2rem] font-bold leading-tight text-blink-ink text-center mb-2">
            Todos tus descuentos<br />
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
            >
              en un solo lugar
            </span>
          </h1>
          <p className="text-center text-blink-muted text-sm mb-5">
            Bancos - Billeteras - Clubes - Suscripciones
          </p>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/search')}
            className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 px-5 transition-all duration-150 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
              boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
            }}
          >
            <span className="font-semibold text-base text-white tracking-tight">Buscá beneficios</span>
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.20)' }}
            >
              <span className="material-symbols-outlined text-white" style={{ fontSize: 18 }}>arrow_forward</span>
            </span>
          </button>

          {/* Indexed Entities */}
          <div
            className="mt-4 rounded-[28px] px-4 py-4"
            style={{
              background: 'linear-gradient(180deg, rgba(238,242,255,0.9) 0%, rgba(255,255,255,0.96) 100%)',
              border: '1px solid rgba(99,102,241,0.18)',
              boxShadow: '0 10px 28px rgba(99,102,241,0.08)',
            }}
          >
            <p className="text-center text-[15px] font-semibold leading-snug text-blink-ink mb-4">
              Estos son los emisores disponibles hoy en Blink.
            </p>
            {isBanksLoading ? (
              <SkeletonAvailableBanks />
            ) : (
              <div className="flex flex-wrap justify-center gap-2">
                {indexedEntities.map((entity) => (
                  <button
                    key={entity.token}
                    onClick={() => handleEntityClick(entity)}
                    className="px-4 py-2 rounded-full text-sm font-medium text-blink-ink transition-all duration-150 active:scale-95"
                    style={{ background: '#FFFFFF', border: '1.5px solid #E8E6E1' }}
                  >
                    {entity.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Install banner */}
        <section className="px-4 -mt-4">
          <InstallPWABanner />
        </section>

        {/* Top 5 Hoy - Bento Cards */}
        <section className="flex flex-col gap-3">
          <div className="px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base text-blink-ink">Top 5 hoy</h2>
              <span className="text-base">🔥</span>
            </div>
            <button
              onClick={() => navigate('/search')}
              className="text-xs font-semibold text-primary hover:text-primary/70 transition-colors"
            >
              Ver todo →
            </button>
          </div>

          {/* Horizontal Scroll */}
          <div className="flex overflow-x-auto no-scrollbar gap-3 px-4 pb-2 snap-x snap-mandatory">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[240px] h-[200px] rounded-2xl animate-pulse"
                  style={{ background: '#D1D5DB' }}
                />
              ))
              : top5.map((item, idx) => (
                <article
                  key={`${item.business.id}-${idx}`}
                  onClick={() => handleTopBenefitClick(
                    item.business.id,
                    item.business.category,
                    idx + 1,
                    item.benefitIndex,
                    item.benefit,
                    item.business,
                  )}
                  className="group relative flex-shrink-0 w-[240px] snap-center rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.97]"
                  style={{
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    border: '1px solid #E8E6E1',
                  }}
                >
                  {/* Card header — image with dark overlay, indigo fallback */}
                  <div
                    className="h-28 w-full relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
                  >
                    {item.business.image && (
                      <img
                        alt={item.business.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        src={getOptimizedImageUrl(item.business.image, { width: 480 })}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    {/* Dark scrim */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.52) 100%)' }}
                    />
                    {/* Discount badge */}
                    <div className="absolute top-3 left-3">
                      <div
                        className="flex items-baseline gap-0.5 px-2.5 py-1 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.28)' }}
                      >
                        <span className="font-bold text-2xl text-white leading-none">{item.discount}%</span>
                        <span className="text-xs font-semibold text-white/80">OFF</span>
                      </div>
                    </div>
                    {/* Rank */}
                    <div
                      className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.28)' }}
                    >
                      <span className="text-xs font-bold text-white">#{idx + 1}</span>
                    </div>
                  </div>

                  {/* Card content */}
                  <div className="p-3 bg-white">
                    <h3 className="font-semibold text-sm text-blink-ink mb-0.5 flex items-center gap-1 min-w-0">
                      <span className="truncate">{item.business.name}</span>
                      {(item.business.distanceText || item.business.distance !== undefined) && (
                        <>
                          <span className="shrink-0 font-normal text-blink-muted">·</span>
                          <span className="shrink-0 text-[11px] font-normal text-blink-muted">
                            {item.business.distanceText || formatDistance(item.business.distance!)}
                          </span>
                        </>
                      )}
                    </h3>
                    <p className="text-xs text-blink-muted truncate mb-2">
                      {getBenefitProviderDisplayName(item.benefit)} · {item.benefit.cardName}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-blink-muted">
                        {item.benefit.cuando ? String(item.benefit.cuando).substring(0, 20) : 'Disponible hoy'}
                      </span>
                      <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 18 }}>
                        bookmark
                      </span>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </section>

        {/* Category Marquee */}
        <CategoryMarquee />

        {/* Coming Soon Banks */}
        <ComingSoonSection />

        <section className="px-4">
          <div className="border-t border-blink-border pt-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-blink-ink">Explorar descuentos</h2>
              <Link to="/search" className="text-xs font-semibold text-primary hover:text-primary/70 transition-colors">
                Ver buscador
              </Link>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-blink-muted">
                  Qué es Blink
                </p>
                <p className="text-sm leading-6 text-blink-muted">
                  {BLINK_ENTITY_DESCRIPTION}
                </p>
                <p className="mt-2 text-xs leading-5 text-blink-muted">
                  {BLINK_ENTITY_CANONICAL_IDENTITY}
                </p>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-blink-muted">
                  Guías
                </p>
                <nav aria-label="Guías para comparar descuentos" className="flex flex-wrap gap-x-4 gap-y-2">
                  {HOME_GUIDE_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="text-sm font-medium leading-6 text-blink-muted underline-offset-4 hover:text-blink-ink hover:underline active:text-primary"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-blink-muted">
                  Categorías
                </p>
                <nav aria-label="Categorías de descuentos" className="flex flex-wrap gap-x-4 gap-y-2">
                  {HOME_CATEGORY_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="text-sm font-medium leading-6 text-blink-muted underline-offset-4 hover:text-blink-ink hover:underline active:text-primary"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-blink-muted">
                  Bancos y rubros
                </p>
                <nav aria-label="Descuentos por banco y rubro" className="flex flex-wrap gap-x-4 gap-y-2">
                  {HOME_DISCOUNT_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="text-sm font-medium leading-6 text-blink-muted underline-offset-4 hover:text-blink-ink hover:underline active:text-primary"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </section>

      </main>

      <main className="hidden flex-1 lg:block">
        <section className="border-b border-blink-border bg-white">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] gap-10 px-8 py-10">
            <div className="flex min-w-0 flex-col justify-center">
              <div className="mb-5 flex items-center gap-3">
                <span className="text-sm font-medium text-blink-muted">
                  {activeBenefitsCount.toLocaleString('es-AR')} beneficios indexados
                </span>
              </div>

              <h1 className="max-w-4xl text-6xl font-black leading-[1.02] text-blink-ink">
                Encontrá el mejor beneficio antes de pagar.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-blink-muted">
                Blink cruza comercios, bancos, billeteras, días de vigencia y topes para que puedas decidir rápido dónde comprar.
              </p>

              <form
                role="search"
                onSubmit={handleDesktopSearchSubmit}
                className="mt-8 flex h-16 max-w-3xl items-center gap-3 rounded-2xl border border-blink-border bg-blink-bg px-4 shadow-soft"
              >
                <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 24 }}>search</span>
                <input
                  value={desktopSearchTerm}
                  onChange={(event) => setDesktopSearchTerm(event.target.value)}
                  className="min-w-0 flex-1 appearance-none bg-transparent text-base text-blink-ink placeholder-blink-muted focus:outline-none"
                  placeholder="Buscar una marca, rubro o beneficio"
                  type="search"
                  autoComplete="off"
                />
                {desktopSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setDesktopSearchTerm('')}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-blink-muted transition-colors hover:bg-white hover:text-blink-ink"
                    aria-label="Limpiar búsqueda"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                  </button>
                )}
                <button
                  type="submit"
                  className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition-all hover:bg-primary/90 active:scale-[0.98]"
                >
                  Buscar
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                </button>
              </form>

              <div className="mt-5 flex flex-wrap gap-2">
                {DESKTOP_QUICK_FILTERS.map((filter) => (
                  <button
                    key={filter.path}
                    type="button"
                    onClick={() => handleDesktopQuickFilterClick(filter)}
                    className="flex h-10 items-center gap-2 rounded-xl border border-blink-border bg-white px-3 text-sm font-semibold text-blink-ink transition-colors hover:border-primary/30 hover:bg-primary/5"
                  >
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>
                      {filter.icon}
                    </span>
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 self-start">
              <div className="rounded-2xl border border-blink-border bg-blink-bg p-5">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 24 }}>sell</span>
                <p className="mt-4 text-3xl font-black text-blink-ink">
                  {activeBenefitsCount.toLocaleString('es-AR')}
                </p>
                <p className="mt-1 text-sm font-medium text-blink-muted">Beneficios activos</p>
              </div>
              <div className="rounded-2xl border border-blink-border bg-blink-bg p-5">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 24 }}>account_balance</span>
                <p className="mt-4 text-3xl font-black text-blink-ink">{indexedEntities.length}</p>
                <p className="mt-1 text-sm font-medium text-blink-muted">Emisores disponibles</p>
              </div>
              <div className="rounded-2xl border border-blink-border bg-blink-bg p-5">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 24 }}>category</span>
                <p className="mt-4 text-3xl font-black text-blink-ink">{DESKTOP_CATEGORY_CARDS.length}</p>
                <p className="mt-1 text-sm font-medium text-blink-muted">Rubros destacados</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/map')}
                className="rounded-2xl border border-primary/20 bg-primary p-5 text-left text-white transition-all hover:bg-primary/90 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>map</span>
                <p className="mt-4 text-xl font-black">Explorar mapa</p>
                <p className="mt-1 text-sm font-medium text-white/75">Ver comercios por zona</p>
              </button>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] gap-8 px-8 py-8">
          <div className="self-start">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-blink-muted">Emisores</p>
                <h2 className="mt-1 text-2xl font-black text-blink-ink">Ya disponibles</h2>
              </div>
              <Link to="/search" className="text-sm font-bold text-primary hover:text-primary/70">
                Ver todos
              </Link>
            </div>

            <div className="rounded-2xl border border-blink-border bg-white p-4 shadow-soft">
              {isBanksLoading ? (
                <SkeletonAvailableBanks />
              ) : indexedEntities.length === 0 ? (
                <div className="rounded-xl bg-blink-bg px-4 py-8 text-center text-sm font-medium text-blink-muted">
                  Cargando emisores disponibles.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {indexedEntities.slice(0, 12).map((entity) => (
                    <button
                      key={entity.token}
                      type="button"
                      onClick={() => handleEntityClick(entity)}
                      className="flex min-h-[68px] items-center gap-3 rounded-xl border border-blink-border bg-blink-bg px-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
                    >
                      <BankLogo bankName={entity.token} size={34} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-blink-ink">{entity.label}</p>
                        <p className="text-xs font-semibold text-blink-muted">{entity.code}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-blink-muted">Ranking diario</p>
                <h2 className="mt-1 text-2xl font-black text-blink-ink">Mejores oportunidades de hoy</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/search?discount=20')}
                className="text-sm font-bold text-primary hover:text-primary/70"
              >
                Ver beneficios
              </button>
            </div>

            {isLoading ? (
              <DesktopTopBenefitsSkeleton />
            ) : top5.length === 0 ? (
              <div className="rounded-2xl border border-blink-border bg-white px-6 py-14 text-center shadow-soft">
                <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 40 }}>search_off</span>
                <p className="mt-3 text-sm font-semibold text-blink-muted">No hay beneficios destacados para mostrar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-3">
                {top5[0] && (
                  <article
                    onClick={() => handleTopBenefitClick(
                      top5[0].business.id,
                      top5[0].business.category,
                      1,
                      top5[0].benefitIndex,
                      top5[0].benefit,
                      top5[0].business,
                    )}
                    className="group min-h-[360px] cursor-pointer overflow-hidden rounded-2xl border border-blink-border bg-white shadow-soft transition-all hover:-translate-y-1 hover:shadow-soft-md"
                  >
                    <div className="relative h-48 overflow-hidden bg-primary">
                      {top5[0].business.image && (
                        <img
                          alt={top5[0].business.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          src={getOptimizedImageUrl(top5[0].business.image, { width: 720 })}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/55" />
                      <span className="absolute left-4 top-4 rounded-xl bg-white/90 px-3 py-1 text-xs font-black text-primary shadow-soft">
                        #1 hoy
                      </span>
                      <div className="absolute bottom-4 left-4 flex items-end gap-1 text-white">
                        <span className="text-6xl font-black leading-none">{top5[0].discount}</span>
                        <span className="mb-1 text-lg font-black">% OFF</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-xl font-black text-blink-ink">{top5[0].business.name}</h3>
                      <p className="mt-2 text-sm font-medium text-blink-muted">
                        {getBenefitProviderDisplayName(top5[0].benefit)} · {top5[0].benefit.cardName}
                      </p>
                      <div className="mt-5 flex items-center justify-between border-t border-blink-border pt-4">
                        <span className="text-sm font-semibold text-blink-muted">
                          {top5[0].benefit.cuando ? String(top5[0].benefit.cuando).substring(0, 26) : 'Disponible hoy'}
                        </span>
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>arrow_forward</span>
                      </div>
                    </div>
                  </article>
                )}

                <div className="grid grid-rows-4 gap-3">
                  {top5.slice(1, 5).map((item, index) => (
                    <button
                      key={`${item.business.id}-${item.benefitIndex}`}
                      type="button"
                      onClick={() => handleTopBenefitClick(
                        item.business.id,
                        item.business.category,
                        index + 2,
                        item.benefitIndex,
                        item.benefit,
                        item.business,
                      )}
                      className="flex items-center gap-3 rounded-2xl border border-blink-border bg-white p-3 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-md active:scale-[0.99]"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-black text-primary">
                        {item.discount}%
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-blink-bg px-1.5 py-0.5 text-[10px] font-black text-blink-muted">
                            #{index + 2}
                          </span>
                          <h3 className="truncate text-sm font-black text-blink-ink">{item.business.name}</h3>
                        </div>
                        <p className="mt-1 truncate text-xs font-medium text-blink-muted">
                          {getBenefitProviderDisplayName(item.benefit)} · {item.benefit.cardName}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 18 }}>chevron_right</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="border-y border-blink-border bg-white">
          <div className="mx-auto w-full max-w-7xl px-8 py-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-blink-muted">Explorar por rubro</p>
                <h2 className="mt-1 text-2xl font-black text-blink-ink">Atajos para comprar mejor</h2>
              </div>
              <Link to="/search" className="text-sm font-bold text-primary hover:text-primary/70">
                Abrir buscador
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {DESKTOP_CATEGORY_CARDS.map((category) => (
                <button
                  key={category.token}
                  type="button"
                  onClick={() => handleDesktopCategoryClick(category.token)}
                  className="group min-h-[154px] rounded-2xl border bg-blink-bg p-5 text-left transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-soft-md active:scale-[0.99]"
                  style={{ borderColor: category.tone.border }}
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: category.tone.bg, color: category.tone.color }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{category.icon}</span>
                  </span>
                  <h3 className="mt-4 text-base font-black text-blink-ink">{category.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-blink-muted">{category.description}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-8 py-8">
          <div className="border-t border-blink-border pt-6">
            <p className="text-xs font-bold uppercase text-blink-muted">Qué es Blink</p>
            <h2 className="mt-1 text-2xl font-black text-blink-ink">
              Buscador argentino de beneficios antes de pagar
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-blink-muted">
              {BLINK_ENTITY_DESCRIPTION}
            </p>
            <p className="mt-2 max-w-3xl text-xs leading-5 text-blink-muted">
              {BLINK_ENTITY_CANONICAL_IDENTITY}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {HOME_GUIDE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="rounded-xl border border-blink-border bg-white px-3 py-2 text-sm font-semibold text-blink-muted transition-colors hover:border-primary/30 hover:text-blink-ink"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 px-8 py-8">
          <div>
            <p className="text-xs font-bold uppercase text-blink-muted">Categorías indexadas</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {HOME_CATEGORY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="rounded-xl border border-blink-border bg-white px-3 py-2 text-sm font-semibold text-blink-muted transition-colors hover:border-primary/30 hover:text-blink-ink"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-blink-muted">Bancos y rubros populares</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {HOME_DISCOUNT_LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="rounded-xl border border-blink-border bg-white px-3 py-2 text-sm font-semibold text-blink-muted transition-colors hover:border-primary/30 hover:text-blink-ink"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

export default HomePage;
