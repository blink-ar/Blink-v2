import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Business, BankBenefit } from '../types';
import { fetchBusinessById, fetchBusinessesPaginated } from '../services/api';
import SavingsSimulator from '../components/neo/SavingsSimulator';
import InstallmentSimulator from '../components/neo/InstallmentSimulator';
import { SkeletonBenefitDetailPage } from '../components/skeletons';
import { parseDayAvailability } from '../utils/dayAvailabilityParser';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useSEO } from '../hooks/useSEO';
import {
  trackSaveBenefit,
  trackShareBenefit,
  trackStartNavigation,
  trackUnsaveBenefit,
  trackViewBenefit,
} from '../analytics/intentTracking';
import { getBankAccent } from '../utils/bankColors';
import BankLogo from '../components/BankLogos/BankLogo';
import { useGeolocation } from '../hooks/useGeolocation';
import { useResponsive } from '../hooks/useResponsive';
import { calculateDistance } from '../utils/distance';
import {
  buildBenefitPath,
  decodeBenefitRouteRef,
  getBenefitRouteRef,
  getStableBenefitId,
  isLegacyBenefitIndexRef,
} from '../utils/benefitIdentity';
import {
  getBenefitEligibleBankPreview,
  getBenefitProviderDisplayName,
  getBenefitProviderSummary,
  hasMultipleBenefitProviders,
  getBenefitEligibilityBankNames,
  isModoSourcedBenefit,
} from '../utils/benefitDisplay';
import { getOptimizedImageUrl } from '../utils/images';

const BENEFIT_DAYS = [
  { key: 'monday' as const, abbr: 'L' },
  { key: 'tuesday' as const, abbr: 'M' },
  { key: 'wednesday' as const, abbr: 'M' },
  { key: 'thursday' as const, abbr: 'J' },
  { key: 'friday' as const, abbr: 'V' },
  { key: 'saturday' as const, abbr: 'S' },
  { key: 'sunday' as const, abbr: 'D' },
];

const SAVED_BENEFITS_STORAGE_KEY = 'blink.savedBenefits';
const LOCATIONS_PREVIEW_COUNT = 4;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const formatLocalDateOnly = (date: Date): string => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');

const isBenefitActive = (validUntil: string | null | undefined, now = new Date()): boolean => {
  const v = validUntil?.trim();
  if (!v) return true;
  if (DATE_ONLY_PATTERN.test(v)) return v >= formatLocalDateOnly(now);
  const t = Date.parse(v);
  return Number.isFinite(t) && t >= now.getTime();
};

const parseBenefitIndex = (benefitIndex?: string): number => {
  const parsedIndex = benefitIndex !== undefined ? Number.parseInt(benefitIndex, 10) : 0;
  return Number.isNaN(parsedIndex) ? 0 : Math.max(0, parsedIndex);
};

const resolveBenefitSelection = (
  business: Business,
  benefitRef?: string
): { benefit: BankBenefit | null; position: number } => {
  const decodedRef = decodeBenefitRouteRef(benefitRef);

  if (decodedRef) {
    const idPosition = business.benefits.findIndex((candidate) => getStableBenefitId(candidate) === decodedRef);
    if (idPosition >= 0) {
      return {
        benefit: business.benefits[idPosition],
        position: idPosition
      };
    }

    if (!isLegacyBenefitIndexRef(decodedRef)) {
      return {
        benefit: null,
        position: 0
      };
    }
  }

  const safeIndex = parseBenefitIndex(decodedRef);
  const position = business.benefits[safeIndex] ? safeIndex : 0;

  return {
    benefit: business.benefits[position] || business.benefits[0] || null,
    position
  };
};

const fetchBusinessForRouteId = async (routeId: string): Promise<Business | null> => {
  try {
    const exactBusiness = await fetchBusinessById(routeId, { includeExpired: true });
    if (exactBusiness) return exactBusiness;
  } catch (error) {
    console.error('[BenefitDetailPage] exact merchant lookup failed:', error);
  }

  const searchName = routeId.replace(/-/g, ' ');
  const response = await fetchBusinessesPaginated({ search: searchName, limit: 1, includeExpired: true });

  if (Array.isArray(response)) {
    return response[0] || null;
  }

  return response.success && response.businesses.length > 0
    ? response.businesses[0]
    : null;
};

// Extract numeric amount from Argentine peso strings like "$25.000" or "25000"
const parseTopeAmount = (tope: unknown): number | null => {
  if (tope == null) return null;
  const s = String(tope).trim();
  if (!s || /sin tope|sin l[ií]mite/i.test(s)) return null;
  // Argentine format: "." = thousands separator, "," = decimal
  const cleaned = s.replace(/[$\s]/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

const formatArgentinePeso = (amount: number): string =>
  '$' + Math.round(amount).toLocaleString('es-AR');

const getBenefitTrackingId = (business: Business, benefit: BankBenefit, position: number): string => {
  return `${business.id}:${getBenefitRouteRef(benefit, position)}`;
};

const getLegacyBenefitTrackingId = (business: Business, position: number): string => {
  return `${business.id}:${position}`;
};

const getPaymentMethod = (benefit: BankBenefit): string | null => {
  const tipo = (benefit.tipo || '').toLowerCase();
  if (/cr[eé]d/i.test(tipo)) return 'Tarjeta de Crédito';
  if (/d[eé]b/i.test(tipo)) return 'Tarjeta de Débito';
  const allCards = [...(benefit.cardTypes || []), benefit.cardName || ''].join(' ');
  if (/cr[eé]d/i.test(allCards)) return 'Tarjeta de Crédito';
  if (/d[eé]b/i.test(allCards)) return 'Tarjeta de Débito';
  return null;
};

const isModoBenefit = (benefit: BankBenefit): boolean =>
  isModoSourcedBenefit(benefit) || benefit.acceptsModo === true;

const isPremiumCard = (cardName: string): boolean =>
  /signature|black|infinite|platinum|select|gold/i.test(cardName);

const detectCardNetwork = (cardName: string): string | null => {
  if (/visa/i.test(cardName)) return 'VISA';
  if (/master/i.test(cardName)) return 'MC';
  if (/amex|american/i.test(cardName)) return 'AMEX';
  if (/naranja/i.test(cardName)) return 'NX';
  if (/cabal/i.test(cardName)) return 'CABAL';
  return null;
};

function BenefitDetailPage() {
  const { id, benefitIndex } = useParams<{ id: string; benefitIndex?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDesktop } = useResponsive();
  const passedBusiness = (location.state as { business?: Business } | null)?.business;
  const [business, setBusiness] = useState<Business | null>(passedBusiness || null);
  const [benefit, setBenefit] = useState<BankBenefit | null>(null);
  const [loading, setLoading] = useState(!passedBusiness);
  const [error, setError] = useState<string | null>(null);
  const [benefitPosition, setBenefitPosition] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const { position: userPosition } = useGeolocation();
  const [showTerms, setShowTerms] = useState(false);
  const [showAllEligibleBanks, setShowAllEligibleBanks] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const viewedBenefitSignatureRef = useRef('');
  const { getSubscriptionName, getSubscriptionById } = useSubscriptions();
  const benefitPath = id
    ? `/benefit/${encodeURIComponent(id)}/${encodeURIComponent(decodeBenefitRouteRef(benefitIndex) ?? '0')}`
    : '/benefit';
  const benefitDiscount = benefit?.rewardRate.match(/(\d+)%/)?.[1];
  const benefitProviderName = benefit ? getBenefitProviderDisplayName(benefit) : null;

  useSEO({
    title: business && benefit
      ? `${business.name}: ${benefit.benefit} | Blink`
      : 'Detalle de beneficio bancario | Blink',
    description: business && benefit
      ? `${benefitDiscount ? `${benefitDiscount}% de ahorro` : 'Beneficio bancario'} en ${business.name}. Revisa vigencia, condiciones y sucursales adheridas.`
      : 'Revisa condiciones, vigencia y ubicaciones de cada beneficio bancario.',
    path: business && benefit ? buildBenefitPath(business.id, benefit, benefitPosition) : benefitPath,
    type: 'article',
    structuredData: business && benefit
      ? {
          '@context': 'https://schema.org',
          '@type': 'Offer',
          name: `${benefit.benefit} en ${business.name}`,
          description: benefit.description || undefined,
          category: business.category || undefined,
          seller: {
            '@type': 'Organization',
            name: benefitProviderName || benefit.bankName,
          },
        }
      : undefined,
  });

  useEffect(() => {
    if (passedBusiness) {
      const selection = resolveBenefitSelection(passedBusiness, benefitIndex);
      setBusiness(passedBusiness);
      setBenefitPosition(selection.position);
      setBenefit(selection.benefit);
      setError(selection.benefit ? null : 'Beneficio no encontrado');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      if (!id) {
        setBusiness(null);
        setBenefit(null);
        setError('Beneficio no encontrado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const resolvedBusiness = await fetchBusinessForRouteId(id);
        if (cancelled) return;

        if (resolvedBusiness) {
          const selection = resolveBenefitSelection(resolvedBusiness, benefitIndex);
          setBusiness(resolvedBusiness);
          setBenefitPosition(selection.position);
          setBenefit(selection.benefit);
          setError(selection.benefit ? null : 'Beneficio no encontrado');
        } else {
          setBusiness(null);
          setBenefit(null);
          setError('Beneficio no encontrado');
        }
      } catch {
        if (cancelled) return;
        setBusiness(null);
        setBenefit(null);
        setError('Error al cargar');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id, benefitIndex, passedBusiness]);

  useEffect(() => {
    if (!business || !benefit || !getStableBenefitId(benefit)) return;

    const stablePath = buildBenefitPath(business.id, benefit, benefitPosition);
    const stableRef = getBenefitRouteRef(benefit, benefitPosition);
    const currentRef = decodeBenefitRouteRef(benefitIndex);

    if (currentRef === stableRef) return;

    navigate(`${stablePath}${location.search || ''}`, {
      replace: true,
      state: location.state,
    });
  }, [benefit, benefitIndex, benefitPosition, business, location.search, location.state, navigate]);

  useEffect(() => {
    if (!business || !benefit) return;
    const benefitId = getBenefitTrackingId(business, benefit, benefitPosition);
    const signature = `${benefitId}|detail`;
    if (viewedBenefitSignatureRef.current === signature) return;
    viewedBenefitSignatureRef.current = signature;
    trackViewBenefit({ source: 'benefit_detail_page', benefitId, businessId: business.id, category: business.category, position: benefitPosition + 1 });
  }, [benefit, benefitPosition, business]);

  useEffect(() => {
    if (!business || !benefit) return;
    if (typeof window === 'undefined') return;
    const benefitId = getBenefitTrackingId(business, benefit, benefitPosition);
    const legacyBenefitId = getLegacyBenefitTrackingId(business, benefitPosition);
    try {
      const stored = window.localStorage.getItem(SAVED_BENEFITS_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const savedSet = Array.isArray(parsed) ? new Set<string>(parsed) : new Set<string>();
      setIsSaved(savedSet.has(benefitId) || savedSet.has(legacyBenefitId));
    } catch {
      setIsSaved(false);
    }
  }, [benefit, benefitPosition, business]);

  useEffect(() => {
    setShowAllEligibleBanks(false);
    setBankSearchQuery('');
  }, [benefit?.id, benefitPosition]);

  const handleToggleSave = () => {
    if (!business || !benefit) return;
    if (typeof window === 'undefined') return;
    const benefitId = getBenefitTrackingId(business, benefit, benefitPosition);
    const legacyBenefitId = getLegacyBenefitTrackingId(business, benefitPosition);
    try {
      const stored = window.localStorage.getItem(SAVED_BENEFITS_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const savedSet = Array.isArray(parsed) ? new Set<string>(parsed) : new Set<string>();
      if (savedSet.has(benefitId) || savedSet.has(legacyBenefitId)) {
        savedSet.delete(benefitId);
        savedSet.delete(legacyBenefitId);
        setIsSaved(false);
        trackUnsaveBenefit({ source: 'benefit_detail_page', benefitId, businessId: business.id });
      } else {
        savedSet.add(benefitId);
        setIsSaved(true);
        trackSaveBenefit({ source: 'benefit_detail_page', benefitId, businessId: business.id });
      }
      window.localStorage.setItem(SAVED_BENEFITS_STORAGE_KEY, JSON.stringify(Array.from(savedSet)));
    } catch {
      setIsSaved(false);
    }
  };

  const handleOpenMap = () => {
    if (!business) return;
    trackStartNavigation({ source: 'benefit_detail_page', destinationBusinessId: business.id, provider: 'in_app_map' });
    navigate(`/map?business=${business.id}`);
  };

  const handleShare = async () => {
    if (!business || !benefit) return;
    if (typeof window === 'undefined') return;
    const benefitId = getBenefitTrackingId(business, benefit, benefitPosition);
    const url = new URL(buildBenefitPath(business.id, benefit, benefitPosition), window.location.origin).toString();
    const title = `${business.name} · Blink`;
    const text = benefit.description || benefit.benefit || `Beneficio en ${business.name}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        trackShareBenefit({ source: 'benefit_detail_page', benefitId, businessId: business.id, channel: 'web_share' });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        trackShareBenefit({ source: 'benefit_detail_page', benefitId, businessId: business.id, channel: 'clipboard' });
        return;
      }
      trackShareBenefit({ source: 'benefit_detail_page', benefitId, businessId: business.id, channel: 'unsupported' });
    } catch (error) {
      const channel = error instanceof DOMException && error.name === 'AbortError' ? 'dismissed' : 'share_error';
      trackShareBenefit({ source: 'benefit_detail_page', benefitId, businessId: business.id, channel });
    }
  };

  if (loading) {
    return <SkeletonBenefitDetailPage />;
  }

  if (error || !business || !benefit) {
    return (
      <div className="min-h-screen bg-blink-bg flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-16 h-16 rounded-2xl bg-blink-border flex items-center justify-center">
          <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 32 }}>search_off</span>
        </div>
        <p className="font-semibold text-blink-ink">{error || 'No encontrado'}</p>
        <button onClick={() => navigate(-1)} className="text-primary font-medium text-sm">← Volver</button>
      </div>
    );
  }

  const subscriptionName = getSubscriptionName(benefit.subscription);
  const subscription = getSubscriptionById(benefit.subscription);
  const isExpired = !isBenefitActive(benefit.validUntil);
  const discount = parseInt(benefit.rewardRate.match(/(\d+)%/)?.[1] || '0');
  const providerName = benefitProviderName || getBenefitProviderDisplayName(benefit);
  const providerSummary = getBenefitProviderSummary(benefit);
  const hasMultipleProviders = hasMultipleBenefitProviders(benefit);
  const eligibleBankPreview = getBenefitEligibleBankPreview(benefit, 12);
  const bankAccent = getBankAccent(providerName);

  const topeStr = benefit.tope != null ? String(benefit.tope) : '';
  const isNoLimit = !topeStr || /sin tope|sin l[ií]mite/i.test(topeStr);
  const topeAmount = !isNoLimit ? parseTopeAmount(topeStr) : null;
  // PER_USER caps: <=20 = usage count, >20 = monetary tope per client
  const perUserCaps = (benefit.caps ?? []).filter(c => c != null && c.resetsEvery === 'PER_USER');
  const perUserUsageCount = perUserCaps.find(c => c.amount <= 20)?.amount ?? null;
  const perUserMonetaryCap = perUserCaps.find(c => c.amount > 20)?.amount ?? null;
  // Effective cap: use the most restrictive (minimum) of PER_TXN and monetary PER_USER caps
  const effectiveCapAmount = [topeAmount, perUserMonetaryCap].filter((n): n is number => n != null).reduce<number | null>((min, n) => min === null ? n : Math.min(min, n), null);
  const maxSpend = effectiveCapAmount != null && discount > 0 ? effectiveCapAmount / (discount / 100) : null;
  const paymentMethod = getPaymentMethod(benefit);
  const minPurchaseAmount = benefit.minimumPurchaseAmount?.amount ?? null;

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const dateOnlyMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return `${day}/${month}/${year}`;
    }
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const validUntilFormatted = formatDate(benefit.validUntil);
  const dayAvailability = parseDayAvailability(benefit.cuando);
  const hasDayData = !!benefit.cuando;

  const termsText = [benefit.condicion, benefit.textoAplicacion, ...(benefit.requisitos || []), ...(benefit.usos || [])]
    .filter(Boolean)
    .join('\n\n');

  const locations = (() => {
    const valid = business.location.filter((l) => l.lat !== 0 || l.lng !== 0);
    if (!userPosition) return valid;
    return [...valid].sort((a, b) =>
      calculateDistance(userPosition.latitude, userPosition.longitude, a.lat, a.lng) -
      calculateDistance(userPosition.latitude, userPosition.longitude, b.lat, b.lng)
    );
  })();
  const displayLocations = locations.slice(0, LOCATIONS_PREVIEW_COUNT);

  const cards = (benefit.cardTypes && benefit.cardTypes.length > 0
    ? benefit.cardTypes
    : benefit.cardName ? [benefit.cardName] : []
  ).filter((c): c is string => typeof c === 'string' && c.trim().length > 0);

  return (
    <>
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-blink-bg font-body text-blink-ink">
      <main className="flex-1 overflow-y-auto pb-32 lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:py-8 lg:pb-12">

        {/* Hero — bank accent color, sticky */}
        <div
          className="relative lg:sticky lg:self-start lg:overflow-hidden lg:rounded-2xl lg:shadow-soft"
          style={{
            background: bankAccent.bg,
            minHeight: 220,
            position: 'sticky',
            top: isDesktop ? 96 : 0,
            zIndex: 50,
            boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          }}
        >
          {/* Floating nav */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-6 z-20">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: 'rgba(0,0,0,0.07)', border: `1px solid ${bankAccent.border}` }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: bankAccent.text }}>arrow_back</span>
            </button>
            <button
              onClick={handleToggleSave}
              className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{
                background: isSaved ? 'rgba(251,113,133,0.85)' : 'rgba(0,0,0,0.07)',
                border: `1px solid ${isSaved ? 'transparent' : bankAccent.border}`,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20, color: isSaved ? 'white' : bankAccent.text, fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
              >
                favorite
              </span>
            </button>
          </div>

          {/* Hero content */}
          <div className="relative z-10 flex flex-col items-center pt-20 pb-7 px-6 text-center">

            {/* Business logo with bank badge overlaid */}
            <div className="relative mb-3">
              <div
                className="w-[72px] h-[72px] rounded-[20px] bg-white flex items-center justify-center overflow-hidden"
                style={{ boxShadow: '0 6px 24px rgba(0,0,0,0.12)', border: `2px solid ${bankAccent.border}` }}
              >
                {business.image ? (
                  <img alt={business.name} className="w-full h-full object-cover" src={getOptimizedImageUrl(business.image, { width: 160 })} decoding="async" referrerPolicy="no-referrer" />
                ) : (
                  <span className="font-black text-2xl" style={{ color: bankAccent.text }}>{business.name?.charAt(0)}</span>
                )}
              </div>
              {/* Bank badge */}
              <div
                className="absolute -bottom-2 -right-2 rounded-full"
                style={{ display: 'flex', border: '2.5px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.18)' }}
              >
                <BankLogo bankName={providerName} size={26} />
              </div>
            </div>

            <h1 className="font-black text-[20px] leading-tight mb-2.5" style={{ color: bankAccent.text }}>
              {business.name}
            </h1>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: bankAccent.text, color: 'white' }}
              >
                {providerName}{benefit.cardName ? ` · ${benefit.cardName.replace(/ any$/i, '')}` : ''}
              </span>
              {isModoBenefit(benefit) && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-black tracking-wide flex items-center gap-1 shadow-sm"
                  style={{
                    background: '#10B981',
                    color: '#ffffff',
                  }}
                >
                  Modo
                </span>
              )}
              {providerSummary && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: bankAccent.border, color: bankAccent.text }}
                >
                  {providerSummary}
                </span>
              )}
              {subscriptionName && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: bankAccent.border, color: bankAccent.text }}
                >
                  {subscriptionName}
                </span>
              )}
            </div>

            <div className="mt-6 hidden w-full max-w-xs flex-col gap-2 lg:flex">
              <button
                onClick={handleOpenMap}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-indigo text-sm font-semibold text-white shadow-soft transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>location_on</span>
                Ver ubicacion
              </button>
              <button
                onClick={() => void handleShare()}
                className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-blink-border bg-white/70 text-sm font-semibold transition-all active:scale-[0.98]"
                style={{ color: bankAccent.text }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>share</span>
                Compartir beneficio
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4 lg:min-w-0 lg:p-0">

          {/* ── Expired notice ── */}
          {isExpired && (
            <div
              className="rounded-2xl px-4 py-4 flex items-start gap-3"
              style={{ background: '#FEF2F2', border: '1.5px solid #FECACA' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#FEE2E2' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#DC2626' }}>cancel</span>
              </div>
              <div>
                <p className="font-bold text-[15px]" style={{ color: '#991B1B' }}>Este beneficio ya venció</p>
                <p className="text-sm mt-0.5" style={{ color: '#B91C1C' }}>
                  {benefit.validUntil
                    ? `Dejó de estar disponible el ${validUntilFormatted}.`
                    : 'Este beneficio ya no está disponible.'}
                </p>
              </div>
            </div>
          )}

          {/* ── Discount hero card ── */}
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8E6E1' }}
          >
            <div className="flex flex-col items-center text-center px-6 pt-7 pb-7">
              {/* Benefit title */}
              <p className="text-sm font-medium text-blink-muted mb-4">{benefit.benefit}</p>

              {discount > 0 ? (
                <>
                  <div className="flex items-end gap-1 leading-none">
                    <span className="font-black" style={{ fontSize: 96, lineHeight: 0.85, color: '#6366F1' }}>{discount}</span>
                    <div className="flex flex-col items-start mb-1">
                      <span className="font-black leading-none" style={{ fontSize: 34, color: '#818CF8' }}>%</span>
                      <span className="font-bold text-[11px] tracking-[0.14em] uppercase text-blink-muted">OFF</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-blink-muted mt-3">de ahorro</p>
                  {benefit.installments != null && benefit.installments > 0 && (
                    <p className="text-xs font-semibold mt-2" style={{ color: '#059669' }}>
                      + {benefit.installments} cuotas sin interés
                    </p>
                  )}
                </>
              ) : benefit.installments && benefit.installments > 0 ? (
                <>
                  <div className="flex items-end gap-2 leading-none">
                    <span className="font-black" style={{ fontSize: 96, lineHeight: 0.85, color: '#6366F1' }}>{benefit.installments}</span>
                    <span className="font-bold mb-1" style={{ fontSize: 28, color: '#818CF8' }}>x</span>
                  </div>
                  <p className="text-sm font-medium text-blink-muted mt-3">cuotas sin interés</p>
                </>
              ) : (
                <p className="font-bold text-blink-ink text-lg leading-snug">{benefit.benefit}</p>
              )}
            </div>
          </div>

          {/* ── Condiciones card ── */}
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8E6E1' }}
          >
            <div className="px-5 pt-5 pb-4">
              <p className="font-bold text-[15px] text-blink-ink mb-3">Condiciones</p>

              <div className="divide-y divide-blink-border">

                {/* Usos por cuenta (PER_USER cap with small count) */}
                {perUserUsageCount !== null && (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-blink-muted">Usos por cuenta</span>
                    <span className="text-sm font-semibold text-blink-ink">
                      {perUserUsageCount === 1 ? '1 uso' : `${perUserUsageCount} usos`}
                    </span>
                  </div>
                )}

                {/* Tope por cliente (PER_USER cap with monetary amount) */}
                {perUserMonetaryCap !== null && (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-blink-muted">Tope por cliente</span>
                    <span className="text-sm font-semibold text-blink-ink">{formatArgentinePeso(perUserMonetaryCap)}</span>
                  </div>
                )}

                {/* Tope descuento (PER_TXN cap) */}
                {!isNoLimit && benefit.tope && (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-blink-muted">Tope descuento</span>
                    <span className="text-sm font-semibold text-blink-ink">{benefit.tope}</span>
                  </div>
                )}

                {/* Compra mínima requerida */}
                {minPurchaseAmount !== null && (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-blink-muted">Compra mínima requerida</span>
                    <span className="text-sm font-semibold text-blink-ink">{formatArgentinePeso(minPurchaseAmount)}</span>
                  </div>
                )}

                {/* Max spend to maximize discount */}
                {maxSpend && (
                  <div className="flex items-start justify-between gap-4 py-3">
                    <span className="text-sm text-blink-muted leading-snug flex-1">
                      Aprovechá el descuento al máximo gastando hasta
                    </span>
                    <span className="text-sm font-semibold flex-shrink-0 flex items-center gap-1" style={{ color: '#6366F1' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>info</span>
                      {formatArgentinePeso(maxSpend)}
                    </span>
                  </div>
                )}

                {/* Vigencia */}
                {validUntilFormatted && (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-blink-muted">Vigencia</span>
                    {isExpired ? (
                      <span className="text-sm font-semibold flex items-center gap-1" style={{ color: '#DC2626' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>event_busy</span>
                        Venció {validUntilFormatted}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-blink-ink">hasta {validUntilFormatted}</span>
                    )}
                  </div>
                )}

                {/* Pagando con */}
                {paymentMethod && (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-blink-muted">Pagando con</span>
                    <span className="text-sm font-semibold text-blink-ink">{paymentMethod}</span>
                  </div>
                )}

                {/* Días disponible */}
                {hasDayData && dayAvailability && (
                  <div className="flex items-center justify-between py-3 gap-3">
                    <span className="text-sm text-blink-muted flex-shrink-0">Días disponible</span>
                    <div className="flex gap-1">
                      {BENEFIT_DAYS.map((day) => {
                        const isActive = dayAvailability.allDays || dayAvailability[day.key] || false;
                        return (
                          <div
                            key={day.key}
                            className="w-7 h-7 flex items-center justify-center rounded-lg font-semibold text-[11px]"
                            style={
                              isActive
                                ? { background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)', color: 'white' }
                                : { background: '#F3F4F6', color: '#9CA3AF' }
                            }
                          >
                            {day.abbr}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

              {/* Benefit description */}
              {benefit.description ? (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid #E8E6E1' }}>
                  <p className="text-sm text-blink-muted leading-relaxed">{benefit.description}</p>
                </div>
              ) : null}

              <p className="text-xs text-blink-muted mt-4 leading-relaxed">
                El beneficio puede tener condiciones o restricciones especiales no listadas aquí.
              </p>
            </div>
          </div>

          {/* ── Accede al beneficio ── */}
          {(cards.length > 0 || subscription || eligibleBankPreview.total > 1 || isModoBenefit(benefit)) && (
            <div
              className="bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8E6E1' }}
            >
              <div className="px-5 pt-5 pb-5">
                <p className="font-bold text-[15px] text-blink-ink mb-4">Accede al beneficio</p>

                <div className="space-y-2.5">
                  {isModoBenefit(benefit) && (
                    <>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-blink-muted">
                        Método de pago
                      </p>
                      <div
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                        style={{ background: '#F9FAFB', border: '1px solid #E8E6E1' }}
                      >
                        <span
                          className="material-symbols-outlined flex-shrink-0"
                          style={{ fontSize: 18, color: '#10B981' }}
                        >
                          qr_code_2
                        </span>
                        <span className="text-sm font-medium text-blink-ink">Modo</span>
                      </div>
                    </>
                  )}

                  {cards.length > 0 && (
                    <div className={isModoBenefit(benefit) ? 'pt-3 mt-1 border-t border-blink-border' : ''}>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-blink-muted mb-2.5">
                        {hasMultipleProviders
                          ? `Con ${providerName} y bancos adheridos`
                          : `Con tus tarjetas de ${providerName}`}
                      </p>
                    </div>
                  )}
                  {cards.map((card, i) => {
                    const cardClean = String(card ?? '').replace(/ any$/i, '');
                    const dark = isPremiumCard(cardClean);
                    const network = detectCardNetwork(cardClean) || detectCardNetwork(providerName);

                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                        style={{
                          background: dark ? '#1C1C1E' : '#F9FAFB',
                          border: dark ? 'none' : '1px solid #E8E6E1',
                        }}
                      >
                        {network && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0"
                            style={{
                              background: dark ? 'rgba(255,255,255,0.12)' : bankAccent.bg,
                              color: dark ? 'rgba(255,255,255,0.85)' : bankAccent.text,
                              letterSpacing: '0.04em',
                            }}
                          >
                            {network}
                          </span>
                        )}
                        <span
                          className="text-sm font-medium"
                          style={{ color: dark ? 'white' : '#1C1C1E' }}
                        >
                          {cardClean}
                        </span>
                      </div>
                    );
                  })}

                  {/* Subscription entry */}
                  {subscription && (
                    <>
                      {cards.length > 0 && (
                        <div className="pt-1 pb-0.5" style={{ borderTop: '1px solid #E8E6E1' }}>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-blink-muted">
                            Membresía requerida
                          </p>
                        </div>
                      )}
                      <div
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                        style={{ background: '#F9FAFB', border: '1px solid #E8E6E1' }}
                      >
                        {subscription.icon ? (
                          <img
                            src={getOptimizedImageUrl(subscription.icon, { width: 64 })}
                            alt={subscription.name}
                            className="w-6 h-6 rounded object-contain flex-shrink-0"
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span
                            className="material-symbols-outlined flex-shrink-0"
                            style={{ fontSize: 18, color: bankAccent.text }}
                          >
                            loyalty
                          </span>
                        )}
                        <span className="text-sm font-medium text-blink-ink">{subscription.name}</span>
                      </div>
                    </>
                  )}

                  {eligibleBankPreview.total > 1 && (
                    <div className={cards.length > 0 || subscription ? 'pt-3 mt-3 border-t border-blink-border' : ''}>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 13 }}>account_balance</span>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-blink-muted">
                          Bancos adheridos
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {eligibleBankPreview.visible.map((bankName) => {
                          const accent = getBankAccent(bankName);
                          return (
                            <span
                              key={bankName}
                              title={bankName}
                              className="pl-1 pr-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 hover:scale-[1.04] active:scale-[0.98] transition-all duration-150 cursor-default select-none"
                              style={{
                                background: accent.bg,
                                color: accent.text,
                                borderColor: accent.border,
                              }}
                            >
                              <BankLogo bankName={bankName} size={18} />
                              {bankName}
                            </span>
                          );
                        })}
                        {eligibleBankPreview.total > 12 && (
                          <button
                            type="button"
                            onClick={() => setShowAllEligibleBanks(true)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 active:scale-95 transition-all duration-150 cursor-pointer flex items-center justify-center gap-0.5 shadow-sm"
                            aria-label="Ver todos los bancos adheridos"
                          >
                            Ver todos ({eligibleBankPreview.total})
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Savings Simulator (discount, optionally with installments) ── */}
          {discount > 0 && (
            <SavingsSimulator
              discountPercentage={discount}
              maxCap={effectiveCapAmount != null ? String(effectiveCapAmount) : (benefit.tope || null)}
              installments={benefit.installments}
            />
          )}

          {/* ── Installment Simulator (installments only, no discount) ── */}
          {discount <= 0 && benefit.installments != null && benefit.installments > 0 && (
            <InstallmentSimulator installments={benefit.installments} />
          )}

          {/* ── Disponible en ── */}
          {locations.length > 0 && (
            <div
              className="bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8E6E1' }}
            >
              <div className="px-5 pt-5 pb-3">
                <p className="font-bold text-[15px] text-blink-ink mb-1">Disponible en:</p>

                <div className="divide-y divide-blink-border">
                  {displayLocations.map((loc, i) => {
                    const streetLine = loc.addressComponents?.route
                      ? `${loc.addressComponents.route}${loc.addressComponents.streetNumber ? ' ' + loc.addressComponents.streetNumber : ''}`
                      : loc.name || (loc.formattedAddress?.split(',')[0] ?? 'Dirección no disponible');

                    const cityLine = loc.addressComponents
                      ? [
                          loc.addressComponents.locality,
                          loc.addressComponents.adminAreaLevel1,
                          loc.addressComponents.country,
                        ].filter(Boolean).join(', ')
                      : loc.formattedAddress ?? '';

                    return (
                      <div key={i} className="flex items-start gap-3 py-3">
                        <span
                          className="material-symbols-outlined flex-shrink-0 mt-0.5"
                          style={{ fontSize: 18, color: '#9CA3AF' }}
                        >
                          location_on
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-blink-ink leading-tight">{streetLine}</p>
                          {cityLine && (
                            <p className="text-xs text-blink-muted mt-0.5">{cityLine}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {locations.length > LOCATIONS_PREVIEW_COUNT && (
                  <button
                    onClick={() => { setLocationSearch(''); setShowLocationSearch(false); setShowLocationPopup(true); }}
                    className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                    style={{ background: '#EEF2FF', color: '#6366F1' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
                    Ver las {locations.length} ubicaciones
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Términos y condiciones ── */}
          {termsText ? (
            <div
              className="bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8E6E1' }}
            >
              <button
                onClick={() => setShowTerms(!showTerms)}
                className="w-full px-5 py-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#EEF2FF' }}>
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>gavel</span>
                  </div>
                  <p className="font-bold text-[15px] text-blink-ink">Términos y condiciones</p>
                </div>
                <span
                  className="material-symbols-outlined text-blink-muted transition-transform duration-200 flex-shrink-0"
                  style={{ fontSize: 20, transform: showTerms ? 'rotate(180deg)' : 'none' }}
                >
                  expand_more
                </span>
              </button>
              {showTerms && (
                <div className="px-5 pb-5" style={{ borderTop: '1px solid #E8E6E1' }}>
                  <p className="text-sm text-blink-muted leading-relaxed whitespace-pre-wrap pt-4">{termsText}</p>
                </div>
              )}
            </div>
          ) : null}

        </div>
      </main>

      {/* Fixed bottom CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 flex gap-3 p-4 lg:hidden"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid #E8E6E1',
        }}
      >
        <button
          onClick={handleOpenMap}
          className="flex-1 text-white font-semibold py-4 rounded-2xl text-base transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)', boxShadow: '0 4px 16px rgba(99,102,241,0.30)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>location_on</span>
          Ver ubicación
        </button>
        <button
          onClick={() => void handleShare()}
          className="w-14 bg-blink-bg border border-blink-border text-blink-muted rounded-2xl flex items-center justify-center transition-all duration-150 active:scale-95 hover:bg-gray-100"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>share</span>
        </button>
      </div>
    </div>

    {/* ── Locations popup — portal to escape any stacking context ── */}
    {showLocationPopup && createPortal(
      <div
        className="fixed inset-0 z-[200] bg-black/50 lg:flex lg:items-center lg:justify-center lg:p-6"
        onClick={() => setShowLocationPopup(false)}
      >
        <div
          className="absolute bottom-0 left-0 right-0 flex max-h-[65vh] flex-col rounded-t-[20px] bg-white lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:w-full lg:max-w-2xl lg:rounded-2xl"
          style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #E8E6E1' }}>
            <div>
              <h3 className="font-semibold text-base text-blink-ink">Todas las ubicaciones</h3>
              <p className="text-xs text-blink-muted mt-0.5">
                {locations.length} sucursales
                {userPosition ? ' · ordenadas por cercanía' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (showLocationSearch) { setLocationSearch(''); }
                  setShowLocationSearch(!showLocationSearch);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-blink-bg text-blink-muted hover:bg-gray-100 transition-colors text-base"
              >
                🔍
              </button>
              <button
                onClick={() => setShowLocationPopup(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-blink-bg text-blink-muted hover:bg-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>
          </div>

          {/* Collapsible search bar */}
          {showLocationSearch && (
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #F1F0EC' }}>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-blink-muted"
                  style={{ fontSize: 18 }}
                >
                  search
                </span>
                <input
                  autoFocus
                  className="w-full h-10 bg-blink-bg border border-blink-border rounded-xl pl-9 pr-9 text-sm text-blink-ink placeholder-blink-muted focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Buscar por dirección o nombre..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                />
                {locationSearch && (
                  <button
                    onClick={() => setLocationSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blink-muted"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Location list */}
          <div className="flex-1 overflow-y-auto divide-y divide-blink-border">
            {(() => {
              const q = locationSearch.trim().toLowerCase();
              const filtered = q
                ? locations.filter((loc) =>
                    (loc.name || '').toLowerCase().includes(q) ||
                    (loc.formattedAddress || '').toLowerCase().includes(q)
                  )
                : locations;

              if (filtered.length === 0) {
                return (
                  <div className="py-12 text-center text-blink-muted text-sm">
                    Sin resultados para "{locationSearch}"
                  </div>
                );
              }

              return filtered.map((loc, i) => {
                const streetLine = loc.addressComponents?.route
                  ? `${loc.addressComponents.route}${loc.addressComponents.streetNumber ? ' ' + loc.addressComponents.streetNumber : ''}`
                  : loc.name || (loc.formattedAddress?.split(',')[0] ?? 'Dirección no disponible');

                const cityLine = loc.addressComponents
                  ? [loc.addressComponents.locality, loc.addressComponents.adminAreaLevel1].filter(Boolean).join(', ')
                  : loc.formattedAddress ?? '';

                const dist = userPosition
                  ? calculateDistance(userPosition.latitude, userPosition.longitude, loc.lat, loc.lng)
                  : null;

                const isNearest = !q && userPosition && i === 0;

                return (
                  <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                    <div
                      className="mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: '#F3F4F6' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#6B7280' }}>
                        location_on
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-sm font-medium text-blink-ink leading-tight truncate">{streetLine}</p>
                        {isNearest && (
                          <span className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                            Más cercana
                          </span>
                        )}
                      </div>
                      {cityLine && (
                        <p className="text-xs text-blink-muted">{cityLine}</p>
                      )}
                    </div>
                    {dist !== null && (
                      <span className="text-xs font-semibold flex-shrink-0 mt-0.5 text-blink-muted">
                        {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}
                      </span>
                    )}
                  </div>
                );
              });
            })()}
            <div className="h-6" />
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* ── Eligible Banks bottom-sheet popup ── */}
    {showAllEligibleBanks && createPortal(
      <div
        className="fixed inset-0 z-[200] bg-black/50 lg:flex lg:items-center lg:justify-center lg:p-6"
        onClick={() => {
          setShowAllEligibleBanks(false);
          setBankSearchQuery('');
        }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 flex max-h-[75vh] flex-col rounded-t-[20px] bg-white animate-slide-up lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:w-full lg:max-w-2xl lg:rounded-2xl"
          style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #E8E6E1' }}>
            <div>
              <h3 className="font-semibold text-base text-blink-ink">Bancos adheridos</h3>
              <p className="text-xs text-blink-muted mt-0.5">
                {getBenefitEligibilityBankNames(benefit).length} entidades financieras
              </p>
            </div>
            <button
              onClick={() => {
                setShowAllEligibleBanks(false);
                setBankSearchQuery('');
              }}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-blink-bg text-blink-muted hover:bg-gray-100 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
          </div>

          {/* Search bar inside modal */}
          {getBenefitEligibilityBankNames(benefit).length > 8 && (
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #F1F0EC' }}>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-blink-muted"
                  style={{ fontSize: 18 }}
                >
                  search
                </span>
                <input
                  className="w-full h-10 bg-blink-bg border border-blink-border rounded-xl pl-9 pr-9 text-sm text-blink-ink placeholder-blink-muted focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Buscar banco..."
                  value={bankSearchQuery}
                  onChange={(e) => setBankSearchQuery(e.target.value)}
                />
                {bankSearchQuery && (
                  <button
                    onClick={() => setBankSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blink-muted"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Bank list/grid container */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {(() => {
              const allBankNames = getBenefitEligibilityBankNames(benefit);
              const filtered = allBankNames.filter((name) =>
                name.toLowerCase().includes(bankSearchQuery.toLowerCase())
              );

              if (filtered.length === 0) {
                return (
                  <div className="py-12 text-center text-blink-muted text-sm">
                    Sin resultados para "{bankSearchQuery}"
                  </div>
                );
              }

              return (
                <div className="flex flex-wrap gap-2 py-2">
                  {filtered.map((bankName) => {
                    const accent = getBankAccent(bankName);
                    return (
                      <div
                        key={bankName}
                        className="pl-1.5 pr-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 hover:scale-[1.04] active:scale-[0.98] transition-all duration-150 cursor-default select-none"
                        style={{
                          background: accent.bg,
                          color: accent.text,
                          borderColor: accent.border,
                        }}
                      >
                        <BankLogo bankName={bankName} size={22} />
                        {bankName}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            <div className="h-6" />
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}

export default BenefitDetailPage;
