import { type FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import BottomNav from '../components/neo/BottomNav';
import { fetchBanks, fetchBusinessesPaginated, fetchMongoStats } from '../services/api';
import { Business } from '../types';
import { buildBankOptions } from '../utils/banks';
import { getBenefitProviderDisplayName } from '../utils/benefitDisplay';
import { getOptimizedImageUrl } from '../utils/images';
import { HOME_CATEGORY_LINKS, HOME_DISCOUNT_LINKS } from '../seo/homeSeoLinks';

const DIRECT_DEFINITION =
  'Blink es un buscador de descuentos bancarios en Argentina para comparar promociones, bancos, billeteras, topes, días, cuotas y disponibilidad online o presencial antes de pagar. Reúne beneficios públicos de comercios y emisores para que puedas decidir dónde comprar y qué medio de pago usar.';

const QUICK_FILTERS = [
  { label: '20%+ OFF', icon: 'percent', path: '/search?discount=20' },
  { label: 'Cuotas sin interés', icon: 'credit_card', path: '/search?installments=1' },
  { label: 'Online', icon: 'language', path: '/search?online=1' },
  { label: 'Cerca tuyo', icon: 'near_me', path: '/search?nearby=1' },
];

const GUIDE_STEPS = [
  {
    icon: 'search',
    title: 'Busca por comercio, banco o rubro',
    text: 'Escribe una marca, elige un emisor o entra por categorías como gastronomía, supermercado, moda, viajes y hogar.',
  },
  {
    icon: 'rule',
    title: 'Compara condiciones reales',
    text: 'Revisa descuento, tope, días, cuotas, tarjetas elegibles, vigencia y si aplica online, presencial o por ubicación.',
  },
  {
    icon: 'payments',
    title: 'Elige cómo pagar',
    text: 'Antes de comprar, cruza las opciones disponibles y usa el medio de pago que mejor se ajusta a esa compra.',
  },
];

const COMPARISON_ROWS = [
  {
    criterion: 'Búsqueda por comercio, banco y rubro',
    blink: 'Sí, orientada a comparar antes de pagar.',
    modo: 'Principalmente beneficios dentro de su ecosistema.',
    promoarg: 'Foco en promociones publicadas por banco/rubro.',
    clash: 'Foco en descubrimiento y comunidad de descuentos.',
    banks: 'Cada banco muestra sus propios beneficios.',
  },
  {
    criterion: 'Comparación de topes, días y cuotas',
    blink: 'Sí, cuando esos datos están disponibles en la fuente.',
    modo: 'Disponible según la promoción dentro de la app.',
    promoarg: 'Depende de la información cargada en cada promo.',
    clash: 'Depende del contenido publicado.',
    banks: 'Suele estar completo para ese banco, no entre bancos.',
  },
  {
    criterion: 'Vista multi-banco antes de pagar',
    blink: 'Sí, cruza bancos, billeteras y comercios en una búsqueda.',
    modo: 'Limitada a medios y comercios de su experiencia.',
    promoarg: 'Lista promociones por banco y comercio.',
    clash: 'Agrupa oportunidades y descuentos publicados.',
    banks: 'No compara con otros bancos.',
  },
  {
    criterion: 'Mejor uso',
    blink: 'Decidir dónde comprar o con qué medio pagar.',
    modo: 'Usar beneficios dentro del flujo de pago MODO.',
    promoarg: 'Consultar promociones por entidad o categoría.',
    clash: 'Descubrir descuentos y oportunidades compartidas.',
    banks: 'Confirmar términos finales del emisor.',
  },
];

const FAQ_ITEMS = [
  {
    question: '¿Dónde buscar descuentos bancarios hoy?',
    answer:
      'Puedes usar Blink para buscar descuentos bancarios por comercio, banco, billetera, rubro, ubicación, descuento mínimo, cuotas y modalidad online o presencial. La búsqueda te ayuda a comparar opciones antes de pagar.',
  },
  {
    question: '¿Cómo comparar promociones antes de pagar?',
    answer:
      'Compara el porcentaje de descuento, el tope de reintegro, los días de vigencia, las cuotas disponibles, las tarjetas elegibles y las condiciones de cada beneficio. Después elige el medio de pago que mejor aplica a esa compra.',
  },
  {
    question: '¿Blink reemplaza revisar las condiciones del banco?',
    answer:
      'No. Blink organiza información pública para facilitar la comparación, pero las condiciones finales siempre dependen del banco, billetera, comercio o programa que emite cada promoción.',
  },
  {
    question: '¿Se puede buscar por banco, comercio o rubro?',
    answer:
      'Sí. Blink permite iniciar la búsqueda por marcas, bancos, billeteras y categorías como gastronomía, supermercado, moda, hogar, belleza, deportes, viajes y otros rubros.',
  },
];

const FEATURED_CATEGORY_LINKS = HOME_CATEGORY_LINKS.slice(0, 6);
const FEATURED_DISCOUNT_LINKS = HOME_DISCOUNT_LINKS.slice(0, 6);

function formatCount(value: unknown, fallback: string) {
  const numberValue = Number(value || 0);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return fallback;
  return Math.round(numberValue).toLocaleString('es-AR');
}

function hasPositiveCount(value: unknown) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) && numberValue > 0;
}

function countItems(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function getBusinessBenefitLabel(business: Business) {
  const benefit = business.benefits[0];
  if (!benefit) return business.category || 'Beneficio disponible';

  const provider = getBenefitProviderDisplayName(benefit);
  const reward = benefit.rewardRate || benefit.benefit;
  return [provider, reward].filter(Boolean).join(' - ');
}

function buildSearchPath(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return '/search';

  const params = new URLSearchParams({ q: trimmed });
  return `/search?${params.toString()}`;
}

function ProofCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  tone: { bg: string; color: string };
}) {
  return (
    <div className="rounded-2xl border border-blink-border bg-white p-4 shadow-soft lg:p-5">
      <span
        className="flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ background: tone.bg, color: tone.color }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
      </span>
      <p className="mt-4 text-2xl font-black text-blink-ink lg:text-3xl">{value}</p>
      <p className="mt-1 text-sm font-semibold text-blink-muted">{label}</p>
    </div>
  );
}

function DiscountSearchGuidePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const { data: statsResponse } = useQuery({
    queryKey: ['discount-search-guide-stats'],
    queryFn: fetchMongoStats,
    staleTime: 1000 * 60 * 15,
  });
  const { data: availableBanks = [] } = useQuery({
    queryKey: ['discount-search-guide-banks'],
    queryFn: fetchBanks,
    staleTime: 1000 * 60 * 30,
  });
  const { data: merchantResponse, isLoading: isMerchantLoading } = useQuery({
    queryKey: ['discount-search-guide-merchants'],
    queryFn: () => fetchBusinessesPaginated({ limit: 6, offset: 0 }),
    staleTime: 1000 * 60 * 10,
  });

  const allBankOptions = useMemo(() => buildBankOptions(availableBanks), [availableBanks]);
  const bankOptions = allBankOptions.slice(0, 10);
  const merchantExamples = merchantResponse?.businesses?.slice(0, 6) ?? [];
  const stats = statsResponse?.stats;
  const benefitCount = formatCount(stats?.totalBenefits, 'Actualizando');
  const hasChannelStats = hasPositiveCount(stats?.onlineBenefits) || hasPositiveCount(stats?.physicalBenefits);
  const onlineCount = formatCount(stats?.onlineBenefits, '0');
  const physicalCount = formatCount(stats?.physicalBenefits, '0');
  const channelCount = hasChannelStats ? `${onlineCount} / ${physicalCount}` : 'Actualizando';
  const topBankCount = countItems(stats?.topBanks);
  const topCategoryCount = countItems(stats?.topCategories);
  const bankCount = formatCount(allBankOptions.length || topBankCount, 'Actualizando');
  const categoryCount = formatCount(topCategoryCount, 'Actualizando');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate(buildSearchPath(query));
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-blink-bg font-body text-blink-ink">
      <header
        className="sticky top-0 z-40 border-b border-blink-border bg-white/95 backdrop-blur-xl lg:hidden"
      >
        <div className="flex h-14 items-center gap-2 px-4">
          <Link
            to="/"
            aria-label="Volver al inicio"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-blink-bg text-blink-muted transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-blink-ink">Buscador de descuentos</p>
            <p className="truncate text-xs font-semibold text-blink-muted">Comparar antes de pagar</p>
          </div>
          <Link
            to="/search"
            aria-label="Abrir buscador"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 21 }}>search</span>
          </Link>
        </div>
      </header>

      <main className="pb-28 lg:pb-14">
        <section className="border-b border-blink-border bg-white">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:px-8 lg:py-12">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-primary">Guía de compra</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight text-blink-ink lg:text-6xl">
                Buscador de descuentos bancarios en Argentina
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-blink-muted lg:text-lg lg:leading-8">
                {DIRECT_DEFINITION}
              </p>

              <form
                role="search"
                onSubmit={handleSubmit}
                className="mt-7 flex min-h-14 items-center gap-2 rounded-2xl border border-blink-border bg-blink-bg p-2 shadow-soft lg:max-w-3xl"
              >
                <span className="material-symbols-outlined ml-2 shrink-0 text-blink-muted" style={{ fontSize: 23 }}>
                  search
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-base text-blink-ink placeholder-blink-muted focus:outline-none"
                  placeholder="Ej: supermercado Galicia, zapatillas, café"
                  type="search"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-white transition-colors hover:bg-primary/90 active:scale-[0.98]"
                >
                  Buscar
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                </button>
              </form>

              <div className="mt-4 flex flex-wrap gap-2">
                {QUICK_FILTERS.map((filter) => (
                  <Link
                    key={filter.path}
                    to={filter.path}
                    className="flex h-10 items-center gap-2 rounded-xl border border-blink-border bg-white px-3 text-sm font-bold text-blink-ink transition-colors hover:border-primary/30 hover:bg-primary/5"
                  >
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>
                      {filter.icon}
                    </span>
                    {filter.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 self-start">
              <ProofCard icon="sell" label="Beneficios activos" value={benefitCount} tone={{ bg: '#EEF2FF', color: '#4338CA' }} />
              <ProofCard icon="storefront" label="Online / presencial" value={channelCount} tone={{ bg: '#F0FDF4', color: '#166534' }} />
              <ProofCard icon="account_balance" label="Emisores disponibles" value={bankCount} tone={{ bg: '#FCE7F3', color: '#9D174D' }} />
              <ProofCard icon="category" label="Rubros para explorar" value={categoryCount} tone={{ bg: '#DBEAFE', color: '#1D4ED8' }} />
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-7 lg:px-8 lg:py-10">
          <div className="grid gap-4 lg:grid-cols-3">
            {GUIDE_STEPS.map((step, index) => (
              <article key={step.title} className="rounded-2xl border border-blink-border bg-white p-5 shadow-soft">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{step.icon}</span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-[0.1em] text-blink-muted">
                    Paso {index + 1}
                  </span>
                </div>
                <h2 className="mt-5 text-lg font-black text-blink-ink">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-blink-muted">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-blink-border bg-white">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-7 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)] lg:px-8 lg:py-10">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-blink-muted">Comparar opciones</p>
              <h2 className="mt-2 text-2xl font-black text-blink-ink lg:text-3xl">
                Blink no reemplaza a tu banco: te ayuda a comparar antes.
              </h2>
              <p className="mt-3 text-sm leading-6 text-blink-muted lg:max-w-2xl">
                Las páginas de bancos y billeteras siguen siendo la fuente final de condiciones. Blink sirve para el paso previo: encontrar alternativas, entender topes y ver qué comercio o medio de pago conviene revisar.
              </p>
            </div>

            <div className="rounded-2xl border border-blink-border bg-blink-bg p-4">
              <p className="text-sm font-black text-blink-ink">Emisores disponibles en Blink</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {bankOptions.length > 0 ? bankOptions.map((bank) => (
                  <Link
                    key={bank.token}
                    to={`/search?bank=${bank.token}`}
                    className="rounded-xl border border-blink-border bg-white px-3 py-2 text-xs font-black text-blink-muted transition-colors hover:border-primary/30 hover:text-blink-ink"
                  >
                    {bank.label}
                  </Link>
                )) : (
                  <p className="text-sm font-semibold text-blink-muted">
                    Cargando bancos y billeteras disponibles.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-7xl px-4 pb-8 lg:px-8 lg:pb-10">
            <div className="overflow-hidden rounded-2xl border border-blink-border shadow-soft">
              <div className="overflow-x-auto">
                <table className="min-w-[920px] divide-y divide-blink-border bg-white text-sm">
                  <caption className="sr-only">Comparación neutral de buscadores y fuentes de descuentos bancarios</caption>
                  <thead className="bg-blink-bg text-left text-xs font-black uppercase tracking-[0.08em] text-blink-muted">
                    <tr>
                      <th scope="col" className="px-4 py-3">Criterio</th>
                      <th scope="col" className="px-4 py-3 text-blink-ink">Blink</th>
                      <th scope="col" className="px-4 py-3">MODO</th>
                      <th scope="col" className="px-4 py-3">PromoArg</th>
                      <th scope="col" className="px-4 py-3">Clash</th>
                      <th scope="col" className="px-4 py-3">Páginas de bancos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blink-border">
                    {COMPARISON_ROWS.map((row) => (
                      <tr key={row.criterion}>
                        <th scope="row" className="px-4 py-4 text-left font-black text-blink-ink">{row.criterion}</th>
                        <td className="px-4 py-4 font-semibold text-blink-ink">{row.blink}</td>
                        <td className="px-4 py-4 text-blink-muted">{row.modo}</td>
                        <td className="px-4 py-4 text-blink-muted">{row.promoarg}</td>
                        <td className="px-4 py-4 text-blink-muted">{row.clash}</td>
                        <td className="px-4 py-4 text-blink-muted">{row.banks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-7 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,0.38fr)] lg:px-8 lg:py-10">
          <div>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-blink-muted">Ejemplos del buscador</p>
                <h2 className="mt-2 text-2xl font-black text-blink-ink">Comercios y beneficios para revisar</h2>
              </div>
              <Link to="/search" className="hidden text-sm font-black text-primary hover:text-primary/70 lg:block">
                Ver buscador
              </Link>
            </div>

            {isMerchantLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-32 animate-pulse rounded-2xl border border-blink-border bg-white" />
                ))}
              </div>
            ) : merchantExamples.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {merchantExamples.map((business) => (
                  <Link
                    key={business.id}
                    to={buildSearchPath(business.name)}
                    className="group flex min-h-32 gap-3 rounded-2xl border border-blink-border bg-white p-3 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-md"
                  >
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-primary/10">
                      {business.image ? (
                        <img
                          src={getOptimizedImageUrl(business.image, { width: 240 })}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-primary">
                          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>storefront</span>
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-black text-blink-ink">{business.name}</h3>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-blink-muted">
                        {getBusinessBenefitLabel(business)}
                      </p>
                      <p className="mt-3 flex items-center gap-1 text-xs font-black text-primary">
                        Comparar beneficios
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-blink-border bg-white p-6 text-sm font-semibold text-blink-muted shadow-soft">
                Estamos actualizando ejemplos. Puedes abrir el buscador para ver beneficios disponibles.
              </div>
            )}
          </div>

          <aside className="self-start rounded-2xl border border-blink-border bg-white p-5 shadow-soft">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-blink-muted">Atajos útiles</p>
            <h2 className="mt-2 text-xl font-black text-blink-ink">Explora por rubro o banco</h2>
            <div className="mt-4 space-y-5">
              <nav aria-label="Categorías de descuentos" className="flex flex-wrap gap-2">
                {FEATURED_CATEGORY_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="rounded-xl border border-blink-border bg-blink-bg px-3 py-2 text-sm font-bold text-blink-muted transition-colors hover:border-primary/30 hover:text-blink-ink"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <nav aria-label="Descuentos por banco y rubro" className="flex flex-wrap gap-2">
                {FEATURED_DISCOUNT_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="rounded-xl border border-blink-border bg-white px-3 py-2 text-sm font-bold text-blink-muted transition-colors hover:border-primary/30 hover:text-blink-ink"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>
        </section>

        <section className="border-t border-blink-border bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-7 lg:px-8 lg:py-10">
            <div className="grid gap-4 lg:grid-cols-2">
              {FAQ_ITEMS.map((item) => (
                <article key={item.question} className="rounded-2xl border border-blink-border bg-blink-bg p-5">
                  <h2 className="text-base font-black text-blink-ink">{item.question}</h2>
                  <p className="mt-2 text-sm leading-6 text-blink-muted">{item.answer}</p>
                </article>
              ))}
            </div>

            <div className="mt-7 rounded-2xl border border-primary/20 bg-primary p-5 text-white lg:flex lg:items-center lg:justify-between lg:gap-8 lg:p-6">
              <div>
                <h2 className="text-2xl font-black">Abrir Blink y comparar descuentos</h2>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/80">
                  Usa el buscador para filtrar por comercio, banco, rubro, ubicación, cuotas y modalidad antes de pagar.
                </p>
              </div>
              <Link
                to="/search"
                className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-primary transition-colors hover:bg-white/90 lg:mt-0"
              >
                Ir al buscador
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

export default DiscountSearchGuidePage;
