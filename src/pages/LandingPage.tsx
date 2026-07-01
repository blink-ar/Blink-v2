import { useEffect, useMemo } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import BusinessResultCard from '../components/BusinessResultCard';
import BottomNav from '../components/neo/BottomNav';
import { SkeletonCard } from '../components/skeletons';
import { fetchBusinessesPaginated } from '../services/api';
import { useSEO } from '../hooks/useSEO';
import { toAbsoluteUrl } from '../seo/seo';
import { getMerchantSeoPath } from '../seo/merchantUrls';
import { SEARCH_PARAMS_KEY } from '../constants/search';
import {
  LANDING_BANKS,
  LANDING_CATEGORIES,
  LANDING_CITIES,
  businessMatchesBank,
  businessMatchesCity,
  getLandingPath,
  getMaxDiscount,
  resolveBank,
  resolveCategory,
  resolveCity,
} from '../seo/landingData';
import { Business } from '../types';

const MAX_PAGES = 5;
const PAGE_SIZE = 100;

function getSearchPath(bankSlug: string, categorySlug: string): string {
  const params = new URLSearchParams({
    bank: bankSlug,
    category: categorySlug,
  });

  return `/search?${params.toString()}`;
}

async function fetchLandingBusinesses(bank: string, category: string): Promise<Business[]> {
  const businesses: Business[] = [];
  const seen = new Set<string>();

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await fetchBusinessesPaginated({
      bank,
      category,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    });

    const pageItems = response.businesses || [];
    for (const business of pageItems) {
      if (!seen.has(business.id)) {
        seen.add(business.id);
        businesses.push(business);
      }
    }

    if (!response.pagination.hasMore) {
      break;
    }
  }

  return businesses;
}

function LandingPage() {
  const { bank: bankSlug, category: categorySlug, city: citySlug } = useParams<{
    bank: string;
    category: string;
    city?: string;
  }>();
  const location = useLocation();

  const bank = resolveBank(bankSlug);
  const category = resolveCategory(categorySlug);
  const city = resolveCity(citySlug);

  const isValidRoute = Boolean(bank && category && (!citySlug || city));

  const { data: businesses = [], isLoading, error } = useQuery({
    queryKey: ['landing', bank?.slug, category?.slug],
    queryFn: () => fetchLandingBusinesses(bank!.slug, category!.slug),
    enabled: Boolean(bank && category),
    staleTime: 1000 * 60 * 15,
  });

  const filteredBusinesses = useMemo(() => {
    if (!bank || !category) return [];

    const byBank = businesses.filter((business) => businessMatchesBank(business, bank));
    const byCity = city ? byBank.filter((business) => businessMatchesCity(business, city)) : byBank;

    return byCity
      .map((business) => ({ business, discount: getMaxDiscount(business) }))
      .sort((a, b) => b.discount - a.discount)
      .map((entry) => entry.business);
  }, [bank, businesses, category, city]);

  const resultCount = filteredBusinesses.length;
  const pageTitle = bank && category
    ? `Descuentos ${bank.name} en ${category.name}${city ? ` en ${city.name}` : ''} | Blink`
    : 'Descuentos bancarios por banco y categoria | Blink';
  const pageDescription = bank && category
    ? `Descubri descuentos y beneficios de ${bank.name} en ${category.name}${city ? ` en ${city.name}` : ' en Argentina'}.`
    : 'Explora descuentos bancarios por banco, categoria y ciudad en Argentina.';

  const currentPath = location.pathname;
  const searchPath = bank && category ? getSearchPath(bank.slug, category.slug) : '/search';
  const faqItems = bank && category ? [
    {
      question: `Como encontrar descuentos de ${bank.name} en ${category.name}?`,
      answer: `Filtra por ${bank.name} y ${category.name} para ver comercios adheridos, condiciones y beneficios vigentes.`,
    },
    {
      question: 'Como saber si un beneficio aplica hoy?',
      answer: 'Revisa la vigencia, los dias de aplicacion y el tope de reintegro en cada beneficio.',
    },
    {
      question: 'Blink sirve para todo Argentina?',
      answer: 'Si. Puedes explorar beneficios por ciudad o a nivel nacional en toda Argentina.',
    },
  ] : [];

  useSEO({
    title: pageTitle,
    description: pageDescription,
    path: currentPath,
    keywords: bank && category
      ? [
          `descuentos ${bank.slug}`,
          `beneficios ${category.slug}`,
          city ? `${category.slug} ${city.slug}` : 'descuentos argentina',
        ]
      : undefined,
    structuredData: bank && category
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: pageTitle,
            description: pageDescription,
            inLanguage: 'es-AR',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: toAbsoluteUrl('/'),
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Descuentos',
                item: toAbsoluteUrl('/search'),
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: `${bank.name} en ${category.name}`,
                item: toAbsoluteUrl(currentPath),
              },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqItems.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
              },
            })),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: filteredBusinesses.slice(0, 10).map((business, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: business.name,
              url: toAbsoluteUrl(getMerchantSeoPath({ id: business.id, name: business.name })),
            })),
          },
        ]
      : undefined,
  });

  useEffect(() => {
    if (!bank || !category) return;
    if (typeof window === 'undefined') return;

    window.sessionStorage.setItem(SEARCH_PARAMS_KEY, searchPath.replace('/search', ''));
  }, [bank, category, searchPath]);

  if (!isValidRoute) {
    return <Navigate to="/search" replace />;
  }

  const relatedCategories = LANDING_CATEGORIES
    .filter((item) => item.slug !== category!.slug)
    .slice(0, 4);
  const relatedBanks = LANDING_BANKS
    .filter((item) => item.slug !== bank!.slug)
    .slice(0, 4);
  const relatedCities = LANDING_CITIES.slice(0, 5);
  const visibleBusinesses = filteredBusinesses.slice(0, 24);
  const resultLabel = resultCount === 1 ? '1 resultado' : `${resultCount} resultados`;

  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col relative overflow-x-hidden">
      <header
        className="sticky top-0 z-40 w-full lg:hidden"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(232,230,225,0.8)',
        }}
      >
        <div className="px-4 py-3 flex items-center gap-2.5">
          <Link
            to="/search"
            aria-label="Volver a busqueda"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-blink-bg text-blink-muted hover:bg-gray-100 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
          </Link>
          <Link
            to={searchPath}
            className="flex-1 h-11 flex items-center px-3 gap-2 rounded-xl min-w-0"
            style={{ background: '#F7F6F4', border: '1px solid #E8E6E1' }}
          >
            <span className="material-symbols-outlined text-blink-muted shrink-0" style={{ fontSize: 18 }}>search</span>
            <span className="flex-1 truncate text-sm text-blink-ink">
              {`${bank!.name} + ${category!.name}${city ? ` + ${city.name}` : ''}`}
            </span>
          </Link>
        </div>

        <div className="w-full overflow-x-auto no-scrollbar pb-3 px-4">
          <div className="flex gap-2 min-w-max items-center">
            <Link
              to={searchPath}
              className="relative flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 bg-primary text-white transition-all duration-150 active:scale-95"
              aria-label="Abrir filtros"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>tune</span>
              <span className="absolute -top-1 -right-1 bg-white text-primary text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                {city ? 3 : 2}
              </span>
            </Link>
            <span className="flex items-center gap-1.5 h-9 rounded-xl bg-primary/10 border border-primary/30 text-primary px-3 text-sm font-semibold">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>account_balance</span>
              {bank!.name}
            </span>
            <span className="flex items-center gap-1.5 h-9 rounded-xl bg-primary/10 border border-primary/30 text-primary px-3 text-sm font-semibold">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>restaurant</span>
              {category!.name}
            </span>
            {city && (
              <span className="flex items-center gap-1.5 h-9 rounded-xl bg-primary/10 border border-primary/30 text-primary px-3 text-sm font-semibold">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>location_on</span>
                {city.name}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-4 px-4 py-5 pb-24 lg:mx-auto lg:w-full lg:max-w-7xl lg:px-8 lg:py-8 lg:pb-12">
        <section
          className="bg-white rounded-2xl p-4 lg:p-8"
          style={{ border: '1px solid #E8E6E1', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary mb-2">
            Descuentos
          </p>
          <h1 className="font-semibold text-xl text-blink-ink leading-tight">
            {`Descuentos ${bank!.name} en ${category!.name}${city ? ` en ${city.name}` : ''}`}
          </h1>
          <p className="text-sm text-blink-muted mt-2 leading-relaxed">
            {pageDescription}
          </p>
          <div className="flex items-center justify-between gap-3 mt-4">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: '#EEF2FF', color: '#4338CA' }}
            >
              {resultLabel}
            </span>
            <Link
              to={searchPath}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary active:scale-95 transition-transform"
            >
              Ver en busqueda
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </Link>
          </div>
        </section>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <SkeletonCard key={idx} />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-white rounded-2xl p-4 text-sm" style={{ border: '1px solid #E8E6E1' }}>
            No se pudo cargar esta landing por ahora.
          </div>
        )}

        {!isLoading && !error && resultCount === 0 && (
          <div className="text-center py-12">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: '#EEF2FF' }}
            >
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 32 }}>search_off</span>
            </div>
            <h2 className="font-semibold text-lg text-blink-ink">Sin resultados por ahora</h2>
            <p className="text-sm text-blink-muted mt-1">
              Prueba otra ciudad o revisa mas categorias y bancos relacionados abajo.
            </p>
          </div>
        )}

        {!isLoading && !error && resultCount > 0 && (
          <section className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-base text-blink-ink">Tiendas</h2>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: '#EEF2FF', color: '#4338CA' }}
              >
                {resultLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {visibleBusinesses.map((business) => (
                <BusinessResultCard
                  key={business.id}
                  business={business}
                  showDistance={false}
                  to={getMerchantSeoPath({ id: business.id, name: business.name })}
                  variant="desktop-card"
                  className="lg:h-full"
                />
              ))}
            </div>

            {resultCount > visibleBusinesses.length && (
              <Link
                to={searchPath}
                className="flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-white text-sm font-semibold active:scale-[0.98] transition-transform"
              >
                Ver todos los resultados
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </Link>
            )}
          </section>
        )}

        <section className="mt-8 pt-8 border-t border-blink-border space-y-6">
          <div>
            <h2 className="font-bold text-sm text-blink-ink mb-3">Categorias relacionadas</h2>
            <div className="flex flex-wrap gap-2">
              {relatedCategories.map((item) => (
                <Link
                  key={item.slug}
                  to={getLandingPath(bank!.slug, item.slug, city?.slug)}
                  className="rounded-xl px-3 py-2 bg-white text-xs font-semibold text-blink-ink"
                  style={{ border: '1px solid #E8E6E1' }}
                >
                  {`Descuentos ${bank!.name} en ${item.name}`}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-bold text-sm text-blink-ink mb-3">Bancos relacionados</h2>
            <div className="flex flex-wrap gap-2">
              {relatedBanks.map((item) => (
                <Link
                  key={item.slug}
                  to={getLandingPath(item.slug, category!.slug, city?.slug)}
                  className="rounded-xl px-3 py-2 bg-white text-xs font-semibold text-blink-ink"
                  style={{ border: '1px solid #E8E6E1' }}
                >
                  {`Descuentos ${item.name} en ${category!.name}`}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-bold text-sm text-blink-ink mb-3">Ciudades populares</h2>
            <div className="flex flex-wrap gap-2">
              {relatedCities.map((item) => (
                <Link
                  key={item.slug}
                  to={getLandingPath(bank!.slug, category!.slug, item.slug)}
                  className="rounded-xl px-3 py-2 bg-white text-xs font-semibold text-blink-ink"
                  style={{ border: '1px solid #E8E6E1' }}
                >
                  {`${category!.name} en ${item.name}`}
                </Link>
              ))}
              {city && (
                <Link
                  to={getLandingPath(bank!.slug, category!.slug)}
                  className="rounded-xl px-3 py-2 bg-primary text-white text-xs font-semibold"
                >
                  {`Ver ${category!.name} en todo Argentina`}
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}

export default LandingPage;
