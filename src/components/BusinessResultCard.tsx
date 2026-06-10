import { Link } from 'react-router-dom';
import { Business } from '../types';
import { formatDistance } from '../utils/distance';
import { toBankDescriptor } from '../utils/banks';
import { getBenefitProviderDisplayName } from '../utils/benefitDisplay';
import BankLogo from './BankLogos/BankLogo';
import { getOptimizedImageUrl } from '../utils/images';

interface BusinessResultCardProps {
  business: Business;
  badgeSource?: Business;
  to?: string;
  onClick?: () => void;
  className?: string;
  showDistance?: boolean;
  variant?: 'list' | 'card' | 'desktop-card';
}

const getCategoryStyle = (category: string) => {
  return {
  gastronomia: { bg: '#EEF2FF', color: '#4338CA' },
    moda: { bg: '#EDE9FE', color: '#7C3AED' },
    viajes: { bg: '#E0F2FE', color: '#0284C7' },
  }[category] ?? { bg: '#DCFCE7', color: '#16A34A' };
};

const getBusinessMaxDiscount = (business: Business) => {
  let max = 0;

  business.benefits.forEach((benefit) => {
    const match = benefit.rewardRate.match(/(\d+)%/);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  });

  return max;
};

const getBusinessMaxInstallments = (business: Business) => {
  let max = 0;

  business.benefits.forEach((benefit) => {
    if (benefit.installments && benefit.installments > max) {
      max = benefit.installments;
    }
  });

  return max;
};

const getBusinessBankBadges = (business: Business) => {
  const seen = new Set<string>();
  const badges: string[] = [];

  business.benefits.forEach((benefit) => {
    if (!benefit.bankName) return;

    const providerName = getBenefitProviderDisplayName(benefit);
    const descriptor = toBankDescriptor(providerName);
    if (!seen.has(descriptor.token)) {
      seen.add(descriptor.token);
      badges.push(providerName);
    }
  });

  return badges;
};

function BusinessResultCard({
  business,
  badgeSource,
  to,
  onClick,
  className = '',
  showDistance = true,
  variant = 'list',
}: BusinessResultCardProps) {
  const bankBadges = getBusinessBankBadges(badgeSource ?? business);
  const visibleBadges = bankBadges.slice(0, 3);
  const remaining = bankBadges.length - 3;
  const maxDiscount = getBusinessMaxDiscount(business);
  const maxInstallments = getBusinessMaxInstallments(business);
  const categoryStyle = getCategoryStyle(business.category);
  const imageSrc = getOptimizedImageUrl(business.image, { width: 96 });
  const baseClassName = `w-full bg-white rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-soft-md overflow-hidden text-left ${
    variant === 'card' ? 'flex flex-col' : variant === 'desktop-card' ? 'flex lg:flex-col' : 'flex'
  } ${className}`;
  const style = {
    border: '1px solid #E8E6E1',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
  };

  const listContent = (
    <div className="flex items-center gap-3 px-3.5 py-3 flex-1 min-w-0">
      <div
        className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center overflow-hidden"
        style={{
          background: imageSrc ? '#F7F6F4' : categoryStyle.bg,
          border: '1px solid rgba(0,0,0,0.07)',
        }}
      >
        {imageSrc ? (
          <img
            alt=""
            className="w-full h-full object-cover"
            src={imageSrc}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="font-black text-base leading-none" style={{ color: categoryStyle.color }}>
            {business.name?.charAt(0)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h2 className="font-bold text-[13.5px] text-blink-ink leading-snug mb-[7px] flex items-center gap-1 min-w-0">
          <span className="truncate">{business.name}</span>
          {showDistance && (business.distanceText || business.distance !== undefined) && (
            <>
              <span className="shrink-0 font-normal text-blink-muted">·</span>
              <span className="shrink-0 text-[11px] font-normal text-blink-muted">
                {business.distanceText || formatDistance(business.distance!)}
              </span>
            </>
          )}
        </h2>

        <div className="flex items-center gap-1 overflow-hidden">
          {visibleBadges.map((token) => (
            <BankLogo key={`${business.id}-${token}`} bankName={token} size={32} />
          ))}
          {remaining > 0 && (
            <span
              className="shrink-0 text-[8.5px] font-bold px-1.5 py-[3px] rounded-md leading-none"
              style={{ background: '#F1F5F9', color: '#94A3B8' }}
            >
              +{remaining}
            </span>
          )}
        </div>
        <span className="block text-[10px] text-blink-muted mt-[7px]">
          {business.benefits.length} {business.benefits.length !== 1 ? 'beneficios' : 'beneficio'}
        </span>
      </div>

      {maxDiscount > 0 ? (
        <div className="shrink-0 flex flex-col items-center text-center" style={{ minWidth: 38 }}>
          <span className="text-[7px] font-bold text-emerald-700 uppercase tracking-[0.12em] leading-none mb-[3px]">hasta</span>
          <span className="text-[22px] font-black text-emerald-600 leading-none tracking-tight">{maxDiscount}%</span>
          <span className="text-[8px] font-bold text-emerald-700 leading-none mt-[2px] tracking-wide">OFF</span>
        </div>
      ) : maxInstallments > 0 ? (
        <div className="shrink-0 flex flex-col items-center text-center" style={{ minWidth: 38 }}>
          <span className="text-[7px] font-bold uppercase tracking-[0.12em] leading-none mb-[3px]" style={{ color: '#4338CA' }}>hasta</span>
          <span className="text-[22px] font-black leading-none tracking-tight" style={{ color: '#6366F1' }}>{maxInstallments}</span>
          <span className="text-[7px] font-bold leading-none mt-[2px] tracking-wide" style={{ color: '#4338CA' }}>cuotas</span>
        </div>
      ) : (
        <div className="shrink-0" style={{ minWidth: 38 }} />
      )}

      <span className="material-symbols-outlined shrink-0" style={{ fontSize: 16, color: '#D1D5DB' }}>
        chevron_right
      </span>
    </div>
  );

  const cardContent = (
    <>
      <div
        className="relative h-32 w-full overflow-hidden"
        style={{ background: imageSrc ? '#F7F6F4' : categoryStyle.bg }}
      >
        {imageSrc ? (
          <img
            alt=""
            className="h-full w-full object-cover"
            src={getOptimizedImageUrl(business.image, { width: 520 })}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-black text-4xl leading-none" style={{ color: categoryStyle.color }}>
              {business.name?.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/35" />
        {maxDiscount > 0 ? (
          <div className="absolute left-3 top-3 rounded-xl bg-white/90 px-2.5 py-1 text-sm font-black text-emerald-600 shadow-soft">
            {maxDiscount}% OFF
          </div>
        ) : maxInstallments > 0 ? (
          <div className="absolute left-3 top-3 rounded-xl bg-white/90 px-2.5 py-1 text-sm font-black text-primary shadow-soft">
            {maxInstallments} cuotas
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h2 className="flex min-w-0 items-center gap-1 text-base font-bold leading-snug text-blink-ink">
            <span className="truncate">{business.name}</span>
            {showDistance && (business.distanceText || business.distance !== undefined) && (
              <>
                <span className="shrink-0 font-normal text-blink-muted">·</span>
                <span className="shrink-0 text-xs font-normal text-blink-muted">
                  {business.distanceText || formatDistance(business.distance!)}
                </span>
              </>
            )}
          </h2>
          <p className="mt-1 text-sm text-blink-muted">
            {business.benefits.length} {business.benefits.length !== 1 ? 'beneficios' : 'beneficio'}
          </p>
        </div>

        <div className="flex items-center gap-1 overflow-hidden">
          {visibleBadges.map((token) => (
            <BankLogo key={`${business.id}-${token}`} bankName={token} size={32} />
          ))}
          {remaining > 0 && (
            <span
              className="shrink-0 rounded-md px-1.5 py-[3px] text-[10px] font-bold leading-none"
              style={{ background: '#F1F5F9', color: '#94A3B8' }}
            >
              +{remaining}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-blink-border pt-3">
          <span className="text-xs font-semibold text-blink-muted">Ver beneficios</span>
          <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 18 }}>
            arrow_forward
          </span>
        </div>
      </div>
    </>
  );

  const responsiveContent = variant === 'desktop-card' ? (
    <>
      <div className="contents lg:hidden">{listContent}</div>
      <div className="hidden flex-1 flex-col lg:flex">{cardContent}</div>
    </>
  ) : variant === 'card' ? cardContent : listContent;

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={baseClassName} style={style}>
        {responsiveContent}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClassName} style={style}>
      {responsiveContent}
    </button>
  );
}

export default BusinessResultCard;
