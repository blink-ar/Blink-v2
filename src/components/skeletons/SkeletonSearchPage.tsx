import React from 'react';
import Skeleton from '../ui/Skeleton';
import SkeletonCard from './SkeletonCard';

/**
 * Full-page skeleton for the SearchPage
 */
const SkeletonSearchPage: React.FC<{ cardCount?: number }> = ({ cardCount = 5 }) => {
  return (
    <div className="bg-blink-bg min-h-screen flex flex-col relative overflow-x-hidden" aria-hidden="true">
      {/* Sticky Header */}
      <header
        className="sticky top-0 z-40 w-full"
        style={{
          background: 'rgba(255,255,255,0.92)',
          borderBottom: '1px solid rgba(232,230,225,0.8)',
        }}
      >
        {/* Search row */}
        <div className="px-4 py-3 flex items-center gap-2.5">
          <Skeleton variant="rectangular" width={40} height={40} className="rounded-xl flex-shrink-0" />
          <div
            className="flex-1 h-11 flex items-center px-3 gap-2 rounded-xl"
            style={{ background: '#F7F6F4', border: '1px solid #D1D5DB' }}
          >
            <Skeleton variant="circular" width={18} height={18} />
            <Skeleton variant="text" width="50%" height={14} className="flex-1" />
          </div>
          <Skeleton variant="rectangular" width={40} height={40} className="rounded-xl flex-shrink-0" />
        </div>

        {/* Filter pills row */}
        <div className="w-full pb-3 px-4 flex gap-2 overflow-hidden">
          {[110, 90, 105, 80, 95, 85].map((w, i) => (
            <Skeleton key={i} variant="rectangular" width={w} height={36} className="rounded-xl flex-shrink-0" />
          ))}
        </div>
      </header>

      {/* Results */}
      <main className="flex-1 px-4 py-5 space-y-3 pb-28">
        {/* Header row */}
        <div className="flex justify-between items-center mb-2">
          <Skeleton variant="text" width={70} height={18} />
          <Skeleton variant="rectangular" width={80} height={26} className="rounded-full" />
        </div>

        {/* Business cards */}
        {Array.from({ length: cardCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </main>
    </div>
  );
};

export default SkeletonSearchPage;
