import React from 'react';
import Skeleton from '../ui/Skeleton';
import SkeletonCard from './SkeletonCard';

/**
 * Skeleton loader for the Beneficios tab showing categories, banks, and business grid
 */
const SkeletonBeneficiosTab: React.FC = () => {
  return (
    <div aria-hidden="true">
      {/* Category Grid Skeleton - Sticky */}
      <div className="sticky top-[72px] z-10 bg-white">
        <div className="py-3">
          <div className="flex gap-2 sm:gap-3 px-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton
                key={`category-${index}`}
                variant="rectangular"
                width={index % 3 === 0 ? 110 : index % 3 === 1 ? 85 : 95}
                height={36}
                className="rounded-lg flex-shrink-0"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bank Grid Skeleton - Sticky */}
      <div className="sticky top-[128px] z-10 bg-white">
        <div className="py-3">
          <div className="flex gap-2 sm:gap-3 px-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton
                key={`bank-${index}`}
                variant="rectangular"
                width={index % 2 === 0 ? 100 : 120}
                height={36}
                className="rounded-lg flex-shrink-0"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Business Grid Skeleton */}
      <div className="px-4 sm:px-6 md:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={`business-${index}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkeletonBeneficiosTab;
