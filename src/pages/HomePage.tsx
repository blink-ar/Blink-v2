import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/neo/BottomNav';
import Ticker from '../components/neo/Ticker';
import CategoryMarquee from '../components/neo/CategoryMarquee';
import { useBenefitsData } from '../hooks/useBenefitsData';
import { Business } from '../types';

function HomePage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { businesses, totalBusinesses, isLoading } = useBenefitsData({});

  // When user types and hits enter or after debounce, navigate to search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchFocus = () => {
    // Navigate to search page on focus for a better mobile UX
    navigate('/search');
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

  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col overflow-x-hidden">
      {/* Sticky Header & Ticker */}
      <header className="sticky top-0 z-50 w-full flex flex-col border-b-2 border-blink-ink bg-blink-surface">
        {/* Top Bar */}
        <div className="h-12 flex items-center justify-between px-4 bg-blink-surface relative z-20">
          <div className="font-display text-2xl tracking-tighter">BLINK</div>
          <div className="flex items-center gap-2">
            <button className="p-1 hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-blink-ink" style={{ fontSize: 24 }}>
                notifications
              </span>
            </button>
            <div className="h-8 w-8 rounded-full border-2 border-blink-ink bg-blink-accent overflow-hidden flex items-center justify-center">
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
        <section className="px-4 pt-8">
          <h1 className="font-display text-[2.5rem] leading-[0.9] text-center mb-6 uppercase tracking-[-0.02em]">
            No pagues<br />
            <span className="bg-primary px-1">de más.</span>
          </h1>

          {/* Mega Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative group">
            <input
              className="w-full h-16 pl-4 pr-16 bg-blink-surface border-2 border-blink-ink shadow-hard text-lg font-bold placeholder:text-blink-muted placeholder:font-normal focus:ring-0 focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all duration-100"
              placeholder="¿Qué buscás? Sushi, Zapas..."
              type="text"
              value={searchTerm}
              onChange={handleSearchChange} 
              onFocus={handleSearchFocus}
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 aspect-square bg-blink-ink text-primary flex items-center justify-center border-2 border-transparent hover:bg-primary hover:text-blink-ink hover:border-blink-ink transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 28 }}>search</span>
            </button>
          </form>

          {/* Quick Pills */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[
              { label: '🍔 Gastronomía', category: 'gastronomia' },
              { label: '👟 Zapatillas', category: 'moda' },
              { label: '🛒 Super', category: 'shopping' },
            ].map((pill) => (
              <button
                key={pill.category}
                onClick={() => navigate(`/search?category=${pill.category}`)}
                className="px-4 py-1.5 rounded-full border-2 border-blink-ink bg-blink-surface text-sm font-bold hover:bg-blink-ink hover:text-white transition-colors shadow-hard-sm active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
              >
                {pill.label}
              </button>
            ))}
          </div>
        </section>

        {/* Top 5 Hoy */}
        <section className="flex flex-col gap-4">
          <div className="px-4 flex items-end justify-between">
            <h2 className="font-display text-xl uppercase flex items-center gap-2">
              Top 5 Hoy <span className="text-2xl">🔥</span>
            </h2>
            <button
              onClick={() => navigate('/search')}
              className="font-mono text-xs underline decoration-2 decoration-blink-accent underline-offset-4 font-bold"
            >
              VER TODO -&gt;
            </button>
          </div>

          {/* Horizontal Scroll */}
          <div className="flex overflow-x-auto no-scrollbar gap-4 px-4 pb-4 snap-x snap-mandatory">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[260px] h-[220px] bg-blink-surface border-2 border-blink-ink shadow-hard animate-pulse" />
                ))
              : top5.map((item, idx) => (
                    <article
                      key={`${item.business.id}-${idx}`}
                      onClick={() => navigate(`/benefit/${item.business.id}/${item.benefitIndex}`, { state: { business: item.business } })}
                      className="group relative flex-shrink-0 w-[260px] snap-center bg-blink-surface border-2 border-blink-ink shadow-hard active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
                    >
                      {/* Image */}
                      <div className="h-32 w-full overflow-hidden border-b-2 border-blink-ink relative bg-gray-100">
                        {item.business.image && (
                          <img
                            alt={item.business.name}
                            className="w-full h-full object-cover grayscale-img"
                            src={item.business.image}
                            loading="lazy"
                          />
                        )}
                        {!item.business.image && (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 font-display text-2xl text-blink-muted">
                            {item.business.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      {/* Content */}
                      <div className="p-3 flex flex-col gap-1">
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col min-w-0 mr-2">
                            <span className="font-bold text-sm leading-tight uppercase truncate">
                              {item.business.name}
                            </span>
                            <span className="text-xs font-mono text-blink-muted truncate">
                              {item.benefit.bankName} · {item.benefit.cardName}
                            </span>
                          </div>
                          <div className="flex flex-col items-end leading-none flex-shrink-0">
                            <span className="font-display text-3xl text-blink-accent">
                              {item.discount}%
                            </span>
                            <span className="font-display text-xs text-blink-ink -mt-1">OFF</span>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t-2 border-dashed border-blink-ink/20 flex justify-between items-center">
                          <span className="text-[10px] font-mono bg-blink-warning px-1 border border-blink-ink">
                            {item.benefit.cuando ? String(item.benefit.cuando).toUpperCase().substring(0, 10) : 'HOY'}
                          </span>
                          <span
                            className="material-symbols-outlined text-blink-ink hover:text-primary cursor-pointer"
                            style={{ fontSize: 20 }}
                          >
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

        {/* Newsletter CTA */}
        <section className="px-4">
          <div className="bg-primary p-4 border-2 border-blink-ink shadow-hard">
            <h3 className="font-display text-2xl uppercase mb-2">¿Querés más?</h3>
            <p className="font-mono text-sm mb-4">
              Suscribite al newsletter y recibí las bombas antes que nadie.
            </p>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-white border-2 border-blink-ink px-3 py-2 font-mono text-sm focus:outline-none focus:ring-0"
                placeholder="TU EMAIL ACÁ"
                type="email"
              />
              <button className="bg-blink-ink text-white px-4 border-2 border-blink-ink hover:bg-white hover:text-blink-ink font-bold uppercase transition-colors">
                OK
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
