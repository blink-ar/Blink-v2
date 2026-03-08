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
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export default function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;
    if (isAlreadyInstalled()) return;

    const p = detectPlatform();
    if (!p) return;

    setPlatform(p);
    // Small delay so it doesn't flash on first paint
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setClosing(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, '1');
      setVisible(false);
      setClosing(false);
    }, 300);
  };

  if (!visible && !closing) return null;

  const steps =
    platform === 'ios'
      ? [
          {
            icon: 'ios_share',
            title: 'Tocá el botón compartir',
            desc: 'El ícono de cuadrado con flecha, en la barra inferior de Safari.',
          },
          {
            icon: 'add_box',
            title: 'Seleccioná "Agregar a inicio"',
            desc: 'Deslizá hacia abajo en el menú y tocá esa opción.',
          },
          {
            icon: 'check_circle',
            title: 'Confirmá tocando "Agregar"',
            desc: 'Blink aparecerá en tu pantalla como una app nativa.',
          },
        ]
      : [
          {
            icon: 'more_vert',
            title: 'Tocá el menú (⋮)',
            desc: 'Los tres puntos en la esquina superior derecha de Chrome.',
          },
          {
            icon: 'add_to_home_screen',
            title: 'Tocá "Agregar a pantalla inicio"',
            desc: 'Aparece cerca del principio del menú de opciones.',
          },
          {
            icon: 'check_circle',
            title: 'Confirmá tocando "Agregar"',
            desc: 'Blink estará en tu pantalla como una app nativa.',
          },
        ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-300"
        style={{ opacity: closing ? 0 : 1 }}
        onClick={dismiss}
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white"
        style={{
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          transform: closing ? 'translateY(100%)' : 'translateY(0)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-blink-border" />
        </div>

        <div className="px-5 pt-2 pb-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              {/* App icon placeholder */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                  boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                }}
              >
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <div>
                <h2 className="font-bold text-lg text-blink-ink leading-tight">
                  Agregá Blink a tu pantalla de inicio
                </h2>
                <p className="text-sm text-blink-muted mt-0.5">
                  {platform === 'ios'
                    ? 'Accedé como una app nativa en iOS'
                    : 'Accedé como una app nativa en Android'}
                </p>
              </div>
            </div>

            <button
              onClick={dismiss}
              className="w-8 h-8 rounded-full flex items-center justify-center text-blink-muted transition-colors hover:bg-blink-bg flex-shrink-0 -mt-1 -mr-1"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                {/* Step number + line */}
                <div className="flex flex-col items-center flex-shrink-0" style={{ width: 40 }}>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                    }}
                  >
                    <span className="material-symbols-outlined text-white" style={{ fontSize: 20 }}>
                      {step.icon}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className="w-0.5 flex-1 mt-1"
                      style={{ height: 16, background: 'linear-gradient(to bottom, #6366F1, #E8E6E1)' }}
                    />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                      style={{ background: '#EEF2FF', color: '#6366F1' }}
                    >
                      {i + 1}
                    </span>
                    <p className="font-semibold text-sm text-blink-ink">{step.title}</p>
                  </div>
                  <p className="text-xs text-blink-muted mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA button */}
          <button
            onClick={dismiss}
            className="mt-6 w-full h-12 rounded-2xl font-semibold text-sm text-blink-muted transition-all duration-150 active:scale-[0.98]"
            style={{ background: '#F7F6F4', border: '1.5px solid #E8E6E1' }}
          >
            Entendido, ¡gracias!
          </button>
        </div>
      </div>
    </>
  );
}
