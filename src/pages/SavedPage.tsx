import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/neo/BottomNav';
import MerchantCard from '../components/MerchantCard';
import BankLogo from '../components/BankLogos/BankLogo';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Business, BankBenefit } from '../types';
import { fetchBusinessById } from '../services/api';
import { businessWithActiveBenefits, isBenefitActive } from '../utils/benefits';
import { buildBenefitPath } from '../utils/benefitIdentity';
import { getBenefitProviderDisplayName } from '../utils/benefitDisplay';
import { getOptimizedImageUrl } from '../utils/images';
import {
  parseSavedBenefitKey,
  readSavedBenefitKeys,
  resolveSavedBenefit,
  writeSavedBenefitKeys,
  type SavedBenefitRef,
} from '../utils/savedBenefits';

interface SavedBenefitItem {
  ref: SavedBenefitRef;
  business: Business;
  benefit: BankBenefit;
  position: number;
  active: boolean;
}

const PRIMARY_BUTTON_STYLE = { background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' };

function SectionTitle({ children, count }: { children: string; count?: number }) {
  return (
    <h2 className="flex items-center gap-2 px-1 text-sm font-semibold text-blink-ink">
      {children}
      {count !== undefined && count > 0 && (
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{count}</span>
      )}
    </h2>
  );
}

function SavedBenefitRow({
  item,
  onOpen,
  onRemove,
}: {
  item: SavedBenefitItem;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const { business, benefit, active } = item;
  const discount = benefit.rewardRate.match(/(\d+)%/)?.[1];
  const headline = discount && Number(discount) > 0
    ? `${discount}%`
    : benefit.installments ? `${benefit.installments} cuotas` : null;
  const provider = getBenefitProviderDisplayName(benefit);

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-blink-border bg-white px-3.5 py-3 shadow-soft ${active ? '' : 'opacity-60'}`}
    >
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-blink-border bg-blink-bg">
          {business.image && (
            <img
              alt=""
              src={getOptimizedImageUrl(business.image, { width: 96 })}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-blink-ink">{business.name}</span>
          <span className="block truncate text-xs text-blink-muted">{benefit.benefit || benefit.cardName}</span>
          <span className="mt-1 flex items-center gap-1.5">
            <BankLogo bankName={provider} size={18} />
            <span className="truncate text-xs text-blink-muted">{provider}</span>
            {!active && (
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500">Vencido</span>
            )}
          </span>
        </span>
        {headline && (
          <span className={`shrink-0 text-lg font-black ${active ? 'text-blink-positive' : 'text-gray-400'}`}>{headline}</span>
        )}
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar ${business.name} de guardados`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-rose-500 transition-colors hover:bg-rose-50"
      >
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>
          favorite
        </span>
      </button>
    </div>
  );
}

function SavedPage() {
  const { favorites } = useFavorites();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const showToast = useToast();

  // ── Saved benefits (local, no account required) ──
  const [savedKeys, setSavedKeys] = useState<string[]>(readSavedBenefitKeys);
  const savedRefs = useMemo(
    () => savedKeys.map(parseSavedBenefitKey).filter((ref): ref is SavedBenefitRef => ref !== null),
    [savedKeys],
  );
  const savedBusinessIds = useMemo(
    () => Array.from(new Set(savedRefs.map((ref) => ref.businessId))),
    [savedRefs],
  );
  const benefitBusinessQueries = useQueries({
    queries: savedBusinessIds.map((businessId) => ({
      queryKey: ['saved-benefit-business', businessId],
      queryFn: () => fetchBusinessById(businessId, { includeExpired: true }),
      staleTime: 1000 * 60 * 5,
    })),
  });
  const isLoadingSavedBenefits = benefitBusinessQueries.some((query) => query.isLoading);

  const { savedBenefits, unavailableKeys, hasLoadErrors } = useMemo(() => {
    // Only a successful fetch can prove a saved benefit is gone; failed fetches are kept for a retry.
    const fetchedBusinessIds = new Set<string>();
    const businessById = new Map<string, Business>();
    let errors = false;
    savedBusinessIds.forEach((businessId, index) => {
      const query = benefitBusinessQueries[index];
      if (query?.isError) errors = true;
      if (query?.isSuccess) {
        fetchedBusinessIds.add(businessId);
        if (query.data) businessById.set(businessId, query.data);
      }
    });

    const now = new Date();
    const items: SavedBenefitItem[] = [];
    const missing: string[] = [];
    savedRefs.forEach((ref) => {
      const business = businessById.get(ref.businessId);
      const resolved = business ? resolveSavedBenefit(business, ref.benefitRef) : null;
      if (business && resolved) {
        items.push({ ref, business, ...resolved, active: isBenefitActive(resolved.benefit, now) });
      } else if (fetchedBusinessIds.has(ref.businessId)) {
        missing.push(ref.key);
      }
    });

    // Active first, keep save order otherwise.
    return {
      savedBenefits: items.sort((a, b) => Number(b.active) - Number(a.active)),
      unavailableKeys: missing,
      hasLoadErrors: errors,
    };
  }, [benefitBusinessQueries, savedBusinessIds, savedRefs]);

  const removeSavedBenefits = (keys: string[]) => {
    const toRemove = new Set(keys);
    const next = savedKeys.filter((value) => !toRemove.has(value));
    writeSavedBenefitKeys(next);
    setSavedKeys(next);
    showToast('Quitado de guardados', { icon: 'heart_minus' });
  };

  // ── Saved merchants (account required) ──
  const hasSavedSnapshots = favorites.length > 0;
  const favoriteQueries = useQueries({
    queries: favorites.map((business) => ({
      queryKey: ['saved-business', business.id],
      queryFn: () => fetchBusinessById(business.id),
      enabled: Boolean(business.id),
      staleTime: 1000 * 60 * 5,
    })),
  });

  const visibleFavorites = favorites
    .map((snapshot, index) => {
      const query = favoriteQueries[index];
      if (query?.status === 'success') {
        return query.data;
      }
      return businessWithActiveBenefits(snapshot);
    })
    .filter((business): business is Business => Boolean(business));

  const handleSelect = (business: Business) => {
    navigate(`/business/${business.id}`, { state: { business } });
  };

  const hasAnySavedBenefit = savedRefs.length > 0;
  const showGlobalEmpty = !hasAnySavedBenefit && (!isAuthenticated || visibleFavorites.length === 0);

  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col overflow-x-hidden">
      <header
        className="sticky top-0 z-50 w-full lg:hidden"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(232,230,225,0.8)',
        }}
      >
        <div className="h-14 flex items-center px-4">
          <h1 className="font-bold text-xl tracking-tight text-blink-ink">Guardados</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col pb-28 lg:mx-auto lg:w-full lg:max-w-5xl lg:px-8 lg:py-8 lg:pb-12">
        <div className="mb-6 hidden lg:block">
          <h1 className="text-3xl font-black tracking-tight text-blink-ink">Guardados</h1>
          <p className="mt-1 text-sm text-blink-muted">Tus beneficios y comercios favoritos.</p>
        </div>

        {showGlobalEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 py-16">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FFE4E6 0%, #FECDD3 100%)' }}
            >
              <span
                className="material-symbols-outlined"
                aria-hidden="true"
                style={{ fontSize: 40, color: '#F43F5E', fontVariationSettings: "'FILL' 0" }}
              >
                favorite
              </span>
            </div>
            <div className="text-center">
              <p className="font-semibold text-base text-blink-ink mb-1">
                {hasSavedSnapshots && isAuthenticated ? 'Sin beneficios activos guardados' : 'Todavía no guardaste nada'}
              </p>
              <p className="text-sm text-blink-muted max-w-xs">
                {hasSavedSnapshots && isAuthenticated
                  ? 'Tus comercios guardados no tienen beneficios activos ahora.'
                  : 'Tocá el corazón en un beneficio para tenerlo a mano acá.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/search')}
              className="mt-2 h-11 px-6 rounded-xl font-semibold text-sm text-white transition-all duration-150 active:scale-95"
              style={PRIMARY_BUTTON_STYLE}
            >
              Explorar beneficios
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-8 px-4 pt-4 lg:px-0 lg:pt-0">
            {hasAnySavedBenefit && (
              <section className="flex flex-col gap-3" aria-label="Beneficios guardados">
                <SectionTitle count={savedBenefits.length}>Beneficios</SectionTitle>
                {isLoadingSavedBenefits && savedBenefits.length === 0 ? (
                  Array.from({ length: Math.min(savedRefs.length, 3) }).map((_, index) => (
                    <div key={index} className="h-[76px] animate-pulse rounded-2xl bg-white" />
                  ))
                ) : savedBenefits.length === 0 && hasLoadErrors ? (
                  <p className="px-1 text-sm text-blink-muted">
                    No pudimos cargar tus beneficios guardados. Probá de nuevo en un rato.
                  </p>
                ) : (
                  savedBenefits.map((item) => (
                    <SavedBenefitRow
                      key={item.ref.key}
                      item={item}
                      onOpen={() => navigate(
                        buildBenefitPath(item.business.id, item.benefit, item.position),
                        { state: { business: item.business } },
                      )}
                      onRemove={() => removeSavedBenefits([item.ref.key])}
                    />
                  ))
                )}
                {!isLoadingSavedBenefits && unavailableKeys.length > 0 && (
                  <div className="flex items-center gap-3 rounded-2xl border border-dashed border-blink-border px-4 py-3">
                    <p className="flex-1 text-sm text-blink-muted">
                      {unavailableKeys.length === 1
                        ? '1 beneficio guardado ya no está disponible.'
                        : `${unavailableKeys.length} beneficios guardados ya no están disponibles.`}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeSavedBenefits(unavailableKeys)}
                      className="shrink-0 text-sm font-semibold text-primary"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </section>
            )}

            <section className="flex flex-col gap-3" aria-label="Comercios guardados">
              <SectionTitle count={isAuthenticated ? visibleFavorites.length : undefined}>Comercios</SectionTitle>
              {!isAuthenticated ? (
                <div className="flex items-center gap-3 rounded-2xl border border-blink-border bg-white p-4">
                  <span className="material-symbols-outlined text-primary" aria-hidden="true" style={{ fontSize: 24 }}>
                    lock_open
                  </span>
                  <p className="flex-1 text-sm text-blink-muted">
                    Iniciá sesión para guardar comercios y sincronizarlos entre dispositivos.
                  </p>
                  <button
                    onClick={() => navigate('/login')}
                    className="h-9 shrink-0 rounded-xl px-3 text-sm font-semibold text-white"
                    style={PRIMARY_BUTTON_STYLE}
                  >
                    Ingresar
                  </button>
                </div>
              ) : visibleFavorites.length === 0 ? (
                <p className="px-1 text-sm text-blink-muted">Tocá el corazón en un comercio para guardarlo acá.</p>
              ) : (
                visibleFavorites.map((business) => (
                  <MerchantCard key={business.id} business={business} onClick={handleSelect} />
                ))
              )}
            </section>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export default SavedPage;
