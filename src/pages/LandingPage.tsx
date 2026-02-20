import { useMemo } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchBusinessesPaginated } from '../services/api';
import { useSEO } from '../hooks/useSEO';
import { toAbsoluteUrl } from '../seo/seo';
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

    if (!response.pagination.hasMore || pageItems.length === 0) {
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
                item: toAbsoluteUrl('/home'),
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
              url: toAbsoluteUrl(`/business/${business.id}`),
            })),
          },
        ]
      : undefined,
  });

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

  return (
    <div className="bg-blink-bg text-blink-ink min-h-screen font-body">
      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/search" className="font-mono text-sm underline">
            Volver a busqueda
          </Link>
          <h1 className="font-display text-3xl sm:text-4xl uppercase mt-4 leading-tight">
            {`Descuentos ${bank!.name} en ${category!.name}${city ? ` en ${city.name}` : ''}`}
          </h1>
          <p className="font-mono text-sm mt-3 max-w-3xl">
            {pageDescription}
          </p>
          <p className="font-mono text-xs mt-2 bg-primary inline-block px-2 py-1 border-2 border-blink-ink">
            {resultCount} comercios encontrados
          </p>
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-36 border-2 border-blink-ink bg-blink-surface animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="border-2 border-blink-ink bg-white p-4 font-mono text-sm">
            No se pudo cargar esta landing por ahora.
          </div>
        )}

        {!isLoading && !error && resultCount === 0 && (
          <div className="border-2 border-blink-ink bg-white p-5">
            <h2 className="font-display text-xl uppercase mb-2">Sin resultados por ahora</h2>
            <p className="font-mono text-sm">
              Prueba otra ciudad o revisa mas categorias y bancos relacionados abajo.
            </p>
          </div>
        )}

        {!isLoading && !error && resultCount > 0 && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBusinesses.slice(0, 24).map((business) => (
              <Link
                key={business.id}
                to={`/business/${business.id}`}
                className="border-2 border-blink-ink bg-white shadow-hard-sm p-4 hover:bg-blink-surface transition-colors"
              >
                <p className="font-display text-lg uppercase leading-tight">{business.name}</p>
                <p className="font-mono text-xs mt-2 uppercase text-blink-muted">
                  {business.category || category!.name}
                </p>
                <p className="font-display text-2xl mt-3">
                  {getMaxDiscount(business) > 0 ? `Hasta ${getMaxDiscount(business)}% OFF` : `${business.benefits.length} beneficios`}
                </p>
              </Link>
            ))}
          </section>
        )}

        <section className="mt-10 space-y-6">
          <div>
            <h2 className="font-display text-xl uppercase mb-3">Categorias relacionadas</h2>
            <div className="flex flex-wrap gap-2">
              {relatedCategories.map((item) => (
                <Link
                  key={item.slug}
                  to={getLandingPath(bank!.slug, item.slug, city?.slug)}
                  className="border-2 border-blink-ink px-3 py-1 bg-white font-mono text-xs uppercase"
                >
                  {`Descuentos ${bank!.name} en ${item.name}`}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl uppercase mb-3">Bancos relacionados</h2>
            <div className="flex flex-wrap gap-2">
              {relatedBanks.map((item) => (
                <Link
                  key={item.slug}
                  to={getLandingPath(item.slug, category!.slug, city?.slug)}
                  className="border-2 border-blink-ink px-3 py-1 bg-white font-mono text-xs uppercase"
                >
                  {`Descuentos ${item.name} en ${category!.name}`}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl uppercase mb-3">Ciudades populares</h2>
            <div className="flex flex-wrap gap-2">
              {relatedCities.map((item) => (
                <Link
                  key={item.slug}
                  to={getLandingPath(bank!.slug, category!.slug, item.slug)}
                  className="border-2 border-blink-ink px-3 py-1 bg-white font-mono text-xs uppercase"
                >
                  {`${category!.name} en ${item.name}`}
                </Link>
              ))}
              {city && (
                <Link
                  to={getLandingPath(bank!.slug, category!.slug)}
                  className="border-2 border-blink-ink px-3 py-1 bg-primary font-mono text-xs uppercase"
                >
                  {`Ver ${category!.name} en todo Argentina`}
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LandingPage;
