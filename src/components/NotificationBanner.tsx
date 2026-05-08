import React, { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { usePushNotifications } from "../hooks/usePushNotifications";

const DISMISSED_KEY = "blink_notif_banner_dismissed";

export const NotificationBanner: React.FC = () => {
  const { isSupported, permission, isSubscribed, isLoading, subscribe } =
    usePushNotifications();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === "true");
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  };

  const handleEnable = async () => {
    await subscribe();
    // If they granted permission, hide the banner
    if (Notification.permission === "granted") {
      handleDismiss();
    }
  };

  if (!isSupported || dismissed || isSubscribed || permission === "denied") {
    return null;
  }

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
        className="flex-shrink-0 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {isLoading ? "..." : "Activar"}
      </button>

      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 text-blue-400 hover:text-blue-600 transition-colors"
        aria-label="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
