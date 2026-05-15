import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { InstallSheet } from './NotificationBanner';

// Separate keys so showing the install prompt on iOS Safari doesn't block
// the notification prompt after the user installs the PWA (they share localStorage).
const NOTIF_PROMPT_SHOWN_KEY = 'blink_notif_prompt_shown';
const IOS_INSTALL_SHOWN_KEY = 'blink_ios_install_shown';

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export const NotificationPermissionModal: React.FC = () => {
  const { isLoading, subscribe } = usePushNotifications();
  const [visible, setVisible] = useState(false);
  const [showInstallSheet, setShowInstallSheet] = useState(false);
  const [iosNotStandalone, setIosNotStandalone] = useState(false);

  useEffect(() => {
    const onIOS = isIOS();
    const standalone = isStandalone();

    if (onIOS && !standalone) {
      if (localStorage.getItem(IOS_INSTALL_SHOWN_KEY) === '1') return;
      setIosNotStandalone(true);
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }

    if (localStorage.getItem(NOTIF_PROMPT_SHOWN_KEY) === '1') return;

    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    if (!supported || Notification.permission !== 'default') return;

    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    if (iosNotStandalone) {
      localStorage.setItem(IOS_INSTALL_SHOWN_KEY, '1');
    } else {
      localStorage.setItem(NOTIF_PROMPT_SHOWN_KEY, '1');
    }
    setVisible(false);
  };

  const handleEnable = async () => {
    await subscribe();
    dismiss();
  };

  const handleIOSInstall = () => {
    dismiss();
    setShowInstallSheet(true);
  };

  if (!visible && !showInstallSheet) return null;

  return (
    <>
      {visible && (
        <>
          <div
            className="fixed inset-0 z-[90] bg-black/30"
            onClick={dismiss}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-[91] rounded-t-3xl bg-white px-6 pt-5 pb-10"
            style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

            <button onClick={dismiss} className="absolute top-4 right-4 p-2 text-gray-400">
              <X className="w-5 h-5" />
            </button>

            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
            >
              <Bell className="w-7 h-7 text-white" />
            </div>

            <h2 className="text-center font-bold text-gray-900 text-lg mb-2">
              Activá notificaciones
            </h2>
            <p className="text-center text-gray-500 text-sm mb-6">
              {iosNotStandalone
                ? 'Instalá Blink en tu pantalla de inicio para recibir alertas de descuentos'
                : 'Enterate primero de nuevas ofertas y descuentos exclusivos'}
            </p>

            <button
              onClick={iosNotStandalone ? handleIOSInstall : handleEnable}
              disabled={isLoading}
              className="w-full h-14 rounded-2xl font-semibold text-white mb-3 disabled:opacity-60 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
            >
              {isLoading ? '...' : iosNotStandalone ? 'Cómo instalar' : 'Activar notificaciones'}
            </button>

            <button
              onClick={dismiss}
              className="w-full h-12 rounded-2xl font-medium text-gray-500 bg-gray-100"
            >
              Ahora no
            </button>
          </div>
        </>
      )}

      {showInstallSheet && <InstallSheet onClose={() => setShowInstallSheet(false)} />}
    </>
  );
};
