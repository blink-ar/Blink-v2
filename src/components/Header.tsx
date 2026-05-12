import React, { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { Link } from "react-router-dom";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { InstallSheet } from "./NotificationBanner";

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

const IOS_HEADER_DISMISSED_KEY = "blink_ios_header_notif_dismissed";

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title = "Blink" }) => {
  const { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushNotifications();

  const [iosNotInstalled, setIosNotInstalled] = useState(false);
  const [iosDismissed, setIosDismissed] = useState(false);
  const [showInstallSheet, setShowInstallSheet] = useState(false);

  useEffect(() => {
    if (isIOS() && !isStandalone()) {
      setIosNotInstalled(true);
      setIosDismissed(localStorage.getItem(IOS_HEADER_DISMISSED_KEY) === "1");
    }
  }, []);

  const showBell = iosNotInstalled
    ? !iosDismissed
    : isSupported && permission !== "denied";

  const handleBellClick = () => {
    if (iosNotInstalled) {
      setShowInstallSheet(true);
    } else if (isSubscribed) {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  const handleInstallSheetClose = () => {
    setShowInstallSheet(false);
    localStorage.setItem(IOS_HEADER_DISMISSED_KEY, "1");
    setIosDismissed(true);
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
      {showInstallSheet && <InstallSheet onClose={handleInstallSheetClose} />}
    </>
  );
};
