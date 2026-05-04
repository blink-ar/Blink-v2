import { useEffect, useState, type RefObject } from 'react';
import { useModalFocusTrap } from '../../hooks/useFocusManagement';
import {
  trackSaveBenefit,
  trackShareBenefit,
  trackUnsaveBenefit,
} from '../../analytics/intentTracking';
import TodayDealCard from './TodayDealCard';
import { getBenefitId, getBenefitPath, TodayDeal } from './todayDeals';

interface TodayDealsReelProps {
  deals: TodayDeal[];
  isLoading: boolean;
  onClose: () => void;
  onOpenDetail: (deal: TodayDeal) => void;
}

const SAVED_BENEFITS_STORAGE_KEY = 'blink.savedBenefits';

const getCountdownText = () => {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const remainingMs = Math.max(0, endOfDay.getTime() - now.getTime());
  const hours = Math.floor(remainingMs / 3_600_000);
  const minutes = Math.max(1, Math.ceil((remainingMs % 3_600_000) / 60_000));

  if (hours <= 0) {
    return `Quedan ${minutes}m`;
  }

  return `Quedan ${hours}h ${minutes}m`;
};

const parseSavedBenefitIds = (storedValue: string | null): string[] => {
  if (!storedValue) return [];

  try {
    const parsed: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
};

const readSavedBenefitIds = () => {
  if (typeof window === 'undefined') return new Set<string>();
  return new Set(parseSavedBenefitIds(window.localStorage.getItem(SAVED_BENEFITS_STORAGE_KEY)));
};

const writeSavedBenefitIds = (ids: Set<string>) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SAVED_BENEFITS_STORAGE_KEY, JSON.stringify(Array.from(ids)));
};

const getShareUrl = (deal: TodayDeal) => {
  const path = getBenefitPath(deal);
  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.origin).toString();
};

function TodayDealsReel({ deals, isLoading, onClose, onOpenDetail }: TodayDealsReelProps) {
  const modalRef = useModalFocusTrap(true, onClose);
  const [countdownText, setCountdownText] = useState(getCountdownText);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => readSavedBenefitIds());

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousOverscrollBehavior = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCountdownText(getCountdownText());
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleToggleFavorite = (deal: TodayDeal) => {
    const benefitId = getBenefitId(deal);

    setFavoriteIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(benefitId)) {
        nextIds.delete(benefitId);
        trackUnsaveBenefit({
          source: 'today_deals_reel',
          benefitId,
          businessId: deal.business.id,
        });
      } else {
        nextIds.add(benefitId);
        trackSaveBenefit({
          source: 'today_deals_reel',
          benefitId,
          businessId: deal.business.id,
        });
      }

      writeSavedBenefitIds(nextIds);
      return nextIds;
    });
  };

  const handleShare = async (deal: TodayDeal) => {
    if (typeof window === 'undefined') return;

    const benefitId = getBenefitId(deal);
    const url = getShareUrl(deal);
    const title = `${deal.business.name} · Blink`;
    const text = deal.benefit.description || deal.benefit.benefit || `Beneficio en ${deal.business.name}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        trackShareBenefit({
          source: 'today_deals_reel',
          benefitId,
          businessId: deal.business.id,
          channel: 'web_share',
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        trackShareBenefit({
          source: 'today_deals_reel',
          benefitId,
          businessId: deal.business.id,
          channel: 'clipboard',
        });
        return;
      }

      trackShareBenefit({
        source: 'today_deals_reel',
        benefitId,
        businessId: deal.business.id,
        channel: 'unsupported',
      });
    } catch (error) {
      const channel = error instanceof DOMException && error.name === 'AbortError'
        ? 'dismissed'
        : 'share_error';
      trackShareBenefit({
        source: 'today_deals_reel',
        benefitId,
        businessId: deal.business.id,
        channel,
      });
    }
  };

  return (
    <div
      ref={modalRef as RefObject<HTMLDivElement>}
      role="dialog"
      aria-modal="true"
      aria-labelledby="today-deals-title"
      className="fixed inset-0 z-[100] bg-black text-white"
    >
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[120]">
        <div
          className="mx-auto flex max-w-[720px] items-center justify-between px-5 sm:px-8"
          style={{ paddingTop: 'max(24px, env(safe-area-inset-top))' }}
        >
          <h2 id="today-deals-title" className="pointer-events-auto text-[30px] font-black leading-none tracking-normal sm:text-[44px]">
            Descuentos de hoy
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar descuentos de hoy"
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform duration-150 active:scale-90"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 38 }}>
              close
            </span>
          </button>
        </div>
      </header>

      <div className="h-[100dvh] overflow-y-auto overscroll-contain snap-y snap-mandatory no-scrollbar">
        {isLoading && deals.length === 0 ? (
          <div className="mx-auto flex min-h-[100dvh] max-w-[720px] flex-col bg-black px-5 pb-6 pt-32 sm:px-8">
            <div className="h-[72px] w-[236px] -rotate-2 animate-pulse rounded-[20px] bg-[#ff3b30]/70" />
            <div className="mt-auto space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-[72px] w-[72px] animate-pulse rounded-full bg-white/80" />
                <div className="space-y-3">
                  <div className="h-8 w-56 animate-pulse rounded-lg bg-white/20" />
                  <div className="h-8 w-44 animate-pulse rounded-lg bg-white/20" />
                </div>
              </div>
              <div className="h-6 w-4/5 animate-pulse rounded-lg bg-white/20" />
              <div className="h-12 w-48 animate-pulse rounded-[14px] border border-white/10 bg-white/10" />
              <div className="h-[72px] w-full animate-pulse rounded-[22px] bg-primary/80" />
            </div>
          </div>
        ) : deals.length > 0 ? (
          deals.map((deal) => (
            <TodayDealCard
              key={deal.id}
              deal={deal}
              countdownText={countdownText}
              isFavorite={favoriteIds.has(getBenefitId(deal))}
              onToggleFavorite={handleToggleFavorite}
              onShare={(selectedDeal) => void handleShare(selectedDeal)}
              onOpenDetail={onOpenDetail}
            />
          ))
        ) : (
          <div className="mx-auto flex min-h-[100dvh] max-w-[720px] flex-col justify-end bg-black px-5 pb-6 pt-32 sm:px-8">
            <div className="mb-10">
              <div className="mb-8 w-fit -rotate-2 rounded-[20px] bg-[#ff3b30] px-6 py-3.5">
                <span className="block text-[40px] font-black leading-none tracking-normal">HOY</span>
              </div>
              <h3 className="mb-4 text-[34px] font-black leading-tight tracking-normal">
                No encontramos descuentos para mostrar ahora.
              </h3>
              <p className="text-xl font-medium leading-snug tracking-normal text-white/70">
                Probá buscar beneficios por banco, rubro o comercio.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TodayDealsReel;
