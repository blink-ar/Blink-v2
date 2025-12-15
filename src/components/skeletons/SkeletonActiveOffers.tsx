import React from 'react';
import Skeleton from '../ui/Skeleton';
import SkeletonCard from './SkeletonCard';

interface SkeletonActiveOffersProps {
  cardCount?: number;
}

/**
 * Skeleton loader for horizontal scroll sections like ActiveOffers
 */
const SkeletonActiveOffers: React.FC<SkeletonActiveOffersProps> = ({ cardCount = 3 }) => {
  return (
    <div className="mb-2" aria-hidden="true">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6">
        <Skeleton variant="text" width={150} height={24} />
        <Skeleton variant="text" width={60} height={16} />
      </div>

      {/* Horizontal scroll cards */}
      <div className="overflow-hidden ml-4">
        <div className="flex gap-4 pb-2">
          {Array.from({ length: cardCount }).map((_, index) => (
            <SkeletonCard
              key={index}
              className="flex-shrink-0 w-80"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkeletonActiveOffers;
