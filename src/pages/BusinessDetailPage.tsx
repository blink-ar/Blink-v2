import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Business, BankBenefit } from '../types';
import { fetchBusinessesPaginated } from '../services/api';

function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await fetchBusinessesPaginated({ search: id, limit: 1 });
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
  }, [id]);

  // Sort benefits by discount (highest first)
  const sortedBenefits = useMemo(() => {
    if (!business) return [];
    return [...business.benefits].sort((a, b) => {
      const dA = parseInt(a.rewardRate.match(/(\d+)%/)?.[1] || '0');
      const dB = parseInt(b.rewardRate.match(/(\d+)%/)?.[1] || '0');
      return dB - dA;
    });
  }, [business]);

  const topBenefits = sortedBenefits.slice(0, 2);
  const otherBenefits = sortedBenefits.slice(2);
  const displayedOthers = showAll ? otherBenefits : otherBenefits.slice(0, 3);
  const hiddenCount = otherBenefits.length - 3;

  // Get abbreviated bank name for badge
  const bankAbbr = (name: string) => name.replace(/banco\s*/i, '').substring(0, 6).toUpperCase();

  // Get bank background color
  const bankColor = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('galicia')) return 'bg-orange-500';
    if (lower.includes('santander')) return 'bg-red-600';
    if (lower.includes('bbva')) return 'bg-blue-700';
    if (lower.includes('macro')) return 'bg-yellow-400 text-blink-ink';
    if (lower.includes('nacion')) return 'bg-blue-500';
    if (lower.includes('hsbc')) return 'bg-red-500';
    if (lower.includes('icbc')) return 'bg-red-700';
    if (lower.includes('modo')) return 'bg-purple-600';
    return 'bg-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blink-bg flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blink-ink border-t-primary animate-spin" />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-blink-bg flex flex-col items-center justify-center gap-4">
        <span className="font-display text-2xl uppercase">{error || 'No encontrado'}</span>
        <button onClick={() => navigate(-1)} className="font-mono underline">Volver</button>
      </div>
    );
  }

  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-blink-bg border-b-2 border-blink-ink">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 bg-white border-2 border-blink-ink shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <span className="material-symbols-outlined text-blink-ink" style={{ fontSize: 24 }}>arrow_back</span>
          </button>
          <div className="flex-1 text-center">
            <h1 className="font-display uppercase text-lg tracking-tight">Detalle</h1>
          </div>
          <button className="flex items-center justify-center w-10 h-10 bg-white border-2 border-blink-ink shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
            <span className="material-symbols-outlined text-blink-ink" style={{ fontSize: 24 }}>favorite</span>
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-32 space-y-8">
        {/* Store Info */}
        <section className="flex flex-col items-center gap-4">
          <div className="w-32 h-32 bg-blink-surface border-2 border-blink-ink shadow-hard flex items-center justify-center p-4">
            {business.image ? (
              <img alt={business.name} className="w-full h-full object-contain grayscale" src={business.image} />
            ) : (
              <span className="font-display text-4xl text-blink-muted">{business.name?.charAt(0)}</span>
            )}
          </div>
          <div className="text-center space-y-1">
            <h1 className="font-display text-3xl uppercase leading-none">{business.name}</h1>
            <p className="font-mono text-sm font-bold bg-blink-ink text-white px-2 py-1 inline-block">
              {business.category?.toUpperCase() || 'COMERCIO'}
            </p>
          </div>
          <div className="flex gap-2 font-mono text-xs font-bold">
            <span className="flex items-center gap-1 border-2 border-blink-ink px-2 py-1 bg-white shadow-hard-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full border border-blink-ink" />
              ABIERTO
            </span>
            {business.rating > 0 && (
              <span className="flex items-center gap-1 border-2 border-blink-ink px-2 py-1 bg-white shadow-hard-sm">
                <span className="material-symbols-outlined text-sm">star</span>
                {business.rating.toFixed(1)}
              </span>
            )}
          </div>
        </section>

        {/* Top Benefits */}
        {topBenefits.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-blink-ink pb-2">
              <span className="material-symbols-outlined text-blink-accent">verified</span>
              <h2 className="font-display text-xl uppercase">Mis Beneficios</h2>
            </div>

            {topBenefits.map((benefit, idx) => {
              const discount = benefit.rewardRate.match(/(\d+)%/)?.[1];
              const isFirst = idx === 0;
              return (
                <div
                  key={`${benefit.bankName}-${idx}`}
                  onClick={() => navigate(`/benefit/${business.id}/${business.benefits.indexOf(benefit)}`)}
                  className={`w-full bg-blink-surface border-2 border-blink-ink shadow-hard flex flex-col relative overflow-hidden group active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer`}
                >
                  {isFirst && (
                    <div className="absolute top-0 right-0 bg-primary border-l-2 border-b-2 border-blink-ink px-3 py-1 z-10">
                      <span className="font-display text-xs uppercase">Mejor Opción</span>
                    </div>
                  )}
                  <div className="p-5 border-b-2 border-blink-ink bg-white">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`h-10 w-16 border-2 border-blink-ink flex items-center justify-center ${bankColor(benefit.bankName)} text-white shadow-hard-sm`}>
                        <span className="font-display text-sm tracking-tighter">{bankAbbr(benefit.bankName)}</span>
                      </div>
                      {benefit.cardName && (
                        <span className="font-mono text-xs font-bold bg-gray-200 text-blink-ink px-1 border border-blink-ink">
                          {String(benefit.cardName).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {discount ? (
                        <>
                          <span className={`font-display ${isFirst ? 'text-5xl' : 'text-4xl'} leading-none block text-blink-ink`}>
                            {discount}% OFF
                          </span>
                          {benefit.tope && (
                            <span className="font-display text-xl leading-none block text-blink-accent decoration-2 underline decoration-wavy">
                              {String(benefit.tope).toUpperCase().includes('SIN TOPE') ? 'SIN TOPE' : `TOPE: ${benefit.tope}`}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="font-display text-4xl leading-none block text-blink-ink">
                          {benefit.rewardRate || benefit.benefit}
                        </span>
                      )}
                      {benefit.installments && benefit.installments > 0 && (
                        <span className="font-display text-lg leading-none block text-blink-ink">
                          + {benefit.installments} CUOTAS
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] text-gray-500 uppercase">Días Válidos</span>
                      <span className="font-mono text-sm font-bold uppercase">
                        {benefit.cuando || 'Todos los días'}
                      </span>
                    </div>
                    <button className="bg-blink-ink text-primary border-2 border-transparent hover:border-primary px-3 py-1 font-mono text-xs font-bold uppercase transition-colors">
                      Ver Legales
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Other Benefits */}
        {otherBenefits.length > 0 && (
          <section className="space-y-4 pt-4">
            <div className="flex items-center gap-2 border-b-2 border-blink-ink pb-2">
              <span className="material-symbols-outlined text-blink-ink">savings</span>
              <h2 className="font-display text-xl uppercase">Otros Beneficios</h2>
            </div>
            <div className="grid gap-3">
              {displayedOthers.map((benefit, idx) => {
                const discount = benefit.rewardRate.match(/(\d+)%/)?.[1];
                return (
                  <div
                    key={`other-${benefit.bankName}-${idx}`}
                    onClick={() => navigate(`/benefit/${business.id}/${business.benefits.indexOf(benefit)}`)}
                    className="bg-white border-2 border-blink-ink shadow-hard-sm p-3 flex items-center justify-between active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-12 border-2 border-blink-ink flex items-center justify-center ${bankColor(benefit.bankName)} text-white`}>
                        <span className="font-display text-[10px] tracking-tighter">{bankAbbr(benefit.bankName)}</span>
                      </div>
                      <div>
                        <p className="font-display text-lg leading-none">
                          {discount ? `${discount}% OFF` : benefit.rewardRate || benefit.benefit}
                        </p>
                        <p className="font-mono text-[10px] text-gray-500">
                          {benefit.tope || benefit.condicion || ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs font-bold">{benefit.cuando?.toUpperCase() || 'TODOS'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {!showAll && hiddenCount > 0 && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full py-3 border-2 border-dashed border-blink-ink font-mono text-sm font-bold uppercase hover:bg-gray-100 transition-colors"
              >
                Ver {hiddenCount} beneficios más
              </button>
            )}
          </section>
        )}
      </main>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 w-full z-50 p-4 bg-transparent pointer-events-none flex flex-col justify-end items-center">
        <button
          onClick={() => navigate(`/map?business=${business.id}`)}
          className="pointer-events-auto shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-3 bg-blink-ink text-white w-full max-w-sm justify-center py-4 border-2 border-white hover:bg-blink-ink/90 group"
        >
          <span className="material-symbols-outlined text-primary group-hover:animate-bounce">location_on</span>
          <span className="font-display uppercase tracking-wider text-lg">Ver Ubicación</span>
        </button>
      </div>
    </div>
  );
}

export default BusinessDetailPage;
