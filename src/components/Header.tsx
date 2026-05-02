import React from "react";
import { Bell, BellOff } from "lucide-react";
import { Link } from "react-router-dom";
import { usePushNotifications } from "../hooks/usePushNotifications";

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title = "Blink" }) => {
  const { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushNotifications();

  const handleBellClick = () => {
    if (isSubscribed) {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  const bellLabel = isSubscribed
    ? "Desactivar notificaciones"
    : "Activar notificaciones";

  return (
    <div className="modern-header header safe-area-top header-slide-down">
      {/* Main Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-white border-b border-gray-200">
        {/* Left: App Title */}
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

        {/* Right: Notification Bell */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isSupported && permission !== "denied" && (
            <button
              onClick={handleBellClick}
              disabled={isLoading}
              className="relative touch-target touch-button p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              style={{
                minWidth: "var(--touch-target-min)",
                minHeight: "var(--touch-target-min)",
                borderRadius: "var(--radius-full)",
              }}
              aria-label={bellLabel}
              title={bellLabel}
            >
              {isSubscribed ? (
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 fill-current text-primary-600" />
              ) : (
                <BellOff className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
