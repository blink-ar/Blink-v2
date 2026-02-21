import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/neo/BottomNav';
import Ticker from '../components/neo/Ticker';
import CategoryMarquee from '../components/neo/CategoryMarquee';
import { useBenefitsData } from '../hooks/useBenefitsData';
import { Business } from '../types';
import { trackFilterApply, trackSearchIntent, trackViewBenefit } from '../analytics/intentTracking';

function HomePage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { businesses, totalBusinesses, isLoading } = useBenefitsData({});

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = searchTerm.trim();
    if (normalized) {
      trackSearchIntent({
        source: 'home_hero_search',
        searchTerm: normalized,
        resultsCount: 0,
        hasFilters: false,
        activeFilterCount: 0,
      });
      navigate(`/search?q=${encodeURIComponent(normalized)}`);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchFocus = () => {
    navigate('/search');
  };

  const handleQuickCategoryClick = (category: string) => {
    trackFilterApply({
      source: 'home_quick_pill',
      filterType: 'category',
      filterValue: category,
      activeFilterCount: 1,
    });
    navigate(`/search?category=${category}`);
  };

  const handleTopBenefitClick = (
    businessId: string,
    category: string | undefined,
    benefitPosition: number,
    benefitIndex: number,
    business: Business,
  ) => {
    trackViewBenefit({
      source: 'home_top5',
      benefitId: `${businessId}:${benefitIndex}`,
      businessId,
      category,
      position: benefitPosition,
    });
    navigate(`/benefit/${businessId}/${benefitIndex}`, { state: { business } });
  };

  // Top 5 individual benefits by discount
  const top5 = useMemo(() => {
    const allBenefits: { business: Business; benefit: typeof businesses[0]['benefits'][0]; benefitIndex: number; discount: number }[] = [];
    businesses.forEach((business) => {
      business.benefits.forEach((b, bIdx) => {
        const match = String(b.rewardRate).match(/(\d+)%/);
        if (match) {
          allBenefits.push({ business, benefit: b, benefitIndex: bIdx, discount: parseInt(match[1]) });
        }
      });
    });
    return allBenefits
      .sort((a, b) => b.discount - a.discount)
      .slice(0, 5);
  }, [businesses]);

  // Category-specific gradient for bento cards
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

  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col overflow-x-hidden">
      {/* Sticky Header */}
      <header
        className="sticky top-0 z-50 w-full flex flex-col"
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
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-blink-muted hover:bg-blink-bg transition-colors">
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                notifications
              </span>
            </button>
            <div
              className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' }}
            >
              <span className="material-symbols-outlined text-white" style={{ fontSize: 18 }}>
                person
              </span>
            </div>
          </div>
        </div>
        {/* Ticker */}
        <Ticker count={totalBusinesses || 0} />
      </header>

      <main className="flex-1 flex flex-col gap-8 pb-24">
        {/* Hero Section */}
        <section className="px-4 pt-6">
          <h1 className="text-[2rem] font-bold leading-tight text-blink-ink text-center mb-2">
            No pagues<br />
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' }}
            >
              de más.
            </span>
          </h1>
          <p className="text-center text-blink-muted text-sm mb-5">
            Encontrá beneficios de tu banco en segundos
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <div
              className="flex items-center gap-2 px-4 rounded-2xl h-14"
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #E8E6E1',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}
            >
              <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 20 }}>search</span>
              <input
                className="flex-1 bg-transparent text-base text-blink-ink placeholder:text-blink-muted focus:outline-none"
                placeholder="¿Qué buscás? Sushi, Zapas..."
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
              />
              <button
                type="submit"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 transition-all duration-150 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </button>
            </div>
          </form>

          {/* Quick Category Pills */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {[
              { label: '🍔 Gastronomía', category: 'gastronomia', bg: '#FEF3C7', text: '#92400E' },
              { label: '👟 Moda', category: 'moda', bg: '#FCE7F3', text: '#9D174D' },
              { label: '🛒 Supermercado', category: 'shopping', bg: '#F0FDF4', text: '#14532D' },
            ].map((pill) => (
              <button
                key={pill.category}
                onClick={() => handleQuickCategoryClick(pill.category)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 active:scale-95"
                style={{
                  backgroundColor: pill.bg,
                  color: pill.text,
                  border: `1px solid ${pill.text}20`,
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>
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
                    style={{ background: '#F3F4F6' }}
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
                      item.business,
                    )}
                    className="group relative flex-shrink-0 w-[240px] snap-center rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.97]"
                    style={{
                      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                      border: '1px solid #E8E6E1',
                    }}
                  >
                    {/* Gradient header - category color coded */}
                    <div
                      className="h-28 w-full relative overflow-hidden"
                      style={{ background: getCategoryGradient(item.business.category) }}
                    >
                      {item.business.image && (
                        <img
                          alt={item.business.name}
                          className="w-full h-full object-cover mix-blend-overlay opacity-40"
                          src={item.business.image}
                          loading="lazy"
                        />
                      )}
                      {/* Discount badge */}
                      <div className="absolute top-3 left-3">
                        <div
                          className="flex items-baseline gap-0.5 px-2.5 py-1 rounded-xl"
                          style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(8px)' }}
                        >
                          <span className="font-bold text-2xl text-blink-ink leading-none">{item.discount}%</span>
                          <span className="text-xs font-semibold text-blink-muted">OFF</span>
                        </div>
                      </div>
                      {/* Rank */}
                      <div
                        className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.85)' }}
                      >
                        <span className="text-xs font-bold text-blink-ink">#{idx + 1}</span>
                      </div>
                    </div>

                    {/* Card content */}
                    <div className="p-3 bg-white">
                      <h3 className="font-semibold text-sm text-blink-ink truncate mb-0.5">
                        {item.business.name}
                      </h3>
                      <p className="text-xs text-blink-muted truncate mb-2">
                        {item.benefit.bankName} · {item.benefit.cardName}
                      </p>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: '#EEF2FF', color: '#4338CA' }}
                        >
                          {item.benefit.cuando ? String(item.benefit.cuando).substring(0, 15) : 'Disponible hoy'}
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

        {/* Newsletter CTA - Bento style */}
        <section className="px-4">
          <div
            className="p-5 rounded-2xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
              boxShadow: '0 8px 24px rgba(99,102,241,0.25)',
            }}
          >
            {/* Decorative elements */}
            <div
              className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20"
              style={{ background: 'white' }}
            />
            <div
              className="absolute -bottom-8 -left-4 w-20 h-20 rounded-full opacity-10"
              style={{ background: 'white' }}
            />

            <h3 className="font-bold text-xl text-white mb-1 relative">¿Querés más?</h3>
            <p className="text-white/80 text-sm mb-4 relative">
              Recibí las mejores ofertas antes que nadie.
            </p>
            <div className="flex gap-2 relative">
              <input
                className="flex-1 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/60 focus:outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.20)',
                  border: '1px solid rgba(255,255,255,0.30)',
                }}
                placeholder="tu@email.com"
                type="email"
              />
              <button
                className="bg-white text-primary font-semibold px-4 rounded-xl text-sm transition-all duration-150 active:scale-95 whitespace-nowrap"
              >
                Suscribirse
              </button>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

export default HomePage;
