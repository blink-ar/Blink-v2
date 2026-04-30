import React from 'react';
import Skeleton from '../ui/Skeleton';

const SkeletonBusinessDetailPage: React.FC = () => {
  return (
    <div className="bg-blink-bg text-blink-ink font-body flex flex-col" style={{ height: '100dvh' }} aria-hidden="true">

      {/* Header */}
      <header className="bg-white flex-shrink-0" style={{ borderBottom: '1px solid #E8E6E1' }}>

        {/* Top row */}
        <div className="flex items-center gap-3 px-4 py-4">
          {/* Back button */}
          <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full">
            <Skeleton variant="circular" width={22} height={22} />
          </div>

          {/* Business logo */}
          <Skeleton
            variant="rectangular"
            width={64}
            height={64}
            className="rounded-2xl flex-shrink-0"
          />

          {/* Name / category / benefit count */}
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton variant="text" width={140} height={17} />
            <Skeleton variant="text" width={80} height={12} />
            <Skeleton variant="text" width={110} height={12} />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-9 h-9 flex items-center justify-center">
                <Skeleton variant="circular" width={22} height={22} />
              </div>
            ))}
          </div>
        </div>

        {/* Filter pills */}
        <div className="px-4 py-3 flex gap-2" style={{ borderTop: '1px solid #E8E6E1' }}>
          <Skeleton variant="rectangular" width={72} height={36} className="rounded-xl flex-shrink-0" />
          <Skeleton variant="rectangular" width={110} height={36} className="rounded-xl flex-shrink-0" />
          <Skeleton variant="rectangular" width={90} height={36} className="rounded-xl flex-shrink-0" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-4">
        <div className="space-y-3 pt-3 px-4">

          {/* Bank group cards */}
          {[2, 3, 2].map((rowCount, gi) => (
            <div
              key={gi}
              className="bg-white rounded-2xl overflow-hidden"
              style={{ border: '1px solid #E8E6E1', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            >
              {/* Bank header */}
              <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: '#F3F4F6' }}>
                <Skeleton variant="rectangular" width={28} height={28} className="rounded-md flex-shrink-0" />
                <Skeleton variant="text" width={90} height={13} />
              </div>

              {/* Benefit rows */}
              {Array.from({ length: rowCount }).map((_, ri) => (
                <div
                  key={ri}
                  className="px-4 py-4"
                  style={{ borderTop: '1px solid #E8E6E1' }}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton variant="text" width="75%" height={15} />
                      <Skeleton variant="text" width="50%" height={11} />
                      <div className="flex gap-1.5">
                        <Skeleton variant="rectangular" width={44} height={18} className="rounded-md" />
                        <Skeleton variant="rectangular" width={100} height={18} className="rounded-md" />
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <div className="text-right space-y-1">
                        <Skeleton variant="text" width={48} height={26} />
                        <Skeleton variant="text" width={40} height={11} />
                      </div>
                      <Skeleton variant="circular" width={18} height={18} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

        </div>
      </main>
    </div>
  );
};

export default SkeletonBusinessDetailPage;
