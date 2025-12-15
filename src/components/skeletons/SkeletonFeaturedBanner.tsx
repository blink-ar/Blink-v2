import React from 'react';
import Skeleton from '../ui/Skeleton';

/**
 * Skeleton loader for the featured benefits banner
 */
const SkeletonFeaturedBanner: React.FC = () => {
  return (
    <div className="px-4 py-5" aria-hidden="true">
      <Skeleton
        variant="rectangular"
        width="100%"
        height={180}
        className="rounded-2xl"
      />
    </div>
  );
};

export default SkeletonFeaturedBanner;
