import React from 'react';
import Skeleton from '../ui/Skeleton';

/**
 * Full-page skeleton for the BenefitDetailPage
 */
const SkeletonBenefitDetailPage: React.FC = () => {
  return (
    <div className="bg-blink-bg min-h-screen flex flex-col relative overflow-x-hidden" aria-hidden="true">
      <main className="flex-1 overflow-y-auto pb-32">
        {/* Hero — dark indigo gradient */}
        <div
          className="relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #3730A3 0%, #4F46E5 100%)', minHeight: 240 }}
        >
          {/* Floating nav buttons */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-6 z-20">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
            >
              <Skeleton variant="circular" width={20} height={20} style={{ opacity: 0.5 }} />
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
            >
              <Skeleton variant="circular" width={20} height={20} style={{ opacity: 0.5 }} />
            </div>
          </div>

          {/* Logo + business name + bank badge */}
          <div className="relative z-10 flex flex-col items-center pt-20 pb-8 px-6 text-center gap-3">
            <Skeleton
              variant="rectangular"
              width={72}
              height={72}
              className="rounded-[20px]"
              style={{ opacity: 0.5 }}
            />
            <Skeleton variant="text" width={130} height={22} style={{ opacity: 0.5 }} />
            <Skeleton variant="rectangular" width={120} height={28} className="rounded-full" style={{ opacity: 0.5 }} />
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Main Benefit Card */}
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8E6E1' }}
          >
            {/* Discount hero */}
            <div className="flex flex-col items-center text-center px-6 pt-8 pb-7">
              <Skeleton variant="text" width={70} height={12} className="mb-4" />
              {/* Big number */}
              <Skeleton variant="text" width={120} height={96} className="mb-2" />
              <Skeleton variant="text" width={80} height={14} className="mb-5" />
              {/* Bank badges */}
              <div className="flex items-center gap-2">
                <Skeleton variant="rectangular" width={90} height={30} className="rounded-full" />
                <Skeleton variant="rectangular" width={70} height={30} className="rounded-full" />
              </div>
            </div>

            {/* Days of week */}
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #E8E6E1' }}>
              <Skeleton variant="text" width={80} height={10} className="mb-2.5" />
              <div className="flex gap-1.5">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} variant="rectangular" width="100%" height={32} className="rounded-xl flex-1" />
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #E8E6E1' }}>
              <Skeleton variant="text" width="90%" height={14} className="mb-1.5" />
              <Skeleton variant="text" width="70%" height={14} />
            </div>

            {/* Footer */}
            <div className="px-5 py-4 flex items-center justify-between">
              <Skeleton variant="text" width={120} height={10} />
              <Skeleton variant="text" width={80} height={10} />
            </div>
          </div>

          {/* Expandable sections */}
          {['Términos y condiciones', 'Sucursales adheridas', 'Tarjetas adheridas'].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl overflow-hidden"
              style={{ border: '1px solid #E8E6E1' }}
            >
              <div className="w-full px-4 py-3.5 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <Skeleton variant="rectangular" width={32} height={32} className="rounded-xl" />
                  <Skeleton variant="text" width={160} height={14} />
                </div>
                <Skeleton variant="circular" width={20} height={20} />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Fixed Bottom CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 flex gap-3 z-20"
        style={{ background: 'rgba(255,255,255,0.95)', borderTop: '1px solid #E8E6E1' }}
      >
        <Skeleton variant="rectangular" width="100%" height={56} className="rounded-2xl flex-1" />
        <Skeleton variant="rectangular" width={56} height={56} className="rounded-2xl" />
      </div>
    </div>
  );
};

export default SkeletonBenefitDetailPage;
