import React, { useState, useEffect } from "react";
import { Bell, X, Download } from "lucide-react";
import { usePushNotifications } from "../hooks/usePushNotifications";

const NOTIF_DISMISSED_KEY = "blink_notif_banner_dismissed";
const INSTALL_DISMISSED_KEY = "blink_install_popup_dismissed";

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

const ShareIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="inline mx-0.5">
    <path d="M7 1v8M4 4l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 8v4a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const Step: React.FC<{ num: number; children: React.ReactNode }> = ({ num, children }) => (
  <div className="flex items-start gap-3">
    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white bg-blue-500">
      {num}
    </div>
    <p className="text-sm text-gray-700 leading-relaxed">{children}</p>
  </div>
);

const InstallSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div
    className="fixed inset-0 z-[100] flex items-end"
    style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
    onClick={onClose}
  >
    <div
      className="w-full bg-white rounded-t-3xl"
      style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-6 pt-5 pb-8 space-y-4">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-2" />
        <div className="flex items-center gap-3 mb-2">
          <img src="/pwa-192x192.png" alt="Blink" className="w-12 h-12 rounded-2xl flex-shrink-0" />
          <div>
            <h2 className="font-bold text-gray-900 text-base">Instalá la app de Blink</h2>
            <p className="text-gray-500 text-sm">Para activar notificaciones</p>
          </div>
        </div>
        <Step num={1}>
          Tocá <ShareIcon /> <strong>Compartir</strong> en la barra de Safari
        </Step>
        <Step num={2}>
          Tocá <strong>"Agregar a inicio"</strong>
        </Step>
        <Step num={3}>
          Abrí Blink desde tu pantalla de inicio y activá las notificaciones
        </Step>
        <button
          onClick={onClose}
          className="mt-2 w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-blue-600"
        >
          Entendido
        </button>
      </div>
    </div>
  </div>
);

export const NotificationBanner: React.FC = () => {
  const { isSupported, permission, isSubscribed, isLoading, subscribe } =
    usePushNotifications();

  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [iosNotStandalone, setIosNotStandalone] = useState(false);

  useEffect(() => {
    const onIOS = isIOS();
    const standalone = isStandalone();

    if (onIOS && !standalone) {
      setIosNotStandalone(true);
      setDismissed(localStorage.getItem(INSTALL_DISMISSED_KEY) === "1");
    } else {
      setDismissed(localStorage.getItem(NOTIF_DISMISSED_KEY) === "true");
    }
    setReady(true);
  }, []);

  const handleDismiss = () => {
    if (iosNotStandalone) {
      localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
    } else {
      localStorage.setItem(NOTIF_DISMISSED_KEY, "true");
    }
    setDismissed(true);
  };

  const handleEnable = async () => {
    await subscribe();
    if (Notification.permission === "granted") {
      handleDismiss();
    }
  };

  // Don't render until we've read localStorage (avoids flash)
  if (!ready || dismissed) return null;

  // iOS in browser — can't use push without installing the PWA
  if (iosNotStandalone) {
    return (
      <>
        <div className="mx-4 sm:mx-6 md:mx-8 mt-3 mb-1 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex items-center gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
            <Download className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900 leading-snug">
              Instalá la app para notificaciones
            </p>
            <p className="text-xs text-blue-700 leading-snug mt-0.5">
              Agregá Blink a tu pantalla de inicio
            </p>
          </div>
          <button
            onClick={() => setShowSheet(true)}
            className="flex-shrink-0 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg"
          >
            Cómo
          </button>
          <button onClick={handleDismiss} className="flex-shrink-0 p-1 text-blue-400" aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>
        {showSheet && <InstallSheet onClose={() => setShowSheet(false)} />}
      </>
    );
  }

  // Other browsers — only show if push is supported and not already subscribed/denied
  if (!isSupported || isSubscribed || permission === "denied") return null;

  return (
    <div className="mx-4 sm:mx-6 md:mx-8 mt-3 mb-1 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex items-center gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
        <Bell className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blue-900 leading-snug">
          Activá las notificaciones
        </p>
        <p className="text-xs text-blue-700 leading-snug mt-0.5">
          Enterate primero de nuevas ofertas y descuentos
        </p>
      </div>
      <button
        onClick={handleEnable}
        disabled={isLoading}
        className="flex-shrink-0 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-3 py-1.5 rounded-lg disabled:opacity-60"
      >
        {isLoading ? "..." : "Activar"}
      </button>
      <button onClick={handleDismiss} className="flex-shrink-0 p-1 text-blue-400" aria-label="Cerrar">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
