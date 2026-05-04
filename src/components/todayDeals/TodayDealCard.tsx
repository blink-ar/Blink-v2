import { TodayDeal } from './todayDeals';

interface TodayDealCardProps {
  deal: TodayDeal;
  countdownText: string;
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
  countdownText,
  isFavorite,
  onToggleFavorite,
  onShare,
  onOpenDetail,
}: TodayDealCardProps) {
  const title = getDealTitle(deal);
  const description = getDealDescription(deal);

  return (
    <article className="relative min-h-[100dvh] snap-start snap-always overflow-hidden bg-black text-white">
      <div className="mx-auto flex min-h-[100dvh] max-w-[720px] flex-col px-5 pb-6 pt-32 sm:px-8">
        <div className="w-fit -rotate-2 rounded-[20px] bg-[#ff3b30] px-6 py-3.5 shadow-[0_18px_40px_rgba(255,59,48,0.22)]">
          <span className="block text-[40px] font-black leading-none tracking-normal text-white sm:text-[52px]">
            {deal.discount}% OFF
          </span>
        </div>

        <div className="mt-auto">
          <div className="relative pr-[82px]">
            <div className="mb-5 flex items-center gap-4">
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

              <h3 className="line-clamp-2 min-w-0 break-words text-[34px] font-black leading-[1.08] tracking-normal text-white sm:text-[44px]">
                {title}
              </h3>
            </div>

            <p className="line-clamp-2 break-words text-[22px] font-medium leading-snug tracking-normal text-white/80 sm:text-[26px]">
              {description}
            </p>

            <div className="mt-6 inline-flex h-12 max-w-full items-center gap-3 rounded-[14px] border border-white/20 bg-black px-4 text-[#ffd60a] shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 21 }}>
                schedule
              </span>
              <span className="truncate text-base font-black leading-none tracking-normal">{countdownText}</span>
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
