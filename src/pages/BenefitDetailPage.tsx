import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Business, BankBenefit } from '../types';
import { fetchBusinessesPaginated } from '../services/api';
import SavingsSimulator from '../components/neo/SavingsSimulator';
import { parseDayAvailabilityFromBenefit } from '../utils/dayAvailabilityParser';
import { useSubscriptions } from '../hooks/useSubscriptions';
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
  if (lower.includes('galicia')) return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
  if (lower.includes('santander')) return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' };
  if (lower.includes('bbva')) return { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' };
  if (lower.includes('macro')) return { bg: '#FEF3C7', text: '#78350F', border: '#FDE68A' };
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
      {/* Frosted glass header */}
      <header
        className="sticky top-0 z-40 w-full"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(232,230,225,0.8)',
        }}
      >
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-blink-bg flex items-center justify-center text-blink-muted hover:bg-gray-100 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <div className="flex-1 text-center">
            <h1 className="font-semibold text-base text-blink-ink">Beneficio</h1>
          </div>
          <button
            onClick={handleToggleSave}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
              isSaved ? 'bg-rose-50 text-rose-500' : 'bg-blink-bg text-blink-muted hover:bg-gray-100'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}>
              favorite
            </span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 space-y-4 p-4">
        {/* Store identity row */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0"
            style={{ border: '1px solid #E8E6E1', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            {business.image ? (
              <img alt={business.name} className="w-full h-full object-contain" src={business.image} />
            ) : (
              <span className="font-bold text-xl text-blink-muted">{business.name?.charAt(0)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-base text-blink-ink truncate">{business.name}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full capitalize"
                style={{ background: '#F3F4F6', color: '#374151' }}
              >
                {business.category || 'Comercio'}
              </span>
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: isOnline ? '#EEF2FF' : '#F0FDF4', color: isOnline ? '#4338CA' : '#14532D' }}
              >
                {isOnline ? 'Online' : 'Presencial'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Benefit Card */}
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 4px 24px rgba(99,102,241,0.10)', border: '1.5px solid #c7d2fe' }}
        >
          {/* Top gradient header */}
          <div
            className="px-5 pt-5 pb-6 relative"
            style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' }}
          >
            {/* Bank + subscription row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: bankAccent.bg, color: bankAccent.text, border: `1px solid ${bankAccent.border}` }}
                >
                  {benefit.bankName}
                </span>
                {subscriptionName && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {subscriptionName}
                  </span>
                )}
              </div>
              {validUntilFormatted && (
                <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-white/70 text-blink-muted">
                  Hasta {validUntilFormatted}
                </span>
              )}
            </div>

            {/* Big number */}
            {discount > 0 ? (
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span
                    className="font-bold leading-none"
                    style={{
                      fontSize: 72,
                      background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {discount}%
                  </span>
                  <span className="font-bold text-2xl text-blink-muted mb-1">OFF</span>
                </div>
                {benefit.installments != null && benefit.installments > 0 && (
                  <p className="text-sm font-medium text-blink-muted mt-1">+ {benefit.installments} cuotas sin interés</p>
                )}
              </div>
            ) : benefit.installments && benefit.installments > 0 ? (
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-2">
                  <span
                    className="font-bold leading-none"
                    style={{
                      fontSize: 72,
                      background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {benefit.installments}
                  </span>
                  <span className="font-bold text-xl text-blink-muted mb-1">cuotas</span>
                </div>
                <p className="text-sm font-semibold text-primary mt-1">Sin interés</p>
              </div>
            ) : (
              <p className="text-xl font-bold text-center text-blink-ink leading-snug">{benefit.benefit}</p>
            )}

            {/* Tope */}
            {benefit.tope && (
              <div className="mt-3 text-center">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.70)', color: '#4338CA' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>payments</span>
                  {String(benefit.tope).toUpperCase().includes('SIN TOPE') ? 'Sin tope de reintegro' : `Tope: ${benefit.tope}`}
                </span>
              </div>
            )}
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
                        ? { background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', color: 'white' }
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

          {/* Card info */}
          {benefit.cardName && (
            <div className="px-5 py-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 16 }}>credit_card</span>
              <span className="text-xs text-blink-muted">{String(benefit.cardName)}</span>
            </div>
          )}

          <p className="text-[10px] text-blink-muted px-5 pb-4 italic">
            * Por transacción. Consultá bases legales.
          </p>
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
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', boxShadow: '0 4px 16px rgba(99,102,241,0.30)' }}
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
