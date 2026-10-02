import { type FormEvent, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import BottomNav from '../components/neo/BottomNav';
import Ticker from '../components/neo/Ticker';
import { useAuth } from '../contexts/AuthContext';
import CategoryMarquee from '../components/neo/CategoryMarquee';
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
import { isAvailableToday } from '../utils/benefitAvailability';

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

interface MobileQuickFilter {
  label: string;
  icon: string;
  path: string;
  filterType: string;
  filterValue: string;
}

// Same keys SearchPage uses for its "Hoy" pill, so the pill shows as active on arrival.
const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const buildMobileQuickFilters = (todayKey: string): MobileQuickFilter[] => [
  { label: 'Hoy', icon: 'today', path: `/search?day=${todayKey}`, filterType: 'day', filterValue: todayKey },
  ...DESKTOP_QUICK_FILTERS,
];

const BLINK_ENTITY_DESCRIPTION =
  'Blink es un buscador argentino para encontrar y comparar promociones, descuentos, cuotas, topes y beneficios de bancos, billeteras y comercios antes de pagar.';

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
  const [mobileSearchTerm, setMobileSearchTerm] = useState('');
  // Computed on every render so a PWA tab left open past midnight doesn't keep yesterday's day.
  const todayKey = WEEKDAY_KEYS[new Date().getDay()];
  const mobileQuickFilters = useMemo(() => buildMobileQuickFilters(todayKey), [todayKey]);
  const [desktopSearchTerm, setDesktopSearchTerm] = useState('');
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

  const goToSearch = (term: string) => {
    const confirmedSearch = term.trim();
    navigate(confirmedSearch ? `/search?${new URLSearchParams({ q: confirmedSearch }).toString()}` : '/search');
  };

  const handleMobileSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    goToSearch(mobileSearchTerm);
  };

  const handleMobileQuickFilterClick = (filter: MobileQuickFilter) => {
    trackFilterApply({
      source: 'home_mobile_quick_filter',
      filterType: filter.filterType,
      filterValue: filter.filterValue,
      activeFilterCount: 1,
    });
    navigate(filter.path);
  };

  const handleDesktopSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    goToSearch(desktopSearchTerm);
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

    const now = new Date();
    businesses.forEach((business) => {
      business.benefits.forEach((b, bIdx) => {
        const match = String(b.rewardRate).match(/(\d+)%/);
        // "Top 5 hoy" must be usable today: skip benefits limited to other weekdays.
        if (match && isAvailableToday(b, now)) {
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
  }, [businesses, todayKey]); // todayKey: re-rank when the day rolls over

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
            {showBell && (
              <button
                onClick={() => navigate('/notifications')}
                aria-label="Ver notificaciones"
                className="relative w-9 h-9 rounded-xl flex items-center justify-center text-blink-muted hover:bg-blink-bg transition-colors"
              >
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 22, fontVariationSettings: isSubscribed ? "'FILL' 1" : "'FILL' 0" }}>
                  notifications
                </span>
              </button>
            )}
            <Link
              to="/profile"
              aria-label={user ? 'Ir a tu perfil' : 'Ingresar o crear cuenta'}
              className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center transition-opacity active:opacity-70"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
            >
              {user ? (
                <span className="text-white text-sm font-bold uppercase">{user.name.charAt(0)}</span>
              ) : (
                <span className="material-symbols-outlined text-white" aria-hidden="true" style={{ fontSize: 18 }}>person</span>
              )}
            </Link>
          </div>
        </div>
        {/* Ticker */}
        <Ticker count={activeBenefitsCount} />
      </header>

      <main className="flex-1 flex flex-col gap-7 pb-32 lg:hidden">
        {/* Hero: search first, so the first screen is about finding a discount */}
        <section className="px-4 pt-5">
          <h1 className="text-[1.65rem] font-bold leading-tight text-blink-ink mb-1">
            Todos tus descuentos{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
            >
              en un solo lugar
            </span>
          </h1>
          <p className="text-blink-muted text-sm mb-4">
            Bancos, billeteras, clubes y suscripciones.
          </p>

          <form
            role="search"
            onSubmit={handleMobileSearchSubmit}
            className="flex h-14 items-center gap-2 rounded-2xl border border-blink-border bg-white pl-4 pr-2 shadow-soft focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15"
          >
            <span className="material-symbols-outlined shrink-0 text-blink-muted" aria-hidden="true" style={{ fontSize: 22 }}>search</span>
            <input
              value={mobileSearchTerm}
              onChange={(event) => setMobileSearchTerm(event.target.value)}
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              aria-label="Buscar comercio, rubro o beneficio"
              className="min-w-0 flex-1 appearance-none bg-transparent text-base text-blink-ink placeholder-blink-muted focus:outline-none"
              placeholder="Comercio o rubro"
            />
            <button
              type="submit"
              className="flex h-10 shrink-0 items-center rounded-xl px-4 text-sm font-semibold text-white transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
            >
              Buscar
            </button>
          </form>

          <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto no-scrollbar px-4">
            {mobileQuickFilters.map((filter) => (
              <button
                key={filter.label}
                type="button"
                onClick={() => handleMobileQuickFilterClick(filter)}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-blink-border bg-white px-3 text-sm font-medium text-blink-ink transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-primary" aria-hidden="true" style={{ fontSize: 17 }}>{filter.icon}</span>
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        {/* Top 5 hoy */}
        <section className="flex flex-col gap-3">
          <div className="px-4 flex items-center justify-between">
            <h2 className="font-semibold text-base text-blink-ink">Mejores descuentos de hoy</h2>
            <Link
              to={`/search?day=${todayKey}`}
              className="text-xs font-semibold text-primary hover:text-primary/70 transition-colors"
            >
              Ver todos
            </Link>
          </div>

          {/* Horizontal Scroll */}
          <div className="flex overflow-x-auto no-scrollbar gap-3 px-4 pb-2 snap-x snap-mandatory">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[240px] h-[200px] rounded-2xl animate-pulse"
                  style={{ background: '#E5E7EB' }}
                />
              ))
              : top5.length === 0 ? (
                <div className="w-full rounded-2xl border border-blink-border bg-white px-4 py-6 text-center text-sm text-blink-muted">
                  No encontramos descuentos destacados para hoy.{' '}
                  <Link to="/search" className="font-semibold text-primary">Ver todos los beneficios</Link>
                </div>
              ) : top5.map((item, idx) => (
                <button
                  type="button"
                  key={`${item.business.id}-${idx}`}
                  onClick={() => handleTopBenefitClick(
                    item.business.id,
                    item.business.category,
                    idx + 1,
                    item.benefitIndex,
                    item.benefit,
                    item.business,
                  )}
                  className="group relative flex-shrink-0 w-[240px] snap-center rounded-2xl overflow-hidden text-left transition-all duration-200 active:scale-[0.97]"
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
                        alt=""
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
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-blink-positive">
                      <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 13 }}>check_circle</span>
                      Válido hoy
                    </span>
                  </div>
                </button>
              ))}
          </div>
        </section>

        {/* Issuers: one scrollable row instead of a wall of pills */}
        <section className="flex flex-col gap-3">
          <div className="px-4 flex items-center justify-between">
            <h2 className="font-semibold text-base text-blink-ink">
              Emisores en Blink
              {indexedEntities.length > 0 && (
                <span className="ml-1.5 text-sm font-normal text-blink-muted">({indexedEntities.length})</span>
              )}
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
            {isBanksLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
                  <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
                  <div className="h-3 w-12 animate-pulse rounded bg-gray-100" />
                </div>
              ))
              : indexedEntities.map((entity) => (
                <button
                  key={entity.token}
                  type="button"
                  onClick={() => handleEntityClick(entity)}
                  className="flex w-16 shrink-0 flex-col items-center gap-1.5 transition-transform active:scale-95"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-blink-border bg-white shadow-soft">
                    <BankLogo bankName={entity.token} size={34} />
                  </span>
                  <span className="w-full truncate text-center text-[11px] font-medium text-blink-ink">
                    {entity.name}
                  </span>
                </button>
              ))}
          </div>
        </section>

        {/* Install banner */}
        <section className="px-4">
          <InstallPWABanner />
        </section>

        {/* Category Marquee */}
        <CategoryMarquee />


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
              <div className="mb-5 flex h-5 items-center gap-3">
                {activeBenefitsCount > 0 && (
                  <span className="text-sm font-medium text-blink-muted">
                    {activeBenefitsCount.toLocaleString('es-AR')} beneficios indexados
                  </span>
                )}
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
                  {activeBenefitsCount > 0 ? activeBenefitsCount.toLocaleString('es-AR') : '—'}
                </p>
                <p className="mt-1 text-sm font-medium text-blink-muted">Beneficios activos</p>
              </div>
              <div className="rounded-2xl border border-blink-border bg-blink-bg p-5">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 24 }}>account_balance</span>
                <p className="mt-4 text-3xl font-black text-blink-ink">{indexedEntities.length > 0 ? indexedEntities.length : '—'}</p>
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
