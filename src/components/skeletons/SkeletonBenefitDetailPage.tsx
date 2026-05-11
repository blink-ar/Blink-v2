import React from 'react';
import Skeleton from '../ui/Skeleton';

const SkeletonBenefitDetailPage: React.FC = () => {
  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col relative overflow-x-hidden" aria-hidden="true">
      <main className="flex-1 overflow-y-auto pb-32">

        {/* Hero — bank accent bg (light indigo placeholder) */}
        <div
          className="relative"
          style={{
            background: '#EEF2FF',
            minHeight: 220,
            position: 'sticky',
            top: 0,
            zIndex: 50,
            boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          }}
        >
          {/* Floating nav buttons */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-6 z-20">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <Skeleton variant="circular" width={20} height={20} />
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <Skeleton variant="circular" width={20} height={20} />
            </div>
          </div>

          {/* Logo + bank badge + business name + tags */}
          <div className="relative z-10 flex flex-col items-center pt-20 pb-7 px-6 text-center">
            <div className="relative mb-3">
              <Skeleton variant="rectangular" width={72} height={72} className="rounded-[20px]" />
              {/* Bank badge */}
              <div
                className="absolute -bottom-2 -right-2 w-[26px] h-[26px] rounded-full"
                style={{ background: '#C7D2FE', border: '2.5px solid white' }}
              />
            </div>

            <Skeleton variant="text" width={130} height={22} className="mb-3" />

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Skeleton variant="rectangular" width={120} height={28} className="rounded-full" />
              <Skeleton variant="rectangular" width={80} height={28} className="rounded-full" />
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">

          {/* Discount hero card */}
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8E6E1' }}
          >
            <div className="flex flex-col items-center text-center px-6 pt-7 pb-7">
              <Skeleton variant="text" width={160} height={13} className="mb-5" />
              {/* Big discount number */}
              <Skeleton variant="rectangular" width={140} height={96} className="rounded-xl mb-3" />
              <Skeleton variant="text" width={80} height={14} />
            </div>
          </div>

          {/* Condiciones card */}
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8E6E1' }}
          >
            <div className="px-5 pt-5 pb-4">
              <Skeleton variant="text" width={100} height={15} className="mb-4" />

              <div className="divide-y divide-blink-border">
                {/* Condition rows */}
                {[100, 130, 90, 110].map((w, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <Skeleton variant="text" width={w} height={13} />
                    <Skeleton variant="text" width={80} height={13} />
                  </div>
                ))}

                {/* Days of week */}
                <div className="flex items-center justify-between py-3 gap-3">
                  <Skeleton variant="text" width={100} height={13} className="flex-shrink-0" />
                  <div className="flex gap-1">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <Skeleton key={i} variant="rectangular" width={28} height={28} className="rounded-lg" />
                    ))}
                  </div>
                </div>
              </div>

              <Skeleton variant="text" width="80%" height={11} className="mt-5" />
            </div>
          </div>

          {/* Savings simulator placeholder */}
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8E6E1' }}
          >
            <div className="px-5 py-5 space-y-3">
              <Skeleton variant="text" width={140} height={15} />
              <Skeleton variant="rectangular" width="100%" height={48} className="rounded-xl" />
              <Skeleton variant="rectangular" width="100%" height={36} className="rounded-xl" />
            </div>
          </div>

          {/* Locations card */}
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8E6E1' }}
          >
            <div className="px-5 pt-5 pb-3">
              <Skeleton variant="text" width={110} height={15} className="mb-3" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 py-3" style={{ borderTop: i > 0 ? '1px solid #E8E6E1' : undefined }}>
                  <Skeleton variant="circular" width={18} height={18} className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton variant="text" width="70%" height={13} />
                    <Skeleton variant="text" width="50%" height={11} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accede al beneficio card */}
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #E8E6E1' }}
          >
            <div className="px-5 pt-5 pb-5 space-y-3">
              <Skeleton variant="text" width={150} height={15} />
              <Skeleton variant="text" width={130} height={11} />
              {[0, 1].map((i) => (
                <Skeleton key={i} variant="rectangular" width="100%" height={48} className="rounded-xl" />
              ))}
            </div>
          </div>

          {/* Terms card */}
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid #E8E6E1' }}
          >
            <div className="w-full px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Skeleton variant="rectangular" width={32} height={32} className="rounded-xl flex-shrink-0" />
                <Skeleton variant="text" width={170} height={15} />
              </div>
              <Skeleton variant="circular" width={20} height={20} />
            </div>
          </div>

        </div>
      </main>

      {/* Fixed bottom CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 flex gap-3 z-20"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid #E8E6E1' }}
      >
        <Skeleton variant="rectangular" width="100%" height={56} className="rounded-2xl flex-1" />
        <Skeleton variant="rectangular" width={56} height={56} className="rounded-2xl flex-shrink-0" />
      </div>
    </div>
  );
};

export default SkeletonBenefitDetailPage;
