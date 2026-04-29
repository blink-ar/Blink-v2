import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

type Platform = 'ios' | 'android';

function detectPlatform(): Platform | null {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
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

const IOSSteps = () => (
  <div className="space-y-4">
    <Step num={1}>
      En Safari, tocá
      <Pill icon={<ShareIcon />} label="Compartir" />
      en la barra inferior de la pantalla
    </Step>
    <Step num={2}>
      Desplazate y tocá <strong>"Agregar a inicio"</strong>
    </Step>
    <Step num={3}>
      Confirmá tocando <strong>"Agregar"</strong>
    </Step>
  </div>
);

const AndroidSteps = () => (
  <div className="space-y-4">
    <Step num={1}>
      En Chrome, tocá el menú
      <Pill icon={<DotsIcon />} label="⋮" />
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

const InstallPWAPopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY) || isRunningStandalone()) return;
    const p = detectPlatform();
    if (!p) return;
    setPlatform(p);
    const timer = setTimeout(() => setIsVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setIsVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  if (!isVisible || !platform) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={dismiss}
    >
      <div
        className="w-full bg-blink-surface rounded-t-3xl relative animate-slide-up"
        style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-8">
          {/* Handle bar */}
          <div className="w-10 h-1 bg-blink-border rounded-full mx-auto mb-5" />

          {/* Close button */}
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-blink-bg flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X size={16} className="text-blink-muted" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <img
              src="/pwa-192x192.png"
              alt="Blink"
              className="w-12 h-12 rounded-2xl flex-shrink-0"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
            />
            <div>
              <h2 className="font-bold text-blink-ink text-base leading-tight">
                Instalá Blink
              </h2>
              <p className="text-blink-muted text-sm mt-0.5">
                {platform === 'ios'
                  ? 'Seguí estos pasos en Safari'
                  : 'Seguí estos pasos en Chrome'}
              </p>
            </div>
          </div>

          {/* Steps */}
          {platform === 'ios' ? <IOSSteps /> : <AndroidSteps />}

          {/* Dismiss button */}
          <button
            onClick={dismiss}
            className="mt-6 w-full py-3.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWAPopup;
