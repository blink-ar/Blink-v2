import React from 'react';
import Skeleton from '../ui/Skeleton';

/**
 * Full-page skeleton for the BusinessDetailPage
 */
const SkeletonBusinessDetailPage: React.FC = () => {
  return (
    <div className="bg-blink-bg min-h-screen flex flex-col relative overflow-x-hidden" aria-hidden="true">
      <main className="flex-1 pb-32">
        {/* Hero — light indigo gradient */}
        <div
          className="relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #C7D2FE 100%)', minHeight: 260 }}
        >
          {/* Floating nav buttons */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-6 z-20">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.70)' }}
            >
              <Skeleton variant="circular" width={20} height={20} />
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.70)' }}
            >
              <Skeleton variant="circular" width={20} height={20} />
            </div>
          </div>

          {/* Logo + name + badges */}
          <div className="relative z-10 flex flex-col items-center pt-24 pb-8 px-6 text-center gap-3">
            <Skeleton variant="rectangular" width={84} height={84} className="rounded-[22px]" />
            <Skeleton variant="text" width={140} height={26} />
            <div className="flex items-center gap-2">
              <Skeleton variant="rectangular" width={80} height={28} className="rounded-full" />
              <Skeleton variant="rectangular" width={65} height={28} className="rounded-full" />
            </div>
          </div>
        </div>

        <div className="px-4 pt-6 space-y-6">
          {/* "Mis beneficios" heading */}
          <div className="flex items-center gap-2 mb-1">
            <Skeleton variant="text" width={120} height={18} />
          </div>

          {/* Top benefit card — large, highlighted */}
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1.5px solid #C7D2FE', boxShadow: '0 4px 20px rgba(99,102,241,0.12)' }}
          >
            <div className="px-4 pt-4 pb-5" style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' }}>
              <div className="flex items-center justify-between mb-3">
                <Skeleton variant="rectangular" width={54} height={26} className="rounded-full" />
                <Skeleton variant="rectangular" width={80} height={26} className="rounded-full" />
              </div>
              <Skeleton variant="text" width={100} height={52} className="mb-1" />
              <Skeleton variant="text" width={80} height={14} />
            </div>
            <div className="px-4 py-3 flex justify-between items-center" style={{ borderTop: '1px solid #E8E6E1' }}>
              <div className="space-y-1">
                <Skeleton variant="text" width={60} height={10} />
                <Skeleton variant="text" width={100} height={16} />
              </div>
              <Skeleton variant="rectangular" width={90} height={32} className="rounded-xl" />
            </div>
          </div>

          {/* Second benefit card */}
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid #E8E6E1', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <div className="px-4 pt-4 pb-5" style={{ background: '#FAFAFA' }}>
              <div className="flex items-center justify-between mb-3">
                <Skeleton variant="rectangular" width={54} height={26} className="rounded-full" />
                <Skeleton variant="text" width={60} height={14} />
              </div>
              <Skeleton variant="text" width={80} height={40} className="mb-1" />
              <Skeleton variant="text" width={70} height={14} />
            </div>
            <div className="px-4 py-3 flex justify-between items-center" style={{ borderTop: '1px solid #E8E6E1' }}>
              <div className="space-y-1">
                <Skeleton variant="text" width={60} height={10} />
                <Skeleton variant="text" width={100} height={16} />
              </div>
              <Skeleton variant="rectangular" width={90} height={32} className="rounded-xl" />
            </div>
          </div>

          {/* "Más beneficios" heading */}
          <Skeleton variant="text" width={110} height={18} />

          {/* Other benefit rows */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ border: '1px solid #E8E6E1' }}
            >
              <div className="flex items-center gap-3">
                <Skeleton variant="rectangular" width={44} height={26} className="rounded-lg" />
                <div className="space-y-1">
                  <Skeleton variant="text" width={90} height={14} />
                  <Skeleton variant="text" width={60} height={10} />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Skeleton variant="text" width={50} height={12} />
                <Skeleton variant="circular" width={16} height={16} />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Fixed CTA bar */}
      <div
        className="fixed bottom-0 left-0 w-full z-50 p-4"
        style={{ background: 'rgba(255,255,255,0.95)', borderTop: '1px solid #E8E6E1' }}
      >
        <Skeleton variant="rectangular" width="100%" height={56} className="rounded-2xl" />
      </div>
    </div>
  );
};

export default SkeletonBusinessDetailPage;
