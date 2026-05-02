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

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

function AdBanner({ slot, format = 'auto', className = '' }: AdBannerProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script not loaded — safe to ignore in dev
    }
  }, []);

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
