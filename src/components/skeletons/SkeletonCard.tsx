import React from 'react';
import Skeleton from '../ui/Skeleton';

/**
 * Skeleton loader matching the SearchPage business row card
 */
const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`w-full bg-white rounded-2xl overflow-hidden flex ${className}`}
      style={{ border: '1px solid #E8E6E1', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3 px-3.5 py-3 flex-1 min-w-0">
        {/* Logo */}
        <Skeleton variant="rectangular" width={44} height={44} className="rounded-xl flex-shrink-0" />

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Name row */}
          <Skeleton variant="text" width="55%" height={14} />
          {/* Bank badges row */}
          <div className="flex items-center gap-1.5">
            <Skeleton variant="rectangular" width={32} height={18} className="rounded-md" />
            <Skeleton variant="rectangular" width={32} height={18} className="rounded-md" />
            <Skeleton variant="text" width={60} height={12} className="ml-1" />
          </div>
        </div>

        {/* Discount column */}
        <div className="shrink-0 flex flex-col items-center gap-1" style={{ minWidth: 38 }}>
          <Skeleton variant="text" width={28} height={10} />
          <Skeleton variant="text" width={36} height={22} />
          <Skeleton variant="text" width={22} height={10} />
        </div>

        {/* Chevron */}
        <Skeleton variant="circular" width={16} height={16} className="shrink-0" />
      </div>
    </div>
  );
};

export default SkeletonCard;
