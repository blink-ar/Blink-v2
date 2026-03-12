import { useState, useEffect } from 'react';

const STORAGE_KEY = 'blink.installBannerDismissed';

type Platform = 'ios' | 'android' | null;

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return null;
}

function isAlreadyInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// Mini visual representations of the actual UI buttons to tap
function IOSShareIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="8" y="10" width="12" height="14" rx="2" stroke="#6366F1" strokeWidth="1.8" fill="none"/>
      <path d="M14 2v13M11 5l3-3 3 3" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IOSAddIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="3" y="3" width="22" height="22" rx="5" stroke="#6366F1" strokeWidth="1.8" fill="none"/>
      <path d="M14 9v10M9 14h10" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function AndroidMenuIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="7" r="2" fill="#6366F1"/>
      <circle cx="14" cy="14" r="2" fill="#6366F1"/>
      <circle cx="14" cy="21" r="2" fill="#6366F1"/>
    </svg>
  );
}

function AndroidAddIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="3" y="16" width="14" height="10" rx="2" stroke="#6366F1" strokeWidth="1.8" fill="none"/>
      <path d="M10 21h1M10 19v4" stroke="#6366F1" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M20 3v10M15 8h10" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="11" stroke="#10B981" strokeWidth="1.8" fill="none"/>
      <path d="M9 14l3.5 3.5L19 10" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (isAlreadyInstalled()) return;
    const p = detectPlatform();
    if (!p) return;
    setPlatform(p);
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setClosing(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, '1');
      setVisible(false);
      setClosing(false);
    }, 250);
  };

  if (!visible && !closing) return null;

  const steps =
    platform === 'ios'
      ? [
          {
            visual: <IOSShareIcon />,
            label: 'Tocá',
            sublabel: platform === 'ios' ? '"Compartir"' : '',
            hint: 'El ícono ↑ de la barra inferior de Safari',
          },
          {
            visual: <IOSAddIcon />,
            label: 'Elegí',
            sublabel: '"Al inicio"',
            hint: 'Deslizá el menú y tocá esa opción',
          },
          {
            visual: <CheckIcon />,
            label: 'Tocá',
            sublabel: '"Agregar"',
            hint: 'Blink queda en tu pantalla',
          },
        ]
      : [
          {
            visual: <AndroidMenuIcon />,
            label: 'Abrí',
            sublabel: 'el menú ⋮',
            hint: 'Los tres puntos arriba a la derecha en Chrome',
          },
          {
            visual: <AndroidAddIcon />,
            label: 'Tocá',
            sublabel: '"Agregar"',
            hint: '"Agregar a pantalla de inicio"',
          },
          {
            visual: <CheckIcon />,
            label: 'Confirmá',
            sublabel: '"Agregar"',
            hint: 'Blink queda en tu pantalla',
          },
        ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: closing ? 0 : 1,
          transition: 'opacity 0.25s ease',
        }}
        onClick={dismiss}
      />

      {/* Centered modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-5 pointer-events-none"
      >
        <div
          className="w-full max-w-[340px] bg-white rounded-3xl overflow-hidden pointer-events-auto"
          style={{
            boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
            transform: closing ? 'scale(0.92)' : 'scale(1)',
            opacity: closing ? 0 : 1,
            transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease',
          }}
        >
          {/* Top gradient band */}
          <div
            className="relative px-5 pt-6 pb-5 flex flex-col items-center text-center"
            style={{ background: 'linear-gradient(160deg, #6366F1 0%, #818CF8 100%)' }}
          >
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <span className="material-symbols-outlined text-white" style={{ fontSize: 16 }}>close</span>
            </button>

            {/* App icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '2px solid rgba(255,255,255,0.35)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }}
            >
              <span className="text-white font-bold text-2xl tracking-tight">B</span>
            </div>

            <h2 className="text-white font-bold text-xl leading-tight mb-1">
              Guardá Blink como app
            </h2>
            <p className="text-white/75 text-sm leading-snug">
              Acceso instantáneo desde tu pantalla,<br />sin abrir el navegador.
            </p>
          </div>

          {/* Steps */}
          <div className="px-4 py-5">
            <div className="flex items-start">
              {steps.map((step, i) => (
                <div key={i} className="contents">
                  <div className="flex-1 flex flex-col items-center text-center">
                    {/* Icon bubble */}
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
                      style={{
                        background: i === steps.length - 1 ? '#F0FDF4' : '#EEF2FF',
                        border: `1.5px solid ${i === steps.length - 1 ? '#BBF7D0' : '#C7D2FE'}`,
                      }}
                    >
                      {step.visual}
                    </div>

                    {/* Step number */}
                    <span className="text-[10px] font-bold mb-0.5" style={{ color: '#9CA3AF' }}>
                      Paso {i + 1}
                    </span>

                    {/* Action */}
                    <p className="text-xs font-semibold text-blink-ink leading-tight">
                      {step.label}
                    </p>
                    <p
                      className="text-xs font-bold leading-tight"
                      style={{ color: i === steps.length - 1 ? '#10B981' : '#6366F1' }}
                    >
                      {step.sublabel}
                    </p>

                    {/* Hint */}
                    <p className="text-[10px] text-blink-muted mt-1 leading-tight px-0.5">
                      {step.hint}
                    </p>
                  </div>

                  {/* Arrow between steps */}
                  {i < steps.length - 1 && (
                    <div className="flex-shrink-0 flex items-start pt-5 px-0.5">
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#C7D2FE' }}>
                        arrow_forward
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="px-4 pb-5 -mt-4">
            <button
              onClick={dismiss}
              className="w-full h-12 rounded-2xl font-bold text-sm text-white transition-all duration-150 active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              }}
            >
              ¡Entendido!
            </button>
            <button
              onClick={dismiss}
              className="w-full h-9 mt-1 text-xs text-blink-muted transition-colors"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
