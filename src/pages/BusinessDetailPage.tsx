import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Business, BankBenefit } from '../types';
import { fetchBusinessById } from '../services/api';
import { trackSelectBusiness, trackStartNavigation, trackViewBenefit } from '../analytics/intentTracking';
import { useSEO } from '../hooks/useSEO';
import { SkeletonBusinessDetailPage } from '../components/skeletons';

const ALL_DAYS = ['lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'sábado', 'sabado', 'domingo'];
const DAY_ABBR: Record<string, string> = {
  lunes: 'L', martes: 'M', 'miércoles': 'X', miercoles: 'X',
  jueves: 'J', viernes: 'V', 'sábado': 'S', sabado: 'S', domingo: 'D',
};
const DAY_ORDER = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const isAllDays = (cuando?: string): boolean => {
  if (!cuando) return true;
  const lower = cuando.toLowerCase();
  const found = new Set(ALL_DAYS.filter(d => lower.includes(d)).map(d => DAY_ABBR[d]));
  return found.size >= 7;
};

const getActiveDays = (cuando?: string): Set<string> => {
  if (!cuando) return new Set(DAY_ORDER);
  const lower = cuando.toLowerCase();
  return new Set(ALL_DAYS.filter(d => lower.includes(d)).map(d => DAY_ABBR[d]));
};

const getBankAccent = (name: string): { bg: string; text: string } => {
  const lower = name.toLowerCase();
  if (lower.includes('galicia')) return { bg: '#EEF2FF', text: '#4338CA' };
  if (lower.includes('santander')) return { bg: '#FEE2E2', text: '#991B1B' };
  if (lower.includes('bbva')) return { bg: '#DBEAFE', text: '#1E40AF' };
  if (lower.includes('macro')) return { bg: '#FEF3C7', text: '#92400E' };
  if (lower.includes('nacion')) return { bg: '#DBEAFE', text: '#1D4ED8' };
  if (lower.includes('hsbc')) return { bg: '#FEE2E2', text: '#B91C1C' };
  if (lower.includes('icbc')) return { bg: '#FEE2E2', text: '#991B1B' };
  if (lower.includes('modo')) return { bg: '#EDE9FE', text: '#5B21B6' };
  if (lower.includes('naranja')) return { bg: '#FED7AA', text: '#9A3412' };
  if (lower.includes('ciudad')) return { bg: '#D1FAE5', text: '#065F46' };
  if (lower.includes('personal')) return { bg: '#EDE9FE', text: '#5B21B6' };
  if (lower.includes('patagonia')) return { bg: '#DBEAFE', text: '#1E40AF' };
  return { bg: '#F3F4F6', text: '#374151' };
};

const formatDistanceText = (business: Business): string => {
  if (business.distance === undefined || business.distance === null) {
    return business.hasOnline ? 'Online' : '';
  }
  const km = business.distance;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
};

const bankShortName = (name: string) =>
  name.replace(/banco\s*/i, '').trim().substring(0, 8).toUpperCase() || name.substring(0, 8).toUpperCase();

const TODAY_ABBR = (() => {
  const names = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return DAY_ABBR[names[new Date().getDay()]] || '';
})();

const isBenefitAvailableToday = (b: BankBenefit): boolean =>
  isAllDays(b.cuando) || getActiveDays(b.cuando).has(TODAY_ABBR);

const INITIAL_SHOW = 2;

type ViewMode = 'por-beneficio' | 'sucursal' | null;

const BANK_STORAGE_KEY = 'blink.search.selectedBanks';

function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const passedBusiness = (location.state as { business?: Business } | null)?.business;
  const [business, setBusiness] = useState<Business | null>(passedBusiness || null);
  const [loading, setLoading] = useState(!passedBusiness);
  const [error, setError] = useState<string | null>(null);
  const businessViewSignatureRef = useRef('');
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const businessCategory = business?.category?.toLowerCase() || 'comercios';
  const businessBenefitCount = business?.benefits.length || 0;
  const businessPath = id ? `/business/${id}` : '/business';

  const [viewMode, setViewMode] = useState<ViewMode>(null);
  const [filterMyBanks, setFilterMyBanks] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [filterToday, setFilterToday] = useState(false);

  const myBanks = useMemo<string[]>(() => {
    try {
      const stored = localStorage.getItem(BANK_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch { return []; }
  }, []);

  useSEO({
    title: business
      ? `${business.name}: descuentos y beneficios bancarios | Blink`
      : 'Beneficios por comercio | Blink',
    description: business
      ? `${businessBenefitCount} beneficios activos en ${business.name} para ${businessCategory} en Argentina.`
      : 'Consulta descuentos, topes y condiciones por comercio en Blink.',
    path: business ? `/business/${business.id}` : businessPath,
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
    if (passedBusiness) {
      setBusiness(passedBusiness);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      if (!id) {
        setBusiness(null);
        setError('Comercio no encontrado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setBusiness(null);

        const resolvedBusiness = await fetchBusinessById(id);
        if (cancelled) return;

        if (resolvedBusiness) {
          setBusiness(resolvedBusiness);
        } else {
          setError('Comercio no encontrado');
        }
      } catch {
        if (cancelled) return;
        setBusiness(null);
        setError('Error al cargar');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [id, passedBusiness]);

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
    if (!business) return {} as Record<string, BankBenefit[]>;
    return business.benefits.reduce((acc, benefit) => {
      const bank = benefit.bankName;
      if (!acc[bank]) acc[bank] = [];
      acc[bank].push(benefit);
      return acc;
    }, {} as Record<string, BankBenefit[]>);
  }, [business]);

  const sortedBenefits = useMemo(() => {
    if (!business) return [];
    return [...business.benefits].sort((a, b) => {
      const dA = parseInt(a.rewardRate.match(/(\d+)%/)?.[1] || '0');
      const dB = parseInt(b.rewardRate.match(/(\d+)%/)?.[1] || '0');
      if (dB !== dA) return dB - dA;
      return (b.installments || 0) - (a.installments || 0);
    });
  }, [business]);

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
    () => filterToday ? sortedBenefits.filter(isBenefitAvailableToday) : sortedBenefits,
    [sortedBenefits, filterToday],
  );

  const displayedGroupedBenefits = useMemo(() => {
    if (!filterMyBanks || myBanks.length === 0) return filteredGroupedBenefits;
    const result: Record<string, BankBenefit[]> = {};
    for (const [bank, benefits] of Object.entries(filteredGroupedBenefits)) {
      if (myBanks.some(b => bank.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(bank.toLowerCase()))) {
        result[bank] = benefits;
      }
    }
    return result;
  }, [filteredGroupedBenefits, filterMyBanks, myBanks]);

  const displayedSortedBenefits = useMemo(() => {
    if (!filterMyBanks || myBanks.length === 0) return filteredSortedBenefits;
    return filteredSortedBenefits.filter(b =>
      myBanks.some(m => b.bankName.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(b.bankName.toLowerCase()))
    );
  }, [filteredSortedBenefits, filterMyBanks, myBanks]);

  const handleBenefitSelect = (selectedBenefit: BankBenefit, position: number) => {
    if (!business || isScrollingRef.current) return;
    const selectedIndex = business.benefits.indexOf(selectedBenefit);
    if (selectedIndex < 0) return;
    trackViewBenefit({ source: 'business_detail_benefit_list', benefitId: `${business.id}:${selectedIndex}`, businessId: business.id, category: business.category, position });
    navigate(`/benefit/${business.id}/${selectedIndex}`, { state: { business } });
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
        <button onClick={() => navigate(-1)} className="text-primary font-medium text-sm">← Volver</button>
      </div>
    );
  }

  const distanceText = formatDistanceText(business);
  const branchCount = business.location.length;
  const branchLabel = branchCount > 1 ? `${branchCount} sucursales` : branchCount === 1 ? '1 sucursal' : '';

  return (
    <div className="bg-blink-bg text-blink-ink font-body flex flex-col" style={{ height: '100dvh' }}>

      {/* ── Header ── */}
      <header className="bg-white flex-shrink-0" style={{ borderBottom: '1px solid #E8E6E1' }}>

        {/* Top row */}
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-blink-ink" style={{ fontSize: 22 }}>arrow_back</span>
          </button>

          <div
            className="flex-shrink-0 w-[64px] h-[64px] rounded-2xl bg-white flex items-center justify-center overflow-hidden"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.10)', border: '1px solid #E8E6E1' }}
          >
            {business.image ? (
              <img alt={business.name} className="w-full h-full object-contain p-1.5" src={business.image} />
            ) : (
              <span className="font-black text-2xl text-blink-muted">{business.name?.charAt(0)}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-[17px] text-blink-ink leading-tight truncate">{business.name}</h1>
            <p className="text-xs text-blink-muted capitalize mt-0.5">{business.category || 'Comercio'}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-xs font-medium text-blink-muted">{businessBenefitCount} beneficio{businessBenefitCount !== 1 ? 's' : ''} activo{businessBenefitCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors">
              <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 22 }}>notifications</span>
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors">
              <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 22 }}>favorite_border</span>
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors">
              <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 22 }}>more_vert</span>
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="w-full overflow-x-auto no-scrollbar py-3 px-4" style={{ borderTop: '1px solid #E8E6E1' }}>
          <div className="flex gap-2 min-w-max items-center">
            <button
              onClick={() => setFilterMyBanks(f => !f)}
              className={`flex items-center h-9 gap-1.5 px-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 ${
                filterMyBanks
                  ? 'bg-primary text-white'
                  : 'bg-blink-bg border border-blink-border text-blink-ink'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>
              Mis beneficios
            </button>
            <button
              onClick={() => setViewMode(v => v === 'por-beneficio' ? null : 'por-beneficio')}
              className={`flex items-center h-9 gap-1.5 px-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 ${
                viewMode === 'por-beneficio'
                  ? 'bg-primary text-white'
                  : 'bg-blink-bg border border-blink-border text-blink-ink'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
              Por beneficio
            </button>
            <button
              onClick={() => setViewMode(v => v === 'sucursal' ? null : 'sucursal')}
              className={`flex items-center h-9 gap-1.5 px-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 ${
                viewMode === 'sucursal'
                  ? 'bg-primary text-white'
                  : 'bg-blink-bg border border-blink-border text-blink-ink'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>storefront</span>
              Sucursal
            </button>
            <button
              onClick={() => setFilterToday(f => !f)}
              className={`flex items-center h-9 gap-1.5 px-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 ${
                filterToday
                  ? 'bg-primary text-white'
                  : 'bg-blink-bg border border-blink-border text-blink-ink'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>today</span>
              Hoy
            </button>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main
        ref={containerRef}
        className="flex-1 pb-4"
        style={{ overflowY: 'auto', overscrollBehavior: 'contain' }}
      >

        {/* Grouped by bank — default view */}
        {viewMode !== 'por-beneficio' && viewMode !== 'sucursal' && (
          <div className="space-y-3 pt-3 px-4">
            {Object.entries(displayedGroupedBenefits).map(([bankName, bankBenefits]) => {
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
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                      style={{ background: accent.text }}
                    >
                      {bankShortName(bankName).substring(0, 2)}
                    </div>
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

                            {(distanceText || branchLabel) && (
                              <div className="flex items-center gap-1 mb-1">
                                <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 12 }}>location_on</span>
                                <span className="text-xs text-blink-muted">
                                  {[distanceText, branchLabel].filter(Boolean).join(' • ')}
                                </span>
                              </div>
                            )}

                            {benefit.cardName && (
                              <p className="text-xs text-blink-muted mb-2">{benefit.cardName}</p>
                            )}

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                                style={{ background: accent.bg, color: accent.text }}
                              >
                                {bankShortName(bankName)}
                              </span>

                              {allDays ? (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide"
                                  style={{ border: '1px solid #DC2626', color: '#DC2626' }}
                                >
                                  Todos los días
                                </span>
                              ) : activeDays.size > 0 ? (
                                <div className="flex gap-0.5">
                                  {DAY_ORDER.map(d => (
                                    <span
                                      key={d}
                                      className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[8px] font-bold"
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
                      style={{ color: '#DC2626', borderTop: '1px solid #E8E6E1' }}
                    >
                      Ver otros {hiddenCount} beneficio{hiddenCount !== 1 ? 's' : ''} ↓
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Por beneficio — flat sorted list */}
        {viewMode === 'por-beneficio' && (
          <div className="space-y-2 pt-3 px-4">
            {displayedSortedBenefits.map((benefit, idx) => {
              const discount = benefit.rewardRate.match(/(\d+)%/)?.[1];
              const hasDiscount = !!(discount && parseInt(discount) > 0);
              const hasInstallments = !hasDiscount && (benefit.installments ?? 0) > 0;
              const accent = getBankAccent(benefit.bankName);
              const benefitIdx = business.benefits.indexOf(benefit);

              return (
                <div
                  key={`flat-${idx}`}
                  onClick={() => { if (benefitIdx >= 0) handleBenefitSelect(benefit, idx + 1); }}
                  className="bg-white rounded-xl px-4 py-3.5 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
                  style={{ border: '1px solid #E8E6E1', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0"
                      style={{ background: accent.bg, color: accent.text }}
                    >
                      {bankShortName(benefit.bankName)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-blink-ink leading-tight truncate">
                        {benefit.benefit || benefit.cardName}
                      </p>
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

        {/* Sucursal — map CTA */}
        {viewMode === 'sucursal' && (
          <div className="flex flex-col items-center gap-5 pt-14 px-6">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 40 }}>map</span>
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg text-blink-ink mb-1">
                {branchCount} sucursal{branchCount !== 1 ? 'es' : ''}
              </h3>
              <p className="text-sm text-blink-muted">Encontrá la sucursal más cercana</p>
            </div>
            <button
              onClick={handleOpenMap}
              className="w-full text-white font-semibold py-4 rounded-2xl text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)', boxShadow: '0 4px 16px rgba(99,102,241,0.30)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>location_on</span>
              Ver en el mapa
            </button>
          </div>
        )}

      </main>
    </div>
  );
}

export default BusinessDetailPage;
