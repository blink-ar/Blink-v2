import React from 'react';
import Skeleton from '../ui/Skeleton';

/**
 * Full-page skeleton for the Benefit detail page
 */
const SkeletonBenefitPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50" aria-hidden="true">
      {/* Navigation Bar */}
      <div className="bg-white">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="circular" width={40} height={40} />
        </div>

        {/* Store Information */}
        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Store Logo */}
            <Skeleton variant="rectangular" width={64} height={64} className="rounded-xl flex-shrink-0" />

            {/* Store Info */}
            <div className="flex-1 min-w-0">
              {/* Store Name */}
              <Skeleton variant="text" width="70%" height={24} className="mb-2" />
              
              {/* Category and Rating */}
              <div className="flex items-center gap-2 mb-2">
                <Skeleton variant="rectangular" width={80} height={20} className="rounded-full" />
                <div className="flex items-center gap-1">
                  <Skeleton variant="circular" width={16} height={16} />
                  <Skeleton variant="text" width={30} height={16} />
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2">
                <Skeleton variant="circular" width={16} height={16} />
                <Skeleton variant="text" width="80%" height={14} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="flex gap-8">
          <div className="py-3">
            <Skeleton variant="text" width={80} height={20} />
          </div>
          <div className="py-3">
            <Skeleton variant="text" width={100} height={20} />
          </div>
        </div>
      </div>

      {/* Content Area - Benefits */}
      <div className="px-4 py-4 space-y-4">
        {/* Bank Benefit Group */}
        {[1, 2].map((groupIndex) => (
          <div key={groupIndex} className="bg-white rounded-xl p-4 shadow-sm">
            {/* Bank Header */}
            <div className="flex items-center gap-3 mb-4">
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="text" width={120} height={20} />
            </div>

            {/* Benefit Cards */}
            {[1, 2].map((cardIndex) => (
              <div key={cardIndex} className="border border-gray-100 rounded-lg p-3 mb-3 last:mb-0">
                <div className="flex items-start justify-between mb-2">
                  <Skeleton variant="rectangular" width={60} height={28} className="rounded-lg" />
                  <Skeleton variant="text" width={80} height={14} />
                </div>
                <Skeleton variant="text" width="90%" height={14} className="mb-1" />
                <Skeleton variant="text" width="70%" height={14} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonBenefitPage;
