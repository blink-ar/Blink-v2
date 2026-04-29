import React from 'react';
import Skeleton from '../ui/Skeleton';

// Pill widths that approximate real bank name lengths
const PILL_WIDTHS = [96, 72, 110, 84, 64, 120, 88, 76, 104, 68, 92, 80];

const SkeletonAvailableBanks: React.FC = () => {
  return (
    <div
      className="mt-4 rounded-[28px] px-4 py-4"
      style={{
        background: 'linear-gradient(180deg, rgba(238,242,255,0.9) 0%, rgba(255,255,255,0.96) 100%)',
        border: '1px solid rgba(99,102,241,0.18)',
        boxShadow: '0 10px 28px rgba(99,102,241,0.08)',
      }}
      aria-hidden="true"
    >
      {/* Heading */}
      <div className="flex justify-center mb-4">
        <Skeleton variant="text" width={260} height={15} />
      </div>

      {/* Pill grid */}
      <div className="flex flex-wrap justify-center gap-2">
        {PILL_WIDTHS.map((w, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            width={w}
            height={36}
            className="rounded-full"
          />
        ))}
      </div>
    </div>
  );
};

export default SkeletonAvailableBanks;
