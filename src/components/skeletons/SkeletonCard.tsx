import React from 'react';
import Skeleton from '../ui/Skeleton';

/**
 * Skeleton loader matching the BusinessCard component structure
 */
const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`bg-white rounded-xl p-3 shadow-sm border border-gray-100 ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-start gap-3">
        {/* Icon placeholder */}
        <div className="relative flex-shrink-0">
          <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg" />
          <div className="absolute -top-1 -right-1">
            <Skeleton variant="circular" width={18} height={18} />
          </div>
        </div>

        {/* Content placeholder */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0 pr-2">
              {/* Title */}
              <Skeleton variant="text" width="80%" height={16} className="mb-2" />
              {/* Location */}
              <div className="flex items-center gap-1 mb-2">
                <Skeleton variant="circular" width={12} height={12} />
                <Skeleton variant="text" width="60%" height={12} />
              </div>
            </div>
          </div>

          {/* Discount badge and payment methods */}
          <div className="flex items-center justify-between">
            <Skeleton variant="rectangular" width={80} height={24} className="rounded-full" />
            <div className="flex items-center gap-1">
              <Skeleton variant="rectangular" width={20} height={20} className="rounded" />
              <Skeleton variant="rectangular" width={20} height={20} className="rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
