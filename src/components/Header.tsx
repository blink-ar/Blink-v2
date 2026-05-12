import React, { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Link } from "react-router-dom";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { InstallSheet } from "./NotificationBanner";

function isIOSBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  if (!/iphone|ipad|ipod/i.test(ua)) return false;
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;
  return !standalone;
}

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title = "Blink" }) => {
  const { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushNotifications();

  // Evaluated synchronously so the bell is visible on the very first render.
  const [iosNotInstalled] = useState<boolean>(isIOSBrowser);
  const [showInstallSheet, setShowInstallSheet] = useState(false);

  const showBell = iosNotInstalled || (isSupported && permission !== "denied");

  const handleBellClick = () => {
    if (iosNotInstalled) {
      setShowInstallSheet(true);
    } else if (isSubscribed) {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  return (
    <>
      <div className="modern-header header safe-area-top header-slide-down">
        <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <Link
              to="/"
              className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 hover:text-primary-600 transition-colors touch-target"
              style={{
                fontFamily: "var(--font-primary)",
                fontWeight: "var(--font-bold)",
                color: "var(--color-gray-900)",
              }}
            >
              {title}
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {showBell && (
              <button
                onClick={handleBellClick}
                disabled={!iosNotInstalled && isLoading}
                className="relative touch-target touch-button p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                style={{
                  minWidth: "var(--touch-target-min)",
                  minHeight: "var(--touch-target-min)",
                  borderRadius: "var(--radius-full)",
                }}
                aria-label={
                  iosNotInstalled
                    ? "Instalá la app para activar notificaciones"
                    : isSubscribed
                    ? "Desactivar notificaciones"
                    : "Activar notificaciones"
                }
              >
                {iosNotInstalled ? (
                  <>
                    <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                      1
                    </span>
                  </>
                ) : isSubscribed ? (
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6 fill-current text-primary-600" />
                ) : (
                  <BellOff className="h-5 w-5 sm:h-6 sm:w-6" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      {showInstallSheet && <InstallSheet onClose={() => setShowInstallSheet(false)} />}
    </>
  );
};
