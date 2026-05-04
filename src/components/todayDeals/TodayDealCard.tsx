import { useCallback, useEffect, useRef, useState } from 'react';
import { TodayDeal } from './todayDeals';
import { formatDistance } from '../../utils/distance';

interface TodayDealCardProps {
  deal: TodayDeal;
  isFavorite: boolean;
  onToggleFavorite: (deal: TodayDeal) => void;
  onShare: (deal: TodayDeal) => void;
  onOpenDetail: (deal: TodayDeal) => void;
}

const getMerchantInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('');
  return initials || 'B';
};

const getDealTitle = (deal: TodayDeal) => deal.benefit.benefit?.trim() || deal.business.name;

const getDistanceLabel = (deal: TodayDeal) => {
  if (deal.business.distanceText) {
    return `${deal.business.distanceText} de vos`;
  }

  if (typeof deal.business.distance === 'number' && Number.isFinite(deal.business.distance)) {
    return `${formatDistance(deal.business.distance)} de vos`;
  }

  return deal.business.location.length > 0 ? 'Sucursal disponible' : 'Distancia no disponible';
};

const getDealDescription = (deal: TodayDeal) => {
  const candidates = [
    deal.benefit.description,
    deal.benefit.textoAplicacion,
    deal.benefit.condicion,
    deal.benefit.requisitos?.join(' '),
    deal.benefit.cuando,
  ];

  return candidates.find((candidate) => candidate && candidate.trim()) || `Beneficio en ${deal.business.name}`;
};

function TodayDealCard({
  deal,
  isFavorite,
  onToggleFavorite,
  onShare,
  onOpenDetail,
}: TodayDealCardProps) {
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);
  const merchantName = deal.business.name.trim() || 'Comercio';
  const benefitTitle = getDealTitle(deal);
  const description = getDealDescription(deal);
  const distanceLabel = getDistanceLabel(deal);

  const measureDescription = useCallback(() => {
    const element = descriptionRef.current;
    if (!element) return;

    const styles = window.getComputedStyle(element);
    const parsedLineHeight = Number.parseFloat(styles.lineHeight);
    const parsedFontSize = Number.parseFloat(styles.fontSize);
    const lineHeight = Number.isFinite(parsedLineHeight)
      ? parsedLineHeight
      : parsedFontSize * 1.25;

    setIsDescriptionTruncated(element.scrollHeight > lineHeight * 2 + 1);
  }, []);

  useEffect(() => {
    setIsDescriptionExpanded(false);
    measureDescription();

    window.addEventListener('resize', measureDescription);
    return () => window.removeEventListener('resize', measureDescription);
  }, [description, measureDescription]);

  return (
    <article className="relative min-h-[100dvh] snap-start snap-always overflow-hidden bg-black text-white">
      {deal.business.image && (
        <div className="pointer-events-none absolute inset-x-0 top-[220px] h-[46vh] overflow-hidden sm:top-[240px]" aria-hidden="true">
          <img
            alt=""
            className="h-full w-full object-cover opacity-70 saturate-[1.05]"
            src={deal.business.image}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/18" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[300px] bg-gradient-to-b from-black via-black/80 to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[58vh] bg-gradient-to-t from-black via-black/92 to-transparent" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[720px] flex-col px-5 pb-6 pt-32 sm:px-8">
        <div className="w-fit -rotate-2 rounded-[20px] bg-[#ff3b30] px-6 py-3.5 shadow-[0_18px_40px_rgba(255,59,48,0.22)]">
          <span className="block text-[40px] font-black leading-none tracking-normal text-white sm:text-[52px]">
            {deal.discount}% OFF
          </span>
        </div>

        <div className="mt-auto">
          <div className="relative pr-[82px]">
            <div className="mb-5 flex items-start gap-4">
              <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full bg-white text-black ring-1 ring-white/20">
                {deal.business.image ? (
                  <img
                    alt={deal.business.name}
                    className="h-full w-full object-contain p-1.5"
                    src={deal.business.image}
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-2 text-center text-lg font-black leading-none">
                    {getMerchantInitials(deal.business.name)}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="break-words text-[38px] font-black leading-[0.98] tracking-normal text-white sm:text-[52px]">
                  {merchantName}
                </h3>
                <p className="mt-3 line-clamp-2 break-words text-[18px] font-black leading-tight tracking-normal text-white/90 sm:text-[22px]">
                  {benefitTitle}
                </p>
              </div>
            </div>

            <p
              ref={descriptionRef}
              className={`${isDescriptionExpanded ? '' : 'line-clamp-2'} break-words text-[22px] font-medium leading-snug tracking-normal text-white/80 sm:text-[26px]`}
            >
              {description}
            </p>

            {isDescriptionTruncated && (
              <button
                type="button"
                aria-expanded={isDescriptionExpanded}
                onClick={() => setIsDescriptionExpanded((current) => !current)}
                className="mt-2 block text-sm font-black tracking-normal text-white underline underline-offset-4 transition-opacity duration-150 active:opacity-70"
              >
                {isDescriptionExpanded ? 'Ver menos' : 'Ver más'}
              </button>
            )}

            <div className={`${isDescriptionTruncated ? 'mt-4' : 'mt-6'} inline-flex h-12 max-w-full items-center gap-3 rounded-[14px] border border-white/20 bg-black px-4 text-[#ffd60a] shadow-[0_0_0_1px_rgba(255,255,255,0.04)]`}>
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 21 }}>
                location_on
              </span>
              <span className="truncate text-base font-black leading-none tracking-normal">{distanceLabel}</span>
            </div>

            <div className="absolute bottom-0 right-0 flex flex-col gap-4">
              <button
                type="button"
                aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar beneficio'}
                aria-pressed={isFavorite}
                onClick={() => onToggleFavorite(deal)}
                className="flex h-[68px] w-[68px] items-center justify-center rounded-full border border-white/10 bg-black/80 text-white transition-transform duration-150 active:scale-95"
              >
                <span
                  className={isFavorite ? 'material-symbols-outlined text-[#ff3b6b]' : 'material-symbols-outlined'}
                  aria-hidden="true"
                  style={{
                    fontSize: 36,
                    fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  favorite
                </span>
              </button>

              <button
                type="button"
                aria-label="Compartir beneficio"
                onClick={() => onShare(deal)}
                className="flex h-[68px] w-[68px] items-center justify-center rounded-full border border-white/10 bg-black/80 text-white transition-transform duration-150 active:scale-95"
              >
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 34 }}>
                  share
                </span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenDetail(deal)}
            className="mt-9 flex h-[72px] w-full items-center justify-center gap-4 rounded-[22px] bg-gradient-indigo px-6 text-[20px] font-black tracking-normal text-white shadow-[0_18px_44px_rgba(99,102,241,0.34)] transition-transform duration-150 active:scale-[0.98]"
          >
            <span>Ver beneficio</span>
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 36 }}>
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}

export default TodayDealCard;
