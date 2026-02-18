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
        // Convert slug back to searchable name (e.g., "burger-king" -> "burger king")
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

    trackViewBenefit({
      source: 'benefit_detail_page',
      benefitId,
      businessId: business.id,
      category: business.category,
      position: benefitPosition + 1,
    });
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
        trackUnsaveBenefit({
          source: 'benefit_detail_page',
          benefitId,
          businessId: business.id,
        });
      } else {
        savedSet.add(benefitId);
        setIsSaved(true);
        trackSaveBenefit({
          source: 'benefit_detail_page',
          benefitId,
          businessId: business.id,
        });
      }

      window.localStorage.setItem(SAVED_BENEFITS_STORAGE_KEY, JSON.stringify(Array.from(savedSet)));
    } catch {
      setIsSaved(false);
    }
  };

  const handleOpenMap = () => {
    if (!business) return;
    trackStartNavigation({
      source: 'benefit_detail_page',
      destinationBusinessId: business.id,
      provider: 'in_app_map',
    });
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
        trackShareBenefit({
          source: 'benefit_detail_page',
          benefitId,
          businessId: business.id,
          channel: 'web_share',
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        trackShareBenefit({
          source: 'benefit_detail_page',
          benefitId,
          businessId: business.id,
          channel: 'clipboard',
        });
        return;
      }

      trackShareBenefit({
        source: 'benefit_detail_page',
        benefitId,
        businessId: business.id,
        channel: 'unsupported',
      });
    } catch (error) {
      const channel = error instanceof DOMException && error.name === 'AbortError' ? 'dismissed' : 'share_error';
      trackShareBenefit({
        source: 'benefit_detail_page',
        benefitId,
        businessId: business.id,
        channel,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blink-ink border-t-primary animate-spin" />
      </div>
    );
  }

  if (error || !business || !benefit) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <span className="font-display text-2xl uppercase">{error || 'No encontrado'}</span>
        <button onClick={() => navigate(-1)} className="font-mono underline">Volver</button>
      </div>
    );
  }

  const subscriptionName = getSubscriptionName(benefit.subscription);

  const discount = parseInt(benefit.rewardRate.match(/(\d+)%/)?.[1] || '0');
  const isOnline = business.hasOnline;

  // Format valid until
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

  // Parse day availability for visual indicators
  const dayAvailability = parseDayAvailabilityFromBenefit(benefit);

  // Build terms text
  const termsText = [
    benefit.condicion,
    benefit.textoAplicacion,
    ...(benefit.requisitos || []),
    ...(benefit.usos || []),
  ].filter(Boolean).join('\n\n');

  // Locations list
  const locations = business.location.filter((l) => l.lat !== 0 || l.lng !== 0);

  return (
    <div className="bg-white text-blink-ink font-body min-h-screen flex flex-col relative overflow-hidden max-w-md mx-auto border-x-2 border-blink-ink">
      {/* Header */}
      <header className="flex justify-between items-center p-4 border-b-2 border-blink-ink bg-white z-10 sticky top-0">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center border-2 border-blink-ink bg-white shadow-hard-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          <span className="material-symbols-outlined font-bold">arrow_back</span>
        </button>
        <div className="font-display tracking-tight text-lg">DETALLE</div>
        <button
          onClick={handleToggleSave}
          className={`w-10 h-10 flex items-center justify-center border-2 border-blink-ink shadow-hard-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${
            isSaved ? 'bg-primary' : 'bg-white'
          }`}
        >
          <span className="material-symbols-outlined font-bold">
            {isSaved ? 'favorite' : 'favorite_border'}
          </span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
        {/* Store Info */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 border-2 border-blink-ink shadow-hard bg-white flex items-center justify-center p-2 mb-4">
            {business.image ? (
              <img alt={business.name} className="w-full h-full object-contain grayscale" src={business.image} />
            ) : (
              <div className="w-full h-full bg-blink-ink flex items-center justify-center text-white font-display text-xs text-center leading-none p-1">
                {business.name}
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold font-display uppercase tracking-tighter">{business.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-blink-accent text-white px-2 py-0.5 text-sm font-bold border-2 border-blink-ink">
              {business.category?.toUpperCase() || 'COMERCIO'}
            </span>
            <span className="bg-blink-warning text-blink-ink px-2 py-0.5 text-sm font-bold border-2 border-blink-ink">
              {isOnline ? 'ONLINE' : 'PRESENCIAL'}
            </span>
          </div>
        </div>

        {/* Main Benefit Card */}
        <div className="border-2 border-blink-ink shadow-hard bg-white p-6 pt-10 text-center relative overflow-hidden">
          {validUntilFormatted && (
            <div className="absolute top-0 right-0 bg-blink-ink text-white px-2 py-1 text-xs font-mono border-b-2 border-l-2 border-blink-ink">
              VÁLIDO HASTA {validUntilFormatted}
            </div>
          )}

          {/* Days of Week */}
          <div className="flex flex-col items-center gap-2 mb-4">
            <span className="text-[10px] font-bold font-mono uppercase text-gray-400">Días de vigencia</span>
            <div className="flex gap-1">
              {BENEFIT_DAYS.map((day) => {
                const isActive = dayAvailability?.allDays || dayAvailability?.[day.key] || false;
                return (
                  <div
                    key={day.key}
                    className={`w-7 h-7 flex items-center justify-center border-2 border-blink-ink font-bold text-xs ${
                      isActive ? 'bg-primary shadow-hard-sm' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {day.abbr}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="font-mono text-xs text-gray-500 uppercase tracking-tight">
              Con {benefit.bankName}
            </span>
            {subscriptionName && (
              <span className="bg-blink-accent text-white px-2 py-0.5 text-[10px] font-bold border-2 border-blink-ink uppercase tracking-tight">
                {subscriptionName}
              </span>
            )}
          </div>
          {discount > 0 ? (
            <>
              <div className="text-6xl font-display tracking-tighter leading-none mb-1">{discount}%</div>
              <div className="text-2xl font-display tracking-tighter uppercase mb-2">DE AHORRO</div>
              {benefit.installments != null && benefit.installments > 0 && (
                <div className="text-lg font-display tracking-tighter uppercase mb-2 text-gray-600">
                  + {benefit.installments} CUOTAS S/INT
                </div>
              )}
            </>
          ) : benefit.installments && benefit.installments > 0 ? (
            <>
              <div className="text-6xl font-display tracking-tighter leading-none mb-1">{benefit.installments}</div>
              <div className="text-2xl font-display tracking-tighter uppercase mb-2">CUOTAS SIN INTERÉS</div>
            </>
          ) : (
            <div className="text-3xl font-display tracking-tighter leading-none mb-2">
              {benefit.benefit}
            </div>
          )}

          {/* Tope de Reintegro + Description */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-0.5 bg-black/10" />
            {benefit.tope && (
              <div className="font-bold text-sm tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">payments</span>
                <span>TOPE DE REINTEGRO: {benefit.tope}</span>
              </div>
            )}
            {benefit.description && (
              <div className="px-2">
                <p className="text-sm font-medium leading-relaxed text-gray-800">
                  {benefit.description}
                </p>
              </div>
            )}
            <div className="w-16 h-0.5 bg-black/10" />
          </div>

          <p className="text-[11px] font-medium text-gray-500 mt-4 leading-tight italic">
            * Por transacción. Consultar bases legales.
          </p>
        </div>

        {/* Savings Simulator */}
        {discount > 0 && (
          <SavingsSimulator
            discountPercentage={discount}
            maxCap={benefit.tope || null}
          />
        )}

        {/* Expandable Sections */}
        <div className="space-y-3">
          <button
            onClick={() => setShowTerms(!showTerms)}
            className="w-full border-2 border-blink-ink bg-white p-3 flex justify-between items-center cursor-pointer active:bg-gray-50 transition-colors"
          >
            <span className="font-bold uppercase text-sm">Términos y Condiciones</span>
            <span className="material-symbols-outlined">
              {showTerms ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          {showTerms && termsText && (
            <div className="border-2 border-blink-ink border-t-0 bg-white p-4 font-mono text-xs whitespace-pre-wrap">
              {termsText}
            </div>
          )}

          <button
            onClick={() => setShowLocations(!showLocations)}
            className="w-full border-2 border-blink-ink bg-white p-3 flex justify-between items-center cursor-pointer active:bg-gray-50 transition-colors"
          >
            <span className="font-bold uppercase text-sm">Sucursales Adheridas</span>
            <span className="material-symbols-outlined">storefront</span>
          </button>
          {showLocations && locations.length > 0 && (
            <div className="border-2 border-blink-ink border-t-0 bg-white p-4 space-y-2">
              {locations.map((loc, i) => (
                <div key={i} className="font-mono text-xs border-b border-gray-200 pb-2 last:border-0">
                  {loc.formattedAddress || loc.name || 'Dirección no disponible'}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t-2 border-blink-ink z-20 flex gap-3 max-w-md mx-auto">
        <button
          onClick={handleOpenMap}
          className="flex-1 bg-primary text-blink-ink font-bold py-4 px-6 text-lg border-2 border-blink-ink shadow-hard active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 uppercase tracking-wide hover:brightness-110"
        >
          <span className="material-symbols-outlined">location_on</span>
          VER UBICACIÓN
        </button>
        <button
          onClick={() => void handleShare()}
          className="w-16 bg-white text-blink-ink font-bold py-4 border-2 border-blink-ink shadow-hard active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center hover:bg-gray-50"
        >
          <span className="material-symbols-outlined">share</span>
        </button>
      </div>
    </div>
  );
}

export default BenefitDetailPage;
