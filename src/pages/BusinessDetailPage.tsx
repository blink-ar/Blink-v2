import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Business, BankBenefit } from '../types';
import { fetchBusinessesPaginated } from '../services/api';
import { trackSelectBusiness, trackStartNavigation, trackViewBenefit } from '../analytics/intentTracking';

const ALL_DAYS = ['lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'sábado', 'sabado', 'domingo'];
const DAY_ABBR: Record<string, string> = {
  lunes: 'Lun', martes: 'Mar', 'miércoles': 'Mié', miercoles: 'Mié',
  jueves: 'Jue', viernes: 'Vie', 'sábado': 'Sáb', sabado: 'Sáb', domingo: 'Dom',
};

const formatCuando = (cuando?: string): string => {
  if (!cuando) return 'Todos los días';
  const lower = cuando.toLowerCase();
  const uniqueDays = new Set(ALL_DAYS.filter((d) => lower.includes(d)).map((d) => DAY_ABBR[d]));
  if (uniqueDays.size >= 7) return 'Todos los días';
  let result = cuando;
  Object.entries(DAY_ABBR).forEach(([full, abbr]) => {
    result = result.replace(new RegExp(full, 'gi'), abbr);
  });
  return result;
};

// Category-specific gradient
const getCategoryGradient = (category: string | undefined) => {
  switch (category) {
    case 'gastronomia': return 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)';
    case 'moda': return 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)';
    case 'viajes': return 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)';
    case 'deportes': return 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)';
    case 'entretenimiento': return 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)';
    case 'electro': return 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)';
    case 'hogar': return 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)';
    default: return 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)';
  }
};

// Bank accent colors (soft versions)
const getBankAccent = (name: string): { bg: string; text: string } => {
  const lower = name.toLowerCase();
  if (lower.includes('galicia')) return { bg: '#FEF3C7', text: '#92400E' };
  if (lower.includes('santander')) return { bg: '#FEE2E2', text: '#991B1B' };
  if (lower.includes('bbva')) return { bg: '#DBEAFE', text: '#1E40AF' };
  if (lower.includes('macro')) return { bg: '#FEF3C7', text: '#78350F' };
  if (lower.includes('nacion')) return { bg: '#DBEAFE', text: '#1D4ED8' };
  if (lower.includes('hsbc')) return { bg: '#FEE2E2', text: '#B91C1C' };
  if (lower.includes('icbc')) return { bg: '#FEE2E2', text: '#991B1B' };
  if (lower.includes('modo')) return { bg: '#EDE9FE', text: '#5B21B6' };
  if (lower.includes('naranja')) return { bg: '#FED7AA', text: '#9A3412' };
  if (lower.includes('ciudad')) return { bg: '#D1FAE5', text: '#065F46' };
  return { bg: '#F3F4F6', text: '#374151' };
};

const bankAbbr = (name: string) => name.replace(/banco\s*/i, '').substring(0, 6).toUpperCase();

function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const passedBusiness = (location.state as { business?: Business } | null)?.business;
  const [business, setBusiness] = useState<Business | null>(passedBusiness || null);
  const [loading, setLoading] = useState(!passedBusiness);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const businessViewSignatureRef = useRef('');

  useEffect(() => {
    if (passedBusiness) return;
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const searchName = id.replace(/-/g, ' ');
        const response = await fetchBusinessesPaginated({ search: searchName, limit: 1 });
        if (response.success && response.businesses.length > 0) {
          setBusiness(response.businesses[0]);
        } else {
          setError('Comercio no encontrado');
        }
      } catch {
        setError('Error al cargar');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, passedBusiness]);

  useEffect(() => {
    if (!business) return;
    const signature = `${business.id}|business_detail`;
    if (businessViewSignatureRef.current === signature) return;
    businessViewSignatureRef.current = signature;
    trackSelectBusiness({ source: 'business_detail_page', businessId: business.id, category: business.category });
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

  const topBenefits = sortedBenefits.slice(0, 2);
  const otherBenefits = sortedBenefits.slice(2);
  const displayedOthers = showAll ? otherBenefits : otherBenefits.slice(0, 3);
  const hiddenCount = otherBenefits.length - 3;

  const handleBenefitSelect = (selectedBenefit: BankBenefit, position: number) => {
    if (!business) return;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-blink-bg flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-blink-border border-t-primary animate-spin" />
      </div>
    );
  }

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

  const categoryGradient = getCategoryGradient(business.category);

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
            <h1 className="font-semibold text-base text-blink-ink">Detalle</h1>
          </div>
          <button className="w-10 h-10 rounded-xl bg-blink-bg flex items-center justify-center text-blink-muted hover:bg-gray-100 transition-colors active:scale-95">
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>favorite_border</span>
          </button>
        </div>
      </header>

      <main className="flex-1 pb-32">
        {/* Hero banner - category gradient */}
        <div
          className="relative overflow-hidden"
          style={{ background: categoryGradient, minHeight: 160 }}
        >
          {business.image && (
            <img
              alt={business.name}
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-20"
              src={business.image}
            />
          )}
          {/* Logo overlapping at bottom */}
          <div className="flex flex-col items-center pt-8 pb-12 px-4 relative">
            <div
              className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center p-2 overflow-hidden"
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.10)', border: '1px solid rgba(232,230,225,0.6)' }}
            >
              {business.image ? (
                <img alt={business.name} className="w-full h-full object-contain" src={business.image} />
              ) : (
                <span className="font-bold text-3xl text-blink-muted">{business.name?.charAt(0)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Store info card - overlaps hero */}
        <div className="px-4 -mt-8 relative z-10">
          <div
            className="bg-white rounded-2xl p-4 text-center"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #E8E6E1' }}
          >
            <h1 className="font-bold text-xl text-blink-ink mb-2">{business.name}</h1>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full capitalize"
                style={{ background: categoryGradient, color: '#374151' }}
              >
                {business.category || 'Comercio'}
              </span>
              <span className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full" style={{ background: '#D1FAE5', color: '#065F46' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Activo
              </span>
              {business.rating > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full" style={{ background: '#FEF3C7', color: '#92400E' }}>
                  <span className="material-symbols-outlined text-amber-500" style={{ fontSize: 14 }}>star</span>
                  {business.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 pt-6 space-y-6">
          {/* Top Benefits */}
          {topBenefits.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-semibold text-base text-blink-ink">Mis beneficios</h2>
                <span className="text-base">✦</span>
              </div>

              {topBenefits.map((benefit, idx) => {
                const discount = benefit.rewardRate.match(/(\d+)%/)?.[1];
                const isFirst = idx === 0;
                const bankAccent = getBankAccent(benefit.bankName);
                return (
                  <div
                    key={`${benefit.bankName}-${idx}`}
                    onClick={() => handleBenefitSelect(benefit, idx + 1)}
                    className="w-full bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.98]"
                    style={{ boxShadow: isFirst ? '0 4px 20px rgba(99,102,241,0.12)' : '0 2px 8px rgba(0,0,0,0.06)', border: isFirst ? '1.5px solid #c7d2fe' : '1px solid #E8E6E1' }}
                  >
                    {/* Card top - colored band */}
                    <div
                      className="px-4 pt-4 pb-5"
                      style={{ background: isFirst ? 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' : '#FAFAFA' }}
                    >
                      {isFirst && (
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary text-white">Mejor opción</span>
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: bankAccent.bg, color: bankAccent.text }}
                          >
                            {bankAbbr(benefit.bankName)}
                          </span>
                        </div>
                      )}
                      {!isFirst && (
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: bankAccent.bg, color: bankAccent.text }}
                          >
                            {bankAbbr(benefit.bankName)}
                          </span>
                          {benefit.cardName && (
                            <span className="text-xs text-blink-muted font-medium">{String(benefit.cardName)}</span>
                          )}
                        </div>
                      )}

                      {discount && parseInt(discount) > 0 ? (
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span
                              className="font-bold leading-none"
                              style={{
                                fontSize: isFirst ? 52 : 40,
                                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                              }}
                            >
                              {discount}%
                            </span>
                            <span className="font-semibold text-blink-muted text-lg">OFF</span>
                          </div>
                          {benefit.tope && (
                            <p className="text-xs font-medium mt-1" style={{ color: '#4338CA' }}>
                              {String(benefit.tope).toUpperCase().includes('SIN TOPE') ? 'Sin tope de reintegro' : `Tope: ${benefit.tope}`}
                            </p>
                          )}
                          {benefit.installments && benefit.installments > 0 && (
                            <p className="text-sm font-medium text-blink-muted mt-0.5">+ {benefit.installments} cuotas s/int.</p>
                          )}
                        </div>
                      ) : benefit.installments && benefit.installments > 0 ? (
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span
                              className="font-bold leading-none"
                              style={{
                                fontSize: isFirst ? 52 : 40,
                                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                              }}
                            >
                              {benefit.installments}
                            </span>
                            <span className="font-semibold text-blink-muted text-lg">cuotas</span>
                          </div>
                          <p className="text-sm font-medium text-primary mt-0.5">Sin interés</p>
                        </div>
                      ) : (
                        <p className="font-semibold text-blink-ink leading-snug">{benefit.benefit}</p>
                      )}
                    </div>

                    {/* Card bottom */}
                    <div className="px-4 py-3 flex justify-between items-center" style={{ borderTop: '1px solid #E8E6E1' }}>
                      <div>
                        <p className="text-[10px] text-blink-muted font-medium uppercase tracking-wide">Disponible</p>
                        <p className="text-sm font-semibold text-blink-ink">{formatCuando(benefit.cuando)}</p>
                      </div>
                      <span
                        className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                        style={{ background: '#EEF2FF', color: '#4338CA' }}
                      >
                        Ver detalles →
                      </span>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* Other Benefits */}
          {otherBenefits.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-semibold text-base text-blink-ink">Más beneficios</h2>
              <div className="space-y-2">
                {displayedOthers.map((benefit, idx) => {
                  const discount = benefit.rewardRate.match(/(\d+)%/)?.[1];
                  const bankAccent = getBankAccent(benefit.bankName);
                  return (
                    <div
                      key={`other-${benefit.bankName}-${idx}`}
                      onClick={() => handleBenefitSelect(benefit, topBenefits.length + idx + 1)}
                      className="bg-white rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-all duration-150 active:scale-[0.98]"
                      style={{ border: '1px solid #E8E6E1', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded-lg"
                          style={{ background: bankAccent.bg, color: bankAccent.text }}
                        >
                          {bankAbbr(benefit.bankName)}
                        </span>
                        <div>
                          <p className="font-semibold text-sm text-blink-ink leading-none">
                            {discount && parseInt(discount) > 0
                              ? `${discount}% OFF`
                              : benefit.installments && benefit.installments > 0
                                ? `${benefit.installments} cuotas s/int.`
                                : benefit.benefit}
                          </p>
                          {benefit.tope && (
                            <p className="text-[10px] text-blink-muted mt-0.5">{benefit.tope}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-blink-muted">{formatCuando(benefit.cuando)}</p>
                        <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 16 }}>chevron_right</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {!showAll && hiddenCount > 0 && (
                <button
                  onClick={() => setShowAll(true)}
                  className="w-full py-3 rounded-2xl text-sm font-medium text-primary transition-colors"
                  style={{ border: '1.5px dashed #c7d2fe', background: '#EEF2FF' }}
                >
                  Ver {hiddenCount} beneficios más
                </button>
              )}
            </section>
          )}
        </div>
      </main>

      {/* Fixed CTA */}
      <div
        className="fixed bottom-0 left-0 w-full z-50 p-4"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid #E8E6E1',
        }}
      >
        <button
          onClick={handleOpenMap}
          className="w-full text-white font-semibold py-4 rounded-2xl text-base transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', boxShadow: '0 4px 16px rgba(99,102,241,0.30)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>location_on</span>
          Ver ubicación
        </button>
      </div>
    </div>
  );
}

export default BusinessDetailPage;
