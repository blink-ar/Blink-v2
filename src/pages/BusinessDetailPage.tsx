import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Business, BankBenefit } from '../types';
import { fetchBusinessById } from '../services/api';
import { trackSelectBusiness, trackStartNavigation, trackViewBenefit } from '../analytics/intentTracking';
import { getBankAccent } from '../utils/bankColors';
import { useSEO } from '../hooks/useSEO';
import { SkeletonBusinessDetailPage } from '../components/skeletons';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import { getMerchantSeoPath, parseMerchantSeoParam } from '../seo/merchantUrls';
import { formatLocalDateOnly, isBenefitActive } from '../utils/benefits';
import { buildBenefitPath } from '../utils/benefitIdentity';
import { getBenefitProviderDisplayName, getBenefitProviderSummary } from '../utils/benefitDisplay';
import BankLogo from '../components/BankLogos/BankLogo';
import { getOptimizedImageUrl } from '../utils/images';
import { hasInAppHistory } from '../utils/navigation';
import { useToast } from '../components/ui/Toast';
import { normalizeCuando } from '../utils/benefitAvailability';

const ALL_DAYS = ['lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'sábado', 'sabado', 'domingo'];
const DAY_ABBR: Record<string, string> = {
  lunes: 'L', martes: 'M', 'miércoles': 'X', miercoles: 'X',
  jueves: 'J', viernes: 'V', 'sábado': 'S', sabado: 'S', domingo: 'D',
};
const DAY_ORDER = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAY_FULL_LABEL: Record<string, string> = {
  L: 'Lunes',
  M: 'Martes',
  X: 'Miércoles',
  J: 'Jueves',
  V: 'Viernes',
  S: 'Sábado',
  D: 'Domingo',
};
const DAY_SHORT_LABEL: Record<string, string> = {
  L: 'Lun',
  M: 'Mar',
  X: 'Mié',
  J: 'Jue',
  V: 'Vie',
  S: 'Sáb',
  D: 'Dom',
};
const DAY_TEXT_MAX_LENGTH = 24;

const formatPastValidity = (validUntil: string): string => {
  const dateOnly = validUntil.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return dateOnly ? `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}` : validUntil;
};

const isAllDays = (cuando?: string): boolean => {
  if (!cuando) return true;
  const lower = (normalizeCuando(cuando) ?? '').toLowerCase();
  const found = new Set(ALL_DAYS.filter(d => lower.includes(d)).map(d => DAY_ABBR[d]));
  return found.size >= 7;
};

const getActiveDays = (cuando?: string): Set<string> => {
  if (!cuando) return new Set(DAY_ORDER);
  const lower = (normalizeCuando(cuando) ?? '').toLowerCase();
  return new Set(ALL_DAYS.filter(d => lower.includes(d)).map(d => DAY_ABBR[d]));
};


const formatDistanceText = (business: Business): string => {
  if (business.distance === undefined || business.distance === null) {
    return business.hasOnline ? 'Online' : '';
  }
  const km = business.distance;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
};

const TODAY_ABBR = (() => {
  const names = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return DAY_ABBR[names[new Date().getDay()]] || '';
})();

const isBenefitAvailableToday = (b: BankBenefit): boolean =>
  isAllDays(b.cuando) || getActiveDays(b.cuando).has(TODAY_ABBR);

const hasPercentDiscount = (benefit: BankBenefit): boolean => {
  const discount = benefit.rewardRate.match(/(\d+)%/)?.[1];
  return !!(discount && parseInt(discount) > 0);
};

const normalizeValidityDate = (validUntil?: string | null): string => {
  if (!validUntil) return 'SIN_VIGENCIA';
  const trimmed = String(validUntil).trim();
  if (!trimmed) return 'SIN_VIGENCIA';

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? trimmed.toLowerCase() : formatLocalDateOnly(parsed);
};

const getInstallmentValiditySignature = (benefit: BankBenefit): string => {
  const orderedDays = DAY_ORDER.filter((day) => getInstallmentRowDays(benefit).has(day));
  return `${orderedDays.join(',')}::${normalizeValidityDate(benefit.validUntil)}`;
};

const getInstallmentRowDays = (benefit: BankBenefit): Set<string> => {
  if (!benefit.cuando) return new Set(DAY_ORDER);
  return isAllDays(benefit.cuando) ? new Set(DAY_ORDER) : getActiveDays(benefit.cuando);
};

const formatInstallmentDays = (days: Set<string>): string => {
  const ordered = DAY_ORDER.filter((day) => days.has(day));
  const full = ordered.map((day) => DAY_FULL_LABEL[day]).join(' ');
  if (full.length <= DAY_TEXT_MAX_LENGTH) return full;
  return ordered.map((day) => DAY_SHORT_LABEL[day]).join(' ');
};

const INITIAL_SHOW = 2;

type ViewMode = 'por-banco' | 'por-beneficio' | 'sucursal';

// Address-only locations arrive without lat/lng (undefined), and 0,0 is a placeholder.
const hasValidCoordinates = (loc: { lat?: number; lng?: number }): loc is { lat: number; lng: number } =>
  Number.isFinite(loc.lat) && Number.isFinite(loc.lng) && !(loc.lat === 0 && loc.lng === 0);

const getDirectionsUrl = (lat: number, lng: number): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;


function BusinessDetailPage() {
  const { id, slugId } = useParams<{ id?: string; slugId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const passedBusiness = (location.state as { business?: Business } | null)?.business;
  const parsedSeoParam = parseMerchantSeoParam(slugId);
  const routeMerchantId = parsedSeoParam?.merchantId || id || '';
  const routePassedBusiness = passedBusiness && (!routeMerchantId || passedBusiness.id === routeMerchantId)
    ? passedBusiness
    : null;
  const [business, setBusiness] = useState<Business | null>(routePassedBusiness || null);
  const [loading, setLoading] = useState(!routePassedBusiness);
  const [error, setError] = useState<string | null>(null);
  const businessViewSignatureRef = useRef('');
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const businessCategory = business?.category?.toLowerCase() || 'comercios';
  const routePath = slugId && parsedSeoParam
    ? `/comercios/${slugId}`
    : routeMerchantId
      ? `/business/${routeMerchantId}`
      : '/business';
  const canonicalBusinessPath = business ? getMerchantSeoPath({ id: business.id, name: business.name }) : routePath;

  const [viewMode, setViewMode] = useState<ViewMode>('por-banco');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [filterToday, setFilterToday] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isAuthenticated } = useAuth();
  const showToast = useToast();

  const sortedBenefits = useMemo(() => {
    if (!business) return [];
    return [...business.benefits].sort((a, b) => {
      const dA = parseInt(a.rewardRate.match(/(\d+)%/)?.[1] || '0');
      const dB = parseInt(b.rewardRate.match(/(\d+)%/)?.[1] || '0');
      if (dB !== dA) return dB - dA;
      return (b.installments || 0) - (a.installments || 0);
    });
  }, [business]);

  const { activeBenefits, pastBenefits } = useMemo(() => {
    const now = new Date();
    return sortedBenefits.reduce(
      (groups, benefit) => {
        if (isBenefitActive(benefit, now)) {
          groups.activeBenefits.push(benefit);
        } else {
          groups.pastBenefits.push(benefit);
        }
        return groups;
      },
      {
        activeBenefits: [] as BankBenefit[],
        pastBenefits: [] as BankBenefit[],
      },
    );
  }, [sortedBenefits]);

  const activeBenefitCount = activeBenefits.length;
  const pastBenefitCount = pastBenefits.length;

  const topInstallmentGroupsByBank = useMemo(() => {
    const byBank = new Map<string, BankBenefit[]>();

    activeBenefits.forEach((benefit) => {
      const count = benefit.installments || 0;
      if (count <= 0 || hasPercentDiscount(benefit)) return;

      const bank = getBenefitProviderDisplayName(benefit);
      if (!byBank.has(bank)) byBank.set(bank, []);
      byBank.get(bank)!.push(benefit);
    });

    return [...byBank.entries()]
      .sort((left, right) => left[0].localeCompare(right[0]))
      .flatMap(([bankName, benefits]) => {
        const orderedByInstallments = [...benefits].sort((a, b) => (b.installments || 0) - (a.installments || 0));
        const maxInstallments = orderedByInstallments[0]?.installments || 0;
        if (maxInstallments <= 0) return [];

        const topBenefits = orderedByInstallments.filter((benefit) => (benefit.installments || 0) === maxInstallments);
        const topSignatures = new Set(topBenefits.map((benefit) => getInstallmentValiditySignature(benefit)));

        const selectedBenefits = [...topBenefits];
        orderedByInstallments.forEach((benefit) => {
          const count = benefit.installments || 0;
          if (count === maxInstallments) return;
          const signature = getInstallmentValiditySignature(benefit);
          if (topSignatures.has(signature)) return;
          selectedBenefits.push(benefit);
        });

        return selectedBenefits.map((benefit) => ({
          bankName,
          count: benefit.installments || 0,
          benefits: [benefit],
        }));
      })
      .sort((left, right) => right.count - left.count || left.bankName.localeCompare(right.bankName));
  }, [activeBenefits]);

  const topInstallmentGroupsByAmount = useMemo(() => {
    const byAmount = new Map<number, { count: number; benefits: BankBenefit[] }>();

    topInstallmentGroupsByBank.forEach(({ count, benefits }) => {
      const current = byAmount.get(count);
      if (!current) {
        byAmount.set(count, { count, benefits: [...benefits] });
        return;
      }

      current.benefits.push(...benefits);
    });

    return [...byAmount.entries()]
      .sort((left, right) => right[0] - left[0])
      .map(([count, entry]) => ({ count, benefits: entry.benefits }));
  }, [topInstallmentGroupsByBank]);

  useSEO({
    title: business
      ? `${business.name}: descuentos y beneficios bancarios | Blink`
      : 'Beneficios por comercio | Blink',
    description: business
      ? activeBenefitCount > 0
        ? `${activeBenefitCount} beneficios activos en ${business.name} para ${businessCategory} en Argentina.`
        : `Consulta beneficios anteriores de ${business.name} para ${businessCategory} en Argentina.`
      : 'Consulta descuentos, topes y condiciones por comercio en Blink.',
    path: canonicalBusinessPath,
    type: 'article',
    structuredData: business
      ? {
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: business.name,
          image: business.image || undefined,
          address: business.location[0]?.formattedAddress
            ? {
                '@type': 'PostalAddress',
                streetAddress: business.location[0].formattedAddress,
                addressCountry: 'AR',
              }
            : undefined,
        }
      : undefined,
  });

  useEffect(() => {
    if (routePassedBusiness) {
      setBusiness(routePassedBusiness);
      setError(null);
      setLoading(false);
    }

    let cancelled = false;

    const load = async () => {
      if (!routeMerchantId) {
        setBusiness(null);
        setError('Comercio no encontrado');
        setLoading(false);
        return;
      }

      try {
        setLoading(!routePassedBusiness);
        setError(null);
        if (!routePassedBusiness) {
          setBusiness(null);
        }

        const resolvedBusiness = await fetchBusinessById(routeMerchantId, { includeExpired: true });
        if (cancelled) return;

        if (resolvedBusiness) {
          setBusiness(resolvedBusiness);
        } else if (!routePassedBusiness) {
          setError('Comercio no encontrado');
        }
      } catch {
        if (cancelled) return;
        if (!routePassedBusiness) {
          setBusiness(null);
          setError('Error al cargar');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [routeMerchantId, routePassedBusiness]);

  useEffect(() => {
    if (!business) return;

    const canonicalPath = getMerchantSeoPath({ id: business.id, name: business.name });
    if (location.pathname === canonicalPath) return;

    navigate(canonicalPath, { replace: true, state: { business } });
  }, [business, location.pathname, navigate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      isScrollingRef.current = true;
      clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => { isScrollingRef.current = false; }, 300);
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      clearTimeout(scrollTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!business) return;
    const signature = `${business.id}|business_detail`;
    if (businessViewSignatureRef.current === signature) return;
    businessViewSignatureRef.current = signature;
    trackSelectBusiness({ source: 'business_detail_page', businessId: business.id, category: business.category });
  }, [business]);

  const groupedBenefits = useMemo(() => {
    return activeBenefits
      .filter((b) => {
        const discount = parseInt(b.rewardRate.match(/(\d+)%/)?.[1] || '0');
        return !((b.installments ?? 0) > 0 && discount === 0);
      })
      .reduce((acc, benefit) => {
        const bank = getBenefitProviderDisplayName(benefit);
        if (!acc[bank]) acc[bank] = [];
        acc[bank].push(benefit);
        return acc;
      }, {} as Record<string, BankBenefit[]>);
  }, [activeBenefits]);

  const filteredGroupedBenefits = useMemo(() => {
    if (!filterToday) return groupedBenefits;
    const result: Record<string, BankBenefit[]> = {};
    for (const [bank, benefits] of Object.entries(groupedBenefits)) {
      const filtered = benefits.filter(isBenefitAvailableToday);
      if (filtered.length > 0) result[bank] = filtered;
    }
    return result;
  }, [groupedBenefits, filterToday]);

  const filteredSortedBenefits = useMemo(
    () => filterToday ? activeBenefits.filter(isBenefitAvailableToday) : activeBenefits,
    [activeBenefits, filterToday],
  );


  const handleBenefitSelect = (selectedBenefit: BankBenefit, position: number) => {
    if (!business || isScrollingRef.current) return;
    const selectedIndex = business.benefits.indexOf(selectedBenefit);
    if (selectedIndex < 0) return;
    trackViewBenefit({ source: 'business_detail_benefit_list', benefitId: `${business.id}:${selectedIndex}`, businessId: business.id, category: business.category, position });
    navigate(buildBenefitPath(business.id, selectedBenefit, selectedIndex), { state: { business } });
  };

  const handleBack = () => {
    // Direct/deep link (e.g. coming up from a shared benefit URL): go to the
    // search page instead of leaving the app.
    if (hasInAppHistory()) navigate(-1);
    else navigate('/search', { replace: true });
  };

  const handleOpenMap = () => {
    if (!business) return;
    trackStartNavigation({ source: 'business_detail_page', destinationBusinessId: business.id, provider: 'in_app_map' });
    navigate(`/map?business=${business.id}`);
  };

  const toggleGroup = (bankName: string) => {
    if (isScrollingRef.current) return;
    setExpandedGroups(prev => ({ ...prev, [bankName]: !prev[bankName] }));
  };

  if (loading) return <SkeletonBusinessDetailPage />;

  if (error || !business) {
    return (
      <div className="min-h-screen bg-blink-bg flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-16 h-16 rounded-2xl bg-blink-border flex items-center justify-center">
          <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 32 }}>storefront_off</span>
        </div>
        <p className="font-semibold text-blink-ink">{error || 'No encontrado'}</p>
        <button onClick={handleBack} className="text-primary font-medium text-sm">← Volver</button>
      </div>
    );
  }

  const distanceText = formatDistanceText(business);
  // Explicit 0,0 entries are placeholders ("Multiple locations"), not branches.
  const branchLocations = business.location.filter((loc) => !(loc.lat === 0 && loc.lng === 0));
  const branchCount = branchLocations.length;
  const branchLabel = branchCount > 1 ? `${branchCount} sucursales` : branchCount === 1 ? '1 sucursal' : '';

  return (
    <div className="flex h-[100dvh] flex-col bg-blink-bg font-body text-blink-ink lg:h-auto lg:min-h-[calc(100dvh-64px)]">
      <div className="flex min-h-0 flex-1 flex-col lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:py-8">

      {/* ── Header ── */}
      <header className="flex-shrink-0 bg-white lg:sticky lg:top-24 lg:self-start lg:overflow-hidden lg:rounded-2xl lg:border lg:border-blink-border lg:shadow-soft" style={{ borderBottom: '1px solid #E8E6E1' }}>

        {/* Top row */}
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={handleBack}
            aria-label="Volver"
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-blink-ink" style={{ fontSize: 22 }}>arrow_back</span>
          </button>

          <div
            className="flex-shrink-0 w-[64px] h-[64px] rounded-2xl bg-white flex items-center justify-center overflow-hidden"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.10)', border: '1px solid #E8E6E1' }}
          >
            {business.image ? (
              <img alt={business.name} className="w-full h-full object-cover" src={getOptimizedImageUrl(business.image, { width: 160 })} decoding="async" referrerPolicy="no-referrer" />
            ) : (
              <span className="font-black text-2xl text-blink-muted">{business.name?.charAt(0)}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-[17px] text-blink-ink leading-tight truncate">{business.name}</h1>
            <p className="text-xs text-blink-muted mt-0.5">
              <span className="capitalize">{business.category || 'Comercio'}</span>
              {(distanceText || branchLabel) && ` · ${[distanceText, branchLabel].filter(Boolean).join(' · ')}`}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeBenefitCount > 0 ? 'bg-green-500' : 'bg-amber-500'}`} />
              <span className="text-xs font-medium text-blink-muted">
                {activeBenefitCount > 0
                  ? `${activeBenefitCount} beneficio${activeBenefitCount !== 1 ? 's' : ''} activo${activeBenefitCount !== 1 ? 's' : ''}`
                  : 'Sin beneficios activos'}
              </span>
            </div>
          </div>

          <button
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors"
            onClick={() => {
              if (!isAuthenticated) {
                showToast('Iniciá sesión para guardar comercios', { icon: 'login' });
                navigate('/login');
                return;
              }
              const wasFavorite = isFavorite(business.id);
              toggleFavorite(business);
              showToast(wasFavorite ? 'Quitado de guardados' : 'Comercio guardado', {
                icon: wasFavorite ? 'heart_minus' : 'favorite',
              });
            }}
            aria-label={
              !isAuthenticated
                ? 'Iniciá sesión para guardar'
                : isFavorite(business.id)
                  ? 'Quitar de guardados'
                  : 'Guardar'
            }
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 24,
                color: isFavorite(business.id) ? '#ef4444' : '#9ca3af',
                fontVariationSettings: isFavorite(business.id) ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              favorite
            </span>
          </button>

        </div>

        {/* View tabs + "Hoy" filter */}
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderTop: '1px solid #E8E6E1' }}>
          <div role="tablist" aria-label="Ver beneficios" className="flex flex-1 rounded-xl bg-blink-bg p-1">
            {([
              // Short labels so the tabs and the "Hoy" toggle fit a 360px-wide screen.
              { id: 'por-banco', label: 'Bancos' },
              { id: 'por-beneficio', label: 'Descuento' },
              { id: 'sucursal', label: 'Sucursales' },
            ] as { id: ViewMode; label: string }[]).map((tab) => {
              const selected = viewMode === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setViewMode(tab.id)}
                  className={`h-8 flex-1 whitespace-nowrap rounded-lg px-2 text-[13px] font-semibold transition-all ${
                    selected ? 'bg-white text-blink-ink shadow-soft' : 'text-blink-muted'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          {viewMode !== 'sucursal' && (
            <button
              onClick={() => setFilterToday(f => !f)}
              aria-pressed={filterToday}
              className={`flex h-10 shrink-0 items-center gap-1 rounded-xl px-3 text-sm font-medium transition-all duration-150 active:scale-95 ${
                filterToday
                  ? 'bg-primary text-white'
                  : 'bg-white border border-blink-border text-blink-ink'
              }`}
            >
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>today</span>
              Hoy
            </button>
          )}
        </div>
      </header>

{/* ── Content ── */}
      <main
        ref={containerRef}
        className="flex-1 overflow-y-auto pb-4 lg:min-w-0 lg:overflow-visible lg:pb-0"
        style={{ overscrollBehavior: 'contain' }}
      >

        {/* Grouped by bank — default view */}
        {viewMode === 'por-banco' && (
          <div className="space-y-3 pt-3 px-4">

            {Object.entries(filteredGroupedBenefits).map(([bankName, bankBenefits]) => {
              const accent = getBankAccent(bankName);
              const expanded = expandedGroups[bankName];
              const visible = expanded ? bankBenefits : bankBenefits.slice(0, INITIAL_SHOW);
              const hiddenCount = bankBenefits.length - INITIAL_SHOW;

              return (
                <div
                  key={bankName}
                  className="bg-white rounded-2xl overflow-hidden"
                  style={{ border: '1px solid #E8E6E1', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                >
                  {/* Bank section header */}
                  <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: accent.bg }}>
                    <BankLogo bankName={bankName} size={28} />
                    <span className="font-bold text-[13px] tracking-wide uppercase" style={{ color: accent.text }}>
                      {bankName}
                    </span>
                  </div>

                  {/* Benefit rows */}
                  {visible.map((benefit, i) => {
                    const discount = benefit.rewardRate.match(/(\d+)%/)?.[1];
                    const hasDiscount = !!(discount && parseInt(discount) > 0);
                    const hasInstallments = !hasDiscount && (benefit.installments ?? 0) > 0;
                    const allDays = isAllDays(benefit.cuando);
                    const activeDays = !allDays ? getActiveDays(benefit.cuando) : new Set<string>();
                    const benefitIdx = business.benefits.indexOf(benefit);
                    const providerSummary = getBenefitProviderSummary(benefit);
                    const minPurchase = benefit.minimumPurchaseAmount?.amount ?? null;

                    return (
                      <div
                        key={`${bankName}-${i}`}
                        onClick={() => { if (benefitIdx >= 0) handleBenefitSelect(benefit, benefitIdx + 1); }}
                        className="px-4 py-4 cursor-pointer active:bg-gray-50 transition-colors"
                        style={{ borderTop: '1px solid #E8E6E1' }}
                      >
                        <div className="flex items-start gap-2">

                          {/* Left content */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[15px] text-blink-ink leading-tight mb-1">
                              {benefit.benefit || benefit.cardName}
                            </p>

                            {benefit.cardName && (
                              <p className="text-xs text-blink-muted mb-2">{benefit.cardName}</p>
                            )}

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <BankLogo bankName={bankName} size={18} />

                              {providerSummary && (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border"
                                  style={{ background: 'transparent', borderColor: accent.border, color: accent.text }}
                                >
                                  {providerSummary}
                                </span>
                              )}

                              {allDays ? (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide"
                                  style={{ border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#047857' }}
                                >
                                  Todos los días
                                </span>
                              ) : activeDays.size > 0 ? (
                                <div className="flex gap-0.5">
                                  <span className="sr-only">
                                    {`Días: ${DAY_ORDER.filter((d) => activeDays.has(d)).map((d) => DAY_FULL_LABEL[d]).join(', ')}`}
                                  </span>
                                  {DAY_ORDER.map(d => (
                                    <span
                                      key={d}
                                      aria-hidden="true"
                                      title={DAY_FULL_LABEL[d]}
                                      className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
                                      style={
                                        activeDays.has(d)
                                          ? { background: accent.text, color: '#fff' }
                                          : { background: '#F3F4F6', color: '#9CA3AF' }
                                      }
                                    >
                                      {d}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>

                          {/* Right content */}
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <div className="text-right">
                              {hasDiscount ? (
                                <>
                                  <p className="font-black text-[26px] leading-tight text-blink-ink">{discount}%</p>
                                  <p className="text-[11px] text-blink-muted -mt-0.5">de ahorro</p>
                                  {benefit.tope && !String(benefit.tope).toUpperCase().includes('SIN TOPE') && (
                                    <p className="text-[10px] text-blink-muted mt-0.5 leading-tight">
                                      Tope: {benefit.tope}
                                    </p>
                                  )}
                                </>
                              ) : hasInstallments ? (
                                <>
                                  <p className="font-black text-[22px] leading-tight text-blink-ink">{benefit.installments}</p>
                                  <p className="text-[11px] text-primary font-semibold -mt-0.5">cuotas sin int.</p>
                                </>
                              ) : (
                                <p className="text-xs font-medium text-blink-muted max-w-[80px] text-right leading-tight">
                                  {benefit.rewardRate}
                                </p>
                              )}
                              {minPurchase !== null && (
                                <p className="text-[10px] text-blink-muted mt-0.5 leading-tight">
                                  Mín: ${minPurchase.toLocaleString('es-AR')}
                                </p>
                              )}
                            </div>
                            <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 18 }}>chevron_right</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Expand button */}
                  {!expanded && hiddenCount > 0 && (
                    <button
                      onClick={() => toggleGroup(bankName)}
                      className="w-full py-3 text-sm font-semibold flex items-center justify-center gap-1"
                      style={{ color: '#4338CA', borderTop: '1px solid #E8E6E1' }}
                    >
                      Ver otros {hiddenCount} beneficio{hiddenCount !== 1 ? 's' : ''} ↓
                    </button>
                  )}
                </div>
              );
            })}

            {/* Installment group — one card, one row per tier */}
            {!!topInstallmentGroupsByAmount.length && !filterToday && (
              <div
                className="bg-white rounded-2xl overflow-hidden"
                style={{ border: '1px solid #E8E6E1', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
              >
                <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: '#EEF2FF' }}>
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                    style={{ background: '#4338CA' }}
                  >
                    CI
                  </div>
                  <span className="font-bold text-[13px] tracking-wide uppercase" style={{ color: '#4338CA' }}>
                    Cuotas sin interés
                  </span>
                </div>

                {topInstallmentGroupsByAmount.map(({ count, benefits }) => {
                  return (
                    <div
                      key={`tier-${count}`}
                      className="px-4 py-4"
                      style={{ borderTop: '1px solid #E8E6E1' }}
                    >
                      <p className="font-bold text-[15px] text-blink-ink leading-tight mb-2.5">
                        hasta {count} cuotas sin interés
                      </p>
                      <div className="flex flex-col gap-2">
                        {benefits.map((benefit, i) => {
                          const benefitIdx = business.benefits.indexOf(benefit);
                          const daySet = getInstallmentRowDays(benefit);
                          const allDays = isAllDays(benefit.cuando);
                          const providerName = getBenefitProviderDisplayName(benefit);
                          const providerSummary = getBenefitProviderSummary(benefit);

                          return (
                            <button
                              key={`tier-${count}-bank-${i}`}
                              onClick={() => { if (benefitIdx >= 0) handleBenefitSelect(benefit, benefitIdx + 1); }}
                              className="rounded-lg border border-[#E8E6E1] bg-white px-2.5 py-2 text-left transition-all"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="min-w-0 flex items-center gap-2 flex-wrap">
                                    <BankLogo bankName={providerName} size={20} />
                                    {providerSummary && (
                                      <span
                                        className="text-[11px] font-bold px-1.5 py-0.5 rounded-md border"
                                        style={{ background: 'transparent', borderColor: getBankAccent(providerName).border, color: getBankAccent(providerName).text }}
                                      >
                                        {providerSummary}
                                      </span>
                                    )}
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {allDays ? (
                                        <span className="text-[10px] font-bold text-blink-positive">
                                          Todos los días
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-blink-muted">
                                          {formatInstallmentDays(daySet)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span
                                    className="px-2 py-0.5 rounded-md border border-[#C7D2FE] text-[10px] font-bold text-[#4338CA] flex-shrink-0"
                                  >
                                    Ver
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Por beneficio — flat sorted list */}
        {viewMode === 'por-beneficio' && (
          <div className="space-y-2 pt-3 px-4">
            {filteredSortedBenefits.map((benefit, idx) => {
              const discount = benefit.rewardRate.match(/(\d+)%/)?.[1];
              const hasDiscount = !!(discount && parseInt(discount) > 0);
              const hasInstallments = !hasDiscount && (benefit.installments ?? 0) > 0;
              const providerName = getBenefitProviderDisplayName(benefit);
              const providerSummary = getBenefitProviderSummary(benefit);
              const accent = getBankAccent(providerName);
              const benefitIdx = business.benefits.indexOf(benefit);

              return (
                <div
                  key={`flat-${idx}`}
                  onClick={() => { if (benefitIdx >= 0) handleBenefitSelect(benefit, idx + 1); }}
                  className="bg-white rounded-xl px-4 py-3.5 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
                  style={{ border: '1px solid #E8E6E1', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BankLogo bankName={providerName} size={24} />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-blink-ink leading-tight truncate">
                        {benefit.benefit || benefit.cardName}
                      </p>
                      {providerSummary && (
                        <span
                          className="inline-block text-[11px] font-bold px-1.5 py-0.5 rounded-md border mt-1"
                          style={{ background: 'transparent', borderColor: accent.border, color: accent.text }}
                        >
                          {providerSummary}
                        </span>
                      )}
                      {benefit.tope && !String(benefit.tope).toUpperCase().includes('SIN TOPE') && (
                        <p className="text-[10px] text-blink-muted mt-0.5">{benefit.tope}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
                    <div className="text-right">
                      {hasDiscount ? (
                        <p className="font-bold text-base text-blink-ink">{discount}%</p>
                      ) : hasInstallments ? (
                        <p className="font-bold text-sm text-primary">{benefit.installments} cuotas</p>
                      ) : (
                        <p className="text-xs text-blink-muted">{benefit.rewardRate}</p>
                      )}
                    </div>
                    <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 16 }}>chevron_right</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode !== 'sucursal' && activeBenefitCount === 0 && pastBenefitCount > 0 && (
          <section
            className="mx-4 mt-3 bg-white rounded-2xl p-4"
            style={{ border: '1px solid #E8E6E1', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
          >
            <p className="text-sm font-semibold text-blink-ink">No hay descuentos activos ahora</p>
            <p className="text-xs text-blink-muted mt-1">
              Igual puedes revisar promociones anteriores de {business.name}.
            </p>
          </section>
        )}

        {viewMode !== 'sucursal' && pastBenefits.length > 0 && (
          <section className="space-y-2 pt-3 px-4">
            <h2 className="font-semibold text-base text-gray-400">Beneficios anteriores</h2>
            {pastBenefits.map((benefit, idx) => {
              const discount = benefit.rewardRate.match(/(\d+)%/)?.[1];
              const hasDiscount = !!(discount && parseInt(discount) > 0);
              const hasInstallments = !hasDiscount && (benefit.installments ?? 0) > 0;
              const benefitIdx = business.benefits.indexOf(benefit);
              const providerName = getBenefitProviderDisplayName(benefit);
              const providerSummary = getBenefitProviderSummary(benefit);

              return (
                <div
                  key={`past-${benefit.bankName}-${idx}`}
                  onClick={() => { if (benefitIdx >= 0) handleBenefitSelect(benefit, activeBenefitCount + idx + 1); }}
                  className="bg-gray-50 rounded-xl px-4 py-3.5 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
                  style={{ border: '1px solid #E8E6E1', filter: 'grayscale(0.6)', opacity: 0.7 }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BankLogo bankName={providerName} size={24} />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-500 leading-tight truncate">
                        {benefit.benefit || benefit.cardName}
                      </p>
                      {providerSummary && (
                        <span className="inline-block text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-400 border border-gray-200 mt-1">
                          {providerSummary}
                        </span>
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {benefit.validUntil ? `Venció el ${formatPastValidity(benefit.validUntil)}` : 'Promoción anterior'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
                    <div className="text-right">
                      {hasDiscount ? (
                        <p className="font-bold text-base text-gray-400">{discount}%</p>
                      ) : hasInstallments ? (
                        <p className="font-bold text-sm text-gray-400">{benefit.installments} cuotas</p>
                      ) : (
                        <p className="text-xs text-gray-400">{benefit.rewardRate}</p>
                      )}
                    </div>
                    <span className="material-symbols-outlined text-gray-400" style={{ fontSize: 16 }}>chevron_right</span>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Sucursales — list with directions, plus the map */}
        {viewMode === 'sucursal' && (
          <div className="space-y-3 px-4 pt-3">
            {branchCount === 0 ? (
              <p className="rounded-2xl border border-blink-border bg-white px-4 py-6 text-center text-sm text-blink-muted">
                {business.hasOnline ? 'Este comercio opera online: no tiene sucursales físicas cargadas.' : 'No tenemos sucursales cargadas para este comercio.'}
              </p>
            ) : (
              <>
                {branchLocations.some(hasValidCoordinates) && (
                  <button
                    onClick={handleOpenMap}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white transition-all active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
                  >
                    <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 18 }}>map</span>
                    Ver todas en el mapa
                  </button>
                )}
                <ul className="divide-y divide-blink-border overflow-hidden rounded-2xl border border-blink-border bg-white">
                  {branchLocations.map((loc, index) => {
                    const street = loc.addressComponents?.route
                      ? `${loc.addressComponents.route}${loc.addressComponents.streetNumber ? ` ${loc.addressComponents.streetNumber}` : ''}`
                      : loc.name || loc.formattedAddress?.split(',')[0] || 'Dirección no disponible';
                    const city = loc.addressComponents
                      ? [loc.addressComponents.locality, loc.addressComponents.adminAreaLevel1].filter(Boolean).join(', ')
                      : loc.formattedAddress ?? '';
                    const hasCoords = hasValidCoordinates(loc);
                    const content = (
                      <>
                        <span className="material-symbols-outlined mt-0.5 shrink-0 text-blink-muted" aria-hidden="true" style={{ fontSize: 18 }}>location_on</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium leading-tight text-blink-ink">{street}</span>
                          {city && city !== street && <span className="mt-0.5 block text-xs text-blink-muted">{city}</span>}
                        </span>
                        {hasCoords && (
                          <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-primary">
                            Cómo llegar
                            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 15 }}>directions</span>
                          </span>
                        )}
                      </>
                    );
                    return (
                      <li key={`${street}-${index}`}>
                        {hasCoords ? (
                          <a
                            href={getDirectionsUrl(loc.lat, loc.lng)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Cómo llegar a ${street}`}
                            className="flex items-start gap-3 px-4 py-3 active:bg-gray-50"
                          >
                            {content}
                          </a>
                        ) : (
                          <div className="flex items-start gap-3 px-4 py-3">{content}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        )}

      </main>
      </div>
    </div>
  );
}

export default BusinessDetailPage;
