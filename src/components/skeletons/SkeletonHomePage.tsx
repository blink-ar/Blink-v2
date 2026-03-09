import React from 'react';
import Skeleton from '../ui/Skeleton';

/**
 * Full-page skeleton for the HomePage
 */
const SkeletonHomePage: React.FC = () => {
  return (
    <div className="bg-blink-bg min-h-screen flex flex-col overflow-x-hidden" aria-hidden="true">
      {/* Sticky Header */}
      <header
        className="sticky top-0 z-50 w-full flex flex-col"
        style={{
          background: 'rgba(255,255,255,0.92)',
          borderBottom: '1px solid rgba(232,230,225,0.8)',
        }}
      >
        {/* Top Bar */}
        <div className="h-14 flex items-center justify-between px-4">
          <Skeleton variant="text" width={60} height={22} />
          <div className="flex items-center gap-2">
            <Skeleton variant="rectangular" width={36} height={36} className="rounded-xl" />
            <Skeleton variant="circular" width={36} height={36} />
          </div>
        </div>
        {/* Ticker bar */}
        <div className="h-8 px-4 flex items-center">
          <Skeleton variant="text" width="70%" height={14} />
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-8 pb-32">
        {/* Hero Section */}
        <section className="px-4 pt-6">
          {/* Heading */}
          <div className="flex flex-col items-center gap-2 mb-5">
            <Skeleton variant="text" width="60%" height={36} />
            <Skeleton variant="text" width="40%" height={36} />
            <Skeleton variant="text" width="70%" height={16} className="mt-1" />
          </div>

          {/* Search Bar */}
          <div
            className="flex items-center gap-2 px-4 rounded-2xl h-14"
            style={{ background: '#FFFFFF', border: '1.5px solid #D1D5DB' }}
          >
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="text" width="60%" height={16} className="flex-1" />
            <Skeleton variant="rectangular" width={36} height={36} className="rounded-xl flex-shrink-0" />
          </div>

          {/* Quick Category Pills */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Skeleton variant="rectangular" width={110} height={36} className="rounded-full" />
            <Skeleton variant="rectangular" width={85} height={36} className="rounded-full" />
            <Skeleton variant="rectangular" width={120} height={36} className="rounded-full" />
          </div>
        </section>

        {/* Top 5 Section */}
        <section className="flex flex-col gap-3">
          <div className="px-4 flex items-center justify-between">
            <Skeleton variant="text" width={100} height={18} />
            <Skeleton variant="text" width={60} height={14} />
          </div>
          {/* Horizontal bento cards */}
          <div className="flex gap-3 px-4 pb-2 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[240px] rounded-2xl overflow-hidden"
                style={{ border: '1px solid #D1D5DB' }}
              >
                {/* Image area */}
                <Skeleton variant="rectangular" width="100%" height={112} className="rounded-none" />
                {/* Content area */}
                <div className="p-3 bg-white space-y-1.5">
                  <Skeleton variant="text" width="75%" height={14} />
                  <Skeleton variant="text" width="55%" height={12} />
                  <div className="flex justify-between items-center pt-1">
                    <Skeleton variant="text" width="45%" height={10} />
                    <Skeleton variant="circular" width={18} height={18} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Category Marquee */}
        <div className="h-10 px-4 flex items-center gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" width={80} height={32} className="rounded-lg flex-shrink-0" />
          ))}
        </div>

        {/* Newsletter CTA */}
        <section className="px-4">
          <Skeleton variant="rectangular" width="100%" height={130} className="rounded-2xl" />
        </section>
      </main>
    </div>
  );
};

export default SkeletonHomePage;
