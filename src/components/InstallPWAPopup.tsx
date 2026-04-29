import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

type Platform = 'ios-safari' | 'ios-chrome' | 'android';

function detectPlatform(): Platform | null {
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);
  if (isIOS) {
    const isSafari = /safari/i.test(ua) && !/crios|fxios|opios|edgios/i.test(ua);
    return isSafari ? 'ios-safari' : 'ios-chrome';
  }
  if (isAndroid) return 'android';
  return null;
}

function isRunningStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

const DISMISSED_KEY = 'blink_install_popup_dismissed';

const ShareIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="inline">
    <path d="M7 1v8M4 4l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 8v4a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const DotsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="inline">
    <circle cx="7" cy="2.5" r="1.2" fill="currentColor" />
    <circle cx="7" cy="7" r="1.2" fill="currentColor" />
    <circle cx="7" cy="11.5" r="1.2" fill="currentColor" />
  </svg>
);

const Pill: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-lg font-semibold text-xs align-middle mx-0.5">
    {icon}
    {label}
  </span>
);

const Step: React.FC<{ num: number; children: React.ReactNode }> = ({ num, children }) => (
  <div className="flex items-start gap-3">
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white"
      style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
    >
      {num}
    </div>
    <p className="text-sm text-blink-ink leading-relaxed">{children}</p>
  </div>
);

const IOSSafariSteps = () => (
  <div className="space-y-4">
    <Step num={1}>
      Tocá
      <Pill icon={<ShareIcon />} label="Compartir" />
      en la barra inferior de Safari
    </Step>
    <Step num={2}>
      Tocá <strong>"Ver más"</strong> al final de la lista de opciones
    </Step>
    <Step num={3}>
      Tocá <strong>"Agregar a inicio"</strong>
    </Step>
    <Step num={4}>
      Confirmá tocando <strong>"Agregar"</strong>
    </Step>
  </div>
);

const IOSChromeSteps = () => (
  <div className="space-y-4">
    <Step num={1}>
      Tocá
      <Pill icon={<ShareIcon />} label="Compartir" />
      en la barra inferior de Chrome
    </Step>
    <Step num={2}>
      Tocá <strong>"Ver más"</strong> al final de la lista de opciones
    </Step>
    <Step num={3}>
      Tocá <strong>"Agregar a inicio"</strong>
    </Step>
    <Step num={4}>
      Confirmá tocando <strong>"Agregar"</strong>
    </Step>
  </div>
);

const AndroidSteps = () => (
  <div className="space-y-4">
    <Step num={1}>
      En Chrome, tocá el menú
      <Pill icon={<DotsIcon />} label="Menú" />
      en la esquina superior derecha
    </Step>
    <Step num={2}>
      Tocá <strong>"Agregar a pantalla de inicio"</strong>
    </Step>
    <Step num={3}>
      Confirmá tocando <strong>"Agregar"</strong>
    </Step>
  </div>
);

const subtitleMap: Record<Platform, string> = {
  'ios-safari': 'Seguí estos pasos en Safari',
  'ios-chrome': 'Seguí estos pasos en Chrome',
  'android': 'Seguí estos pasos en Chrome',
};

const InstallPWABanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [platform, setPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY) || isRunningStandalone()) return;
    const p = detectPlatform();
    if (!p) return;
    setPlatform(p);
    setShowBanner(true);
  }, []);

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBanner(false);
    setShowSheet(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  if (!showBanner || !platform) return null;

  return (
    <>
      {/* Banner card */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white"
        style={{
          border: '1.5px solid rgba(99,102,241,0.2)',
          boxShadow: '0 2px 12px rgba(99,102,241,0.08)',
        }}
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>
            install_mobile
          </span>
        </div>

        <button className="flex-1 text-left min-w-0" onClick={() => setShowSheet(true)}>
          <p className="text-sm font-semibold text-blink-ink leading-tight">Instalá la app de Blink</p>
          <p className="text-xs text-blink-muted mt-0.5 truncate">Agregá la app a tu pantalla de inicio</p>
        </button>

        <button
          onClick={() => setShowSheet(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary flex-shrink-0"
          style={{ background: 'rgba(99,102,241,0.08)' }}
        >
          Cómo
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
        </button>

        <button
          onClick={dismiss}
          className="w-7 h-7 rounded-full flex items-center justify-center text-blink-muted flex-shrink-0"
          aria-label="Cerrar"
        >
          <X size={14} />
        </button>
      </div>

      {/* Instruction sheet */}
      {showSheet && (
        <div
          className="fixed inset-0 z-[100] flex items-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={() => setShowSheet(false)}
        >
          <div
            className="w-full bg-blink-surface rounded-t-3xl relative animate-slide-up"
            style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-8">
              <div className="w-10 h-1 bg-blink-border rounded-full mx-auto mb-5" />

              <button
                onClick={() => setShowSheet(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-blink-bg flex items-center justify-center"
                aria-label="Cerrar"
              >
                <X size={16} className="text-blink-muted" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <img
                  src="/pwa-192x192.png"
                  alt="Blink"
                  className="w-12 h-12 rounded-2xl flex-shrink-0"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                />
                <div>
                  <h2 className="font-bold text-blink-ink text-base leading-tight">Instalá la app de Blink</h2>
                  <p className="text-blink-muted text-sm mt-0.5">{subtitleMap[platform]}</p>
                </div>
              </div>

              {platform === 'ios-safari' && <IOSSafariSteps />}
              {platform === 'ios-chrome' && <IOSChromeSteps />}
              {platform === 'android' && <AndroidSteps />}

              <button
                onClick={() => setShowSheet(false)}
                className="mt-6 w-full py-3.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallPWABanner;
