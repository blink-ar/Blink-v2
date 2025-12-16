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
        height="auto"
        className="rounded-[20px]"
        style={{ aspectRatio: "1344 / 704" }}
      />
    </div>
  );
};

export default SkeletonFeaturedBanner;
