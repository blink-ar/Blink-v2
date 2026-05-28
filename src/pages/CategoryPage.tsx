import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import BottomNav from '../components/neo/BottomNav';
import { useSEO } from '../hooks/useSEO';
import { fetchBusinessesPaginated } from '../services/api';
import { getCategorySeoPath, resolveSeoCategory, type SeoCategoryLink } from '../seo/categoryPages';
import { getMerchantSeoPath } from '../seo/merchantUrls';
import { getOptimizedImageUrl } from '../utils/images';

const PAGE_SIZE = 50;

function parsePage(value: string | undefined): number {
  const parsed = Number.parseInt(value || '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function getBenefitSummary(business: { benefits?: Array<{ rewardRate?: string | null; bankName?: string | null }> }): string {
  const firstBenefit = business.benefits?.[0];
  const reward = firstBenefit?.rewardRate;
  const bank = firstBenefit?.bankName;
  return [reward, bank].filter(Boolean).join(' con ') || 'Beneficios bancarios';
}

function CategoryPageContent({ category, page }: { category: SeoCategoryLink; page: number }) {
  const canonicalPath = getCategorySeoPath(category, page);
  const searchPath = `/search?category=${encodeURIComponent(category.category)}`;

  useSEO({
    title: page > 1
      ? `Comercios de ${category.label} con descuentos - pagina ${page} | Blink`
      : `Comercios de ${category.label} con descuentos | Blink`,
    description: `Explora comercios de ${category.label.toLowerCase()} con descuentos y promociones bancarias en Argentina.`,
    path: canonicalPath,
    keywords: [
      `descuentos ${category.label.toLowerCase()}`,
      `promociones ${category.label.toLowerCase()}`,
      'beneficios bancarios',
    ],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['category-page', category.category, page],
    queryFn: () => fetchBusinessesPaginated({
      category: category.category,
      includeExpired: true,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    staleTime: 1000 * 60 * 10,
  });

  const businesses = data?.businesses ?? [];
  const total = data?.pagination?.total ?? 0;
  const hasMore = Boolean(data?.pagination?.hasMore);

  return (
    <div className="min-h-screen bg-blink-bg text-blink-ink font-body pb-28">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-blink-border">
        <div className="h-14 px-4 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg tracking-tight">Blink</Link>
          <Link
            to={searchPath}
            className="h-9 px-3 rounded-full bg-blink-ink text-white text-sm font-semibold flex items-center justify-center"
          >
            Abrir filtros
          </Link>
        </div>
      </header>

      <main className="px-4 pt-6 flex flex-col gap-6">
        <section className="rounded-[24px] bg-white border border-blink-border p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-primary mb-2">
            Comercios por categoria
          </p>
          <h1 className="text-3xl font-bold leading-tight">
            Comercios de {category.label} con descuentos
          </h1>
          <p className="mt-3 text-sm leading-6 text-blink-muted">
            {category.description}. Encontra comercios con beneficios bancarios, cuotas y promociones en Blink.
          </p>
          <div className="mt-4 flex items-center gap-3 text-sm">
            <Link to={searchPath} className="font-semibold text-primary underline underline-offset-4">
              Ver en buscador
            </Link>
            {total > 0 && (
              <span className="text-blink-muted">
                {total.toLocaleString('es-AR')} comercios
              </span>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">Listado de comercios</h2>
            {page > 1 && <span className="text-xs font-semibold text-blink-muted">Pagina {page}</span>}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-24 rounded-2xl bg-white border border-blink-border animate-pulse" />
              ))}
            </div>
          ) : (
            <ol className="grid grid-cols-1 gap-3 list-none p-0 m-0">
              {businesses.map((business) => (
                <li key={business.id}>
                  <Link
                    to={getMerchantSeoPath({ id: business.id, name: business.name })}
                    className="block rounded-2xl bg-white border border-blink-border p-4 shadow-sm active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blink-bg overflow-hidden flex items-center justify-center shrink-0">
                        {business.image ? (
                          <img src={getOptimizedImageUrl(business.image, { width: 96 })} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-xl">{category.emoji}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base truncate">{business.name}</h3>
                        <p className="mt-1 text-sm text-blink-muted truncate">
                          {getBenefitSummary(business)}
                        </p>
                        <p className="mt-1 text-xs text-blink-muted">
                          {business.benefits.length.toLocaleString('es-AR')} beneficios publicados
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 20 }}>
                        chevron_right
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}

          {!isLoading && businesses.length === 0 && (
            <div className="rounded-2xl bg-white border border-blink-border p-5 text-sm text-blink-muted">
              Todavia no hay comercios publicados para esta categoria.
            </div>
          )}

          {!isLoading && (page > 1 || hasMore) && (
            <nav className="flex items-center justify-between pt-2" aria-label="Paginacion de comercios">
              {page > 1 ? (
                <Link className="font-semibold text-primary" to={getCategorySeoPath(category, page - 1)}>
                  Anterior
                </Link>
              ) : (
                <span className="font-semibold text-blink-muted">Anterior</span>
              )}
              <span className="text-sm font-semibold text-blink-muted">Pagina {page}</span>
              {hasMore ? (
                <Link className="font-semibold text-primary" to={getCategorySeoPath(category, page + 1)}>
                  Siguiente
                </Link>
              ) : (
                <span className="font-semibold text-blink-muted">Siguiente</span>
              )}
            </nav>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function CategoryPage() {
  const { category: categoryParam, page: pageParam } = useParams<{ category?: string; page?: string }>();
  const category = resolveSeoCategory(categoryParam);
  const page = parsePage(pageParam);

  if (!category) {
    return <Navigate to="/search" replace />;
  }

  const requestedPath = pageParam
    ? `/categorias/${categoryParam}/page/${pageParam}`
    : `/categorias/${categoryParam}`;
  const canonicalPath = getCategorySeoPath(category, page);
  if (requestedPath !== canonicalPath) {
    return <Navigate to={canonicalPath} replace />;
  }

  return <CategoryPageContent category={category} page={page} />;
}

export default CategoryPage;
