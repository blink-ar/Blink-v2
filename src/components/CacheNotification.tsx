import React, { useState, useEffect } from "react";

interface CacheNotificationProps {
  show: boolean;
  message: string;
  type: "success" | "warning" | "error" | "info";
  onClose?: () => void;
}

export const CacheNotification: React.FC<CacheNotificationProps> = ({
  show,
  message,
  type,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    setIsVisible(show);
    if (show && onClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 2000); // Auto-hide after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!isVisible) return null;

  const getStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-100 border-green-400 text-green-700";
      case "warning":
        return "bg-yellow-100 border-yellow-400 text-yellow-700";
      case "error":
        return "bg-red-100 border-red-400 text-red-700";
      case "info":
      default:
        return "bg-blue-100 border-blue-400 text-blue-700";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "info":
      default:
        return "ℹ️";
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`border-l-4 p-4 rounded-lg shadow-lg ${getStyles()}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-lg">{getIcon()}</span>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          {onClose && (
            <div className="ml-auto pl-3">
              <button
                onClick={() => {
                  setIsVisible(false);
                  onClose();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>✕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
