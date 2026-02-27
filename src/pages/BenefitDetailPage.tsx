import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Business, BankBenefit } from '../types';
import { fetchBusinessesPaginated } from '../services/api';
import SavingsSimulator from '../components/neo/SavingsSimulator';
import { parseDayAvailabilityFromBenefit } from '../utils/dayAvailabilityParser';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useSEO } from '../hooks/useSEO';
import {
  trackSaveBenefit,
  trackShareBenefit,
  trackStartNavigation,
  trackUnsaveBenefit,
  trackViewBenefit,
} from '../analytics/intentTracking';

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

// Soft bank accent colors
const getBankAccent = (name: string): { bg: string; text: string; border: string } => {
  const lower = name.toLowerCase();
  if (lower.includes('galicia')) return { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE' };
  if (lower.includes('santander')) return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' };
  if (lower.includes('bbva')) return { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' };
  if (lower.includes('macro')) return { bg: '#EEF2FF', text: '#78350F', border: '#C7D2FE' };
  if (lower.includes('nacion')) return { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' };
  if (lower.includes('hsbc')) return { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' };
  if (lower.includes('icbc')) return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' };
  if (lower.includes('modo')) return { bg: '#EDE9FE', text: '#5B21B6', border: '#DDD6FE' };
  if (lower.includes('naranja')) return { bg: '#FED7AA', text: '#9A3412', border: '#FDBA74' };
  if (lower.includes('ciudad')) return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' };
  return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
};

function BenefitDetailPage() {
  const { id, benefitIndex } = useParams<{ id: string; benefitIndex?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const passedBusiness = (location.state as { business?: Business } | null)?.business;
  const [business, setBusiness] = useState<Business | null>(passedBusiness || null);
  const [benefit, setBenefit] = useState<BankBenefit | null>(null);
  const [loading, setLoading] = useState(!passedBusiness);
  const [error, setError] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const [benefitPosition, setBenefitPosition] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const viewedBenefitSignatureRef = useRef('');
  const { getSubscriptionName } = useSubscriptions();
  const benefitPath = id ? `/benefit/${id}/${benefitIndex ?? '0'}` : '/benefit';
  const benefitDiscount = benefit?.rewardRate.match(/(\d+)%/)?.[1];

  useSEO({
    title: business && benefit
      ? `${business.name}: ${benefit.benefit} | Blink`
      : 'Detalle de beneficio bancario | Blink',
    description: business && benefit
      ? `${benefitDiscount ? `${benefitDiscount}% de ahorro` : 'Beneficio bancario'} en ${business.name}. Revisa vigencia, condiciones y sucursales adheridas.`
      : 'Revisa condiciones, vigencia y ubicaciones de cada beneficio bancario.',
    path: business ? `/benefit/${business.id}/${benefitPosition}` : benefitPath,
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
            name: benefit.bankName,
          },
        }
      : undefined,
  });

  useEffect(() => {
    if (passedBusiness) {
      const parsedIndex = benefitIndex !== undefined ? Number.parseInt(benefitIndex, 10) : 0;
      const safeIndex = Number.isNaN(parsedIndex) ? 0 : Math.max(0, parsedIndex);
      const resolvedIndex = passedBusiness.benefits[safeIndex] ? safeIndex : 0;
      setBenefitPosition(resolvedIndex);
      setBenefit(passedBusiness.benefits[resolvedIndex] || passedBusiness.benefits[0] || null);
      return;
    }

    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const searchName = id.replace(/-/g, ' ');
        const response = await fetchBusinessesPaginated({ search: searchName, limit: 1 });
        if (response.success && response.businesses.length > 0) {
          const biz = response.businesses[0];
          setBusiness(biz);
          const parsedIndex = benefitIndex !== undefined ? Number.parseInt(benefitIndex, 10) : 0;
          const safeIndex = Number.isNaN(parsedIndex) ? 0 : Math.max(0, parsedIndex);
          const resolvedIndex = biz.benefits[safeIndex] ? safeIndex : 0;
          setBenefitPosition(resolvedIndex);
          setBenefit(biz.benefits[resolvedIndex] || biz.benefits[0] || null);
        } else {
          setError('Beneficio no encontrado');
        }
      } catch {
        setError('Error al cargar');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, benefitIndex, passedBusiness]);

  useEffect(() => {
    if (!business || !benefit) return;
    const benefitId = `${business.id}:${benefitPosition}`;
    const signature = `${benefitId}|detail`;
    if (viewedBenefitSignatureRef.current === signature) return;
    viewedBenefitSignatureRef.current = signature;
    trackViewBenefit({ source: 'benefit_detail_page', benefitId, businessId: business.id, category: business.category, position: benefitPosition + 1 });
  }, [benefit, benefitPosition, business]);

  useEffect(() => {
    if (!business || !benefit) return;
    if (typeof window === 'undefined') return;
    const benefitId = `${business.id}:${benefitPosition}`;
    try {
      const stored = window.localStorage.getItem(SAVED_BENEFITS_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const savedSet = Array.isArray(parsed) ? new Set<string>(parsed) : new Set<string>();
      setIsSaved(savedSet.has(benefitId));
    } catch {
      setIsSaved(false);
    }
  }, [benefit, benefitPosition, business]);

  const handleToggleSave = () => {
    if (!business || !benefit) return;
    if (typeof window === 'undefined') return;
    const benefitId = `${business.id}:${benefitPosition}`;
    try {
      const stored = window.localStorage.getItem(SAVED_BENEFITS_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const savedSet = Array.isArray(parsed) ? new Set<string>(parsed) : new Set<string>();
      if (savedSet.has(benefitId)) {
        savedSet.delete(benefitId);
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
    const benefitId = `${business.id}:${benefitPosition}`;
    const url = window.location.href;
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
    return (
      <div className="min-h-screen bg-blink-bg flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-blink-border border-t-primary animate-spin" />
      </div>
    );
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
  const discount = parseInt(benefit.rewardRate.match(/(\d+)%/)?.[1] || '0');
  const isOnline = business.hasOnline;
  const bankAccent = getBankAccent(benefit.bankName);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  const validUntilFormatted = formatDate(benefit.validUntil);
  const dayAvailability = parseDayAvailabilityFromBenefit(benefit);
  const termsText = [benefit.condicion, benefit.textoAplicacion, ...(benefit.requisitos || []), ...(benefit.usos || [])].filter(Boolean).join('\n\n');
  const locations = business.location.filter((l) => l.lat !== 0 || l.lng !== 0);

  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col relative overflow-x-hidden">
      <main className="flex-1 overflow-y-auto pb-32">

        {/* Hero - dark indigo (distinct from the light business page hero) */}
        <div
          className="relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #3730A3 0%, #4F46E5 100%)', minHeight: 240 }}
        >
          {/* Floating nav buttons - glass on dark background */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-6 z-20">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.25)' }}
            >
              <span className="material-symbols-outlined text-white" style={{ fontSize: 20 }}>arrow_back</span>
            </button>
            <button
              onClick={handleToggleSave}
              className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{
                background: isSaved ? 'rgba(251,113,133,0.85)' : 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              <span
                className="material-symbols-outlined text-white"
                style={{ fontSize: 20, fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
              >
                favorite
              </span>
            </button>
          </div>

          {/* Hero content: logo + business name + bank badge */}
          <div className="relative z-10 flex flex-col items-center pt-20 pb-8 px-6 text-center">
            {/* Logo */}
            <div
              className="w-[72px] h-[72px] rounded-[20px] bg-white flex items-center justify-center overflow-hidden mb-3"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.30)', border: '2px solid rgba(255,255,255,0.20)' }}
            >
              {business.image ? (
                <img alt={business.name} className="w-full h-full object-contain p-1.5" src={business.image} />
              ) : (
                <span className="font-black text-2xl text-primary">{business.name?.charAt(0)}</span>
              )}
            </div>

            {/* Business name */}
            <h1 className="font-black text-[20px] text-white leading-tight mb-2.5">{business.name}</h1>

            {/* Bank + card badge + subscription — glass style on dark bg */}
            <div className="flex items-center gap-2">
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold text-white/90"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
              >
                {benefit.bankName}{benefit.cardName ? ` · ${benefit.cardName}` : ''}
              </span>
              {subscriptionName && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white/90"
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
                >
                  {subscriptionName}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">

        {/* Main Benefit Card */}
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8E6E1' }}
        >
          {/* Discount hero — white, clear contrast from the indigo hero above */}
          <div className="flex flex-col items-center text-center px-6 pt-8 pb-7 bg-white">
            {discount > 0 ? (
              <>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4 text-blink-muted">Descuento</p>
                <div className="flex items-end gap-1 leading-none">
                  <span className="font-black" style={{ fontSize: 96, lineHeight: 0.85, color: '#6366F1' }}>{discount}</span>
                  <div className="flex flex-col items-start mb-1">
                    <span className="font-black leading-none" style={{ fontSize: 34, color: '#818CF8' }}>%</span>
                    <span className="font-bold text-[11px] tracking-[0.14em] uppercase text-blink-muted">OFF</span>
                  </div>
                </div>
                {benefit.installments != null && benefit.installments > 0 && (
                  <p className="text-xs font-semibold mt-3" style={{ color: '#059669' }}>+ {benefit.installments} cuotas sin interés</p>
                )}
                <p className="text-xs font-medium mt-2 text-blink-muted">
                  {!benefit.tope || String(benefit.tope).toUpperCase().includes('SIN TOPE') ? 'Sin tope de reintegro' : `Tope: ${benefit.tope}`}
                </p>
              </>
            ) : benefit.installments && benefit.installments > 0 ? (
              <>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4 text-blink-muted">Cuotas sin interés</p>
                <div className="flex items-end gap-2 leading-none">
                  <span className="font-black" style={{ fontSize: 96, lineHeight: 0.85, color: '#6366F1' }}>{benefit.installments}</span>
                  <span className="font-bold mb-1" style={{ fontSize: 28, color: '#818CF8' }}>x</span>
                </div>
                <p className="text-xs font-medium mt-3 text-blink-muted">sin interés</p>
                {benefit.tope && (
                  <p className="text-xs font-medium mt-2 text-blink-muted">
                    {String(benefit.tope).toUpperCase().includes('SIN TOPE') ? 'Sin tope de reintegro' : `Tope: ${benefit.tope}`}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4 text-blink-muted">Beneficio</p>
                <p className="font-bold text-blink-ink text-lg leading-snug">{benefit.benefit}</p>
              </>
            )}

            {/* Bank + card badges */}
            <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
              <span
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: bankAccent.bg, color: bankAccent.text, border: `1px solid ${bankAccent.border}` }}
              >
                {benefit.bankName}
              </span>
              {(benefit.cardTypes && benefit.cardTypes.length > 0
                ? benefit.cardTypes
                : benefit.cardName ? [benefit.cardName] : []
              ).map((card, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-blink-muted"
                  style={{ background: '#F9FAFB', border: '1px solid #E8E6E1' }}
                >
                  {card}
                </span>
              ))}
            </div>
          </div>

{/* Days availability */}
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #E8E6E1' }}>
            <p className="text-[10px] font-semibold text-blink-muted uppercase tracking-wide mb-2.5">Días de vigencia</p>
            <div className="flex gap-1.5">
              {BENEFIT_DAYS.map((day) => {
                const isActive = dayAvailability?.allDays || dayAvailability?.[day.key] || false;
                return (
                  <div
                    key={day.key}
                    className="flex-1 h-8 flex items-center justify-center rounded-xl font-semibold text-xs transition-all"
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

          {/* Description */}
          {benefit.description && (
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #E8E6E1' }}>
              <p className="text-sm text-blink-ink leading-relaxed">{benefit.description}</p>
            </div>
          )}

          <div className="px-5 py-4 flex items-center justify-between">
            <p className="text-[10px] text-blink-muted italic">* Por transacción. Consultá bases legales.</p>
            {validUntilFormatted && (
              <span className="text-[10px] font-medium text-blink-muted">Válido hasta {validUntilFormatted}</span>
            )}
          </div>
        </div>

        {/* Savings Simulator */}
        {discount > 0 && (
          <SavingsSimulator discountPercentage={discount} maxCap={benefit.tope || null} />
        )}

        {/* Expandable sections */}
        <div className="space-y-2">
          {/* Terms */}
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid #E8E6E1' }}
          >
            <button
              onClick={() => setShowTerms(!showTerms)}
              className="w-full px-4 py-3.5 flex justify-between items-center text-left"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: '#EEF2FF' }}
                >
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>gavel</span>
                </div>
                <span className="font-semibold text-sm text-blink-ink">Términos y condiciones</span>
              </div>
              <span
                className="material-symbols-outlined text-blink-muted transition-transform duration-200"
                style={{ fontSize: 20, transform: showTerms ? 'rotate(180deg)' : 'none' }}
              >
                expand_more
              </span>
            </button>
            {showTerms && termsText && (
              <div className="px-4 pb-4 pt-0" style={{ borderTop: '1px solid #E8E6E1' }}>
                <p className="text-xs text-blink-muted leading-relaxed whitespace-pre-wrap pt-3">{termsText}</p>
              </div>
            )}
          </div>

          {/* Locations */}
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid #E8E6E1' }}
          >
            <button
              onClick={() => setShowLocations(!showLocations)}
              className="w-full px-4 py-3.5 flex justify-between items-center text-left"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: '#F0FDF4' }}
                >
                  <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: 16 }}>storefront</span>
                </div>
                <span className="font-semibold text-sm text-blink-ink">Sucursales adheridas</span>
              </div>
              <span
                className="material-symbols-outlined text-blink-muted transition-transform duration-200"
                style={{ fontSize: 20, transform: showLocations ? 'rotate(180deg)' : 'none' }}
              >
                expand_more
              </span>
            </button>
            {showLocations && locations.length > 0 && (
              <div className="px-4 pb-4 pt-0 space-y-2" style={{ borderTop: '1px solid #E8E6E1' }}>
                {locations.map((loc, i) => (
                  <div key={i} className="flex items-start gap-2 pt-3 border-b border-blink-border pb-2 last:border-0">
                    <span className="material-symbols-outlined text-blink-muted flex-shrink-0" style={{ fontSize: 14, marginTop: 1 }}>location_on</span>
                    <p className="text-xs text-blink-muted leading-snug">
                      {loc.formattedAddress || 'Dirección no disponible'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>{/* close p-4 space-y-3 */}
      </main>

      {/* Fixed Bottom CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 flex gap-3 z-20"
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
  );
}

export default BenefitDetailPage;
