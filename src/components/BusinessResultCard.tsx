import { Link } from 'react-router-dom';
import { Business } from '../types';
import { formatDistance } from '../utils/distance';
import { toBankDescriptor } from '../utils/banks';

interface BusinessResultCardProps {
  business: Business;
  badgeSource?: Business;
  to?: string;
  onClick?: () => void;
  className?: string;
  showDistance?: boolean;
}

const getCategoryStyle = (category: string) => {
  return {
    gastronomia: { bg: '#EEF2FF', color: '#6366F1' },
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

    const descriptor = toBankDescriptor(benefit.bankName);
    if (!seen.has(descriptor.token)) {
      seen.add(descriptor.token);
      badges.push(descriptor.code);
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
}: BusinessResultCardProps) {
  const bankBadges = getBusinessBankBadges(badgeSource ?? business);
  const visibleBadges = bankBadges.slice(0, 3);
  const remaining = bankBadges.length - 3;
  const maxDiscount = getBusinessMaxDiscount(business);
  const maxInstallments = getBusinessMaxInstallments(business);
  const categoryStyle = getCategoryStyle(business.category);
  const baseClassName = `w-full bg-white rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] overflow-hidden flex text-left ${className}`;
  const style = {
    border: '1px solid #E8E6E1',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
  };

  const content = (
    <div className="flex items-center gap-3 px-3.5 py-3 flex-1 min-w-0">
      <div
        className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center overflow-hidden"
        style={{
          background: business.image ? '#F7F6F4' : categoryStyle.bg,
          border: '1px solid rgba(0,0,0,0.07)',
        }}
      >
        {business.image ? (
          <img
            alt=""
            className="w-full h-full object-cover"
            src={business.image}
            loading="lazy"
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

        <div className="flex items-center gap-1.5 overflow-hidden">
          {visibleBadges.map((badge) => (
            <span
              key={`${business.id}-${badge}`}
              className="shrink-0 text-[8.5px] font-black tracking-widest px-1.5 py-[3px] rounded-md leading-none"
              style={{ background: '#1E293B', color: '#E2E8F0' }}
            >
              {badge}
            </span>
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
        <span className="block text-[10px] text-blink-muted mt-[3px]">
          {business.benefits.length} {business.benefits.length !== 1 ? 'beneficios' : 'beneficio'}
        </span>
      </div>

      {maxDiscount > 0 ? (
        <div className="shrink-0 flex flex-col items-center text-center" style={{ minWidth: 38 }}>
          <span className="text-[7px] font-bold text-emerald-500 uppercase tracking-[0.12em] leading-none mb-[3px]">hasta</span>
          <span className="text-[22px] font-black text-emerald-600 leading-none tracking-tight">{maxDiscount}%</span>
          <span className="text-[8px] font-bold text-emerald-500 leading-none mt-[2px] tracking-wide">OFF</span>
        </div>
      ) : maxInstallments > 0 ? (
        <div className="shrink-0 flex flex-col items-center text-center" style={{ minWidth: 38 }}>
          <span className="text-[7px] font-bold uppercase tracking-[0.12em] leading-none mb-[3px]" style={{ color: '#818CF8' }}>hasta</span>
          <span className="text-[22px] font-black leading-none tracking-tight" style={{ color: '#6366F1' }}>{maxInstallments}</span>
          <span className="text-[7px] font-bold leading-none mt-[2px] tracking-wide" style={{ color: '#818CF8' }}>cuotas</span>
        </div>
      ) : (
        <div className="shrink-0" style={{ minWidth: 38 }} />
      )}

      <span className="material-symbols-outlined shrink-0" style={{ fontSize: 16, color: '#D1D5DB' }}>
        chevron_right
      </span>
    </div>
  );

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={baseClassName} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClassName} style={style}>
      {content}
    </button>
  );
}

export default BusinessResultCard;
