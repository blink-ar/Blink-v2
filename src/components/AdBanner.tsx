import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

// Replace these with your real AdSense IDs from adsense.google.com
export const AD_CLIENT = 'ca-pub-XXXXXXXXXX';
export const AD_SLOTS = {
  searchFeed: 'XXXXXXXXXX',      // Slot for inline search result feed
  businessDetail: 'XXXXXXXXXX',  // Slot for business detail page
} as const;

const IS_PLACEHOLDER = AD_CLIENT.includes('XXXXXXXXXX');

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

// Realistic-looking native feed ad — matches the business card row style
function MockFeedAd() {
  return (
    <div
      className="w-full bg-white rounded-2xl overflow-hidden flex"
      style={{ border: '1px solid #E8E6E1', boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center gap-3 px-3.5 py-3 flex-1 min-w-0">
        {/* Brand logo */}
        <div
          className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)', border: '1px solid rgba(0,0,0,0.07)' }}
        >
          <span className="font-black text-base leading-none text-white">G</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-[5px]">
            <h2 className="font-bold text-[13.5px] text-blink-ink leading-snug truncate">
              Galicia Move
            </h2>
            <span
              className="shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide"
              style={{ background: '#EFF6FF', color: '#3B82F6', border: '1px solid #BFDBFE' }}
            >
              Patrocinado
            </span>
          </div>
          <p className="text-[11px] text-blink-muted leading-snug">
            Sacá tu tarjeta y acumulá puntos en cada compra
          </p>
        </div>

        {/* CTA */}
        <div className="shrink-0 flex flex-col items-center text-center" style={{ minWidth: 38 }}>
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap"
            style={{ background: '#0EA5E9', color: '#fff' }}
          >
            Ver más
          </span>
        </div>

        <span className="material-symbols-outlined shrink-0" style={{ fontSize: 16, color: '#D1D5DB' }}>
          chevron_right
        </span>
      </div>
    </div>
  );
}

// Realistic-looking display rectangle ad — shown below the fold on detail pages
function MockRectangleAd() {
  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{ border: '1px solid #E8E6E1', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
    >
      {/* Ad creative */}
      <div
        className="w-full px-5 py-6 flex flex-col gap-3"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)' }}
      >
        {/* Brand row */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}
          >
            <span className="font-black text-base text-white">N</span>
          </div>
          <div>
            <p className="font-bold text-sm text-white leading-tight">Naranja X</p>
            <p className="text-[10px] text-white/60 leading-tight">naranjax.com</p>
          </div>
        </div>

        {/* Headline */}
        <div>
          <p className="font-black text-[22px] leading-tight text-white">
            Hasta 50% OFF
          </p>
          <p className="text-sm text-white/80 mt-0.5 leading-snug">
            en miles de comercios con tu cuenta Naranja X
          </p>
        </div>

        {/* CTA */}
        <button
          className="self-start px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
          style={{ background: '#F97316', color: '#fff', boxShadow: '0 4px 12px rgba(249,115,22,0.40)' }}
        >
          Abrí tu cuenta gratis
        </button>
      </div>

      {/* Bottom bar */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ background: '#F7F6F4', borderTop: '1px solid #E8E6E1' }}
      >
        <span className="text-[9px] font-medium text-blink-muted uppercase tracking-widest select-none">
          Publicidad
        </span>
        <span className="text-[9px] text-blink-muted select-none">Anuncio · naranjax.com</span>
      </div>
    </div>
  );
}

function AdBanner({ slot, format = 'auto', className = '' }: AdBannerProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (IS_PLACEHOLDER || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script not loaded — safe to ignore in dev
    }
  }, []);

  if (IS_PLACEHOLDER) {
    return (
      <div className={`w-full overflow-hidden ${className}`}>
        {format === 'rectangle' ? <MockRectangleAd /> : <MockFeedAd />}
      </div>
    );
  }

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <p className="text-[9px] font-medium text-blink-muted text-center mb-1 uppercase tracking-widest select-none">
        Publicidad
      </p>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

export default AdBanner;
