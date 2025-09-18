import React, { useEffect, useState } from "react";
import {
  useAnimatedVisibility,
  useReducedMotion,
} from "../../hooks/useAnimation";
import { animationClasses } from "../../utils/animationUtils";

interface NotificationToastProps {
  /** Whether the toast is visible */
  isVisible: boolean;
  /** Toast message */
  message: string;
  /** Toast type */
  type?: "info" | "success" | "warning" | "error";
  /** Position on screen */
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
  /** Auto-dismiss duration in milliseconds (0 to disable) */
  duration?: number;
  /** Callback when toast is dismissed */
  onDismiss?: () => void;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  isVisible,
  message,
  type = "info",
  position = "top-right",
  duration = 5000,
  onDismiss,
  showCloseButton = true,
  className = "",
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { shouldRender, animationClass } = useAnimatedVisibility(
    isVisible,
    300
  );
  const prefersReducedMotion = useReducedMotion();

  // Auto-dismiss functionality
  useEffect(() => {
    if (!isVisible || duration === 0 || isHovered) return;

    const timer = setTimeout(() => {
      onDismiss?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, duration, isHovered, onDismiss]);

  const types = {
    info: {
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-800",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    success: {
      bg: "bg-green-50 border-green-200",
      text: "text-green-800",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    warning: {
      bg: "bg-yellow-50 border-yellow-200",
      text: "text-yellow-800",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    error: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-800",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  };

  const positions = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/2 transform -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
  };

  const getAnimationClass = () => {
    if (prefersReducedMotion) return "";

    // Different entrance animations based on position
    if (position.includes("top")) {
      return isVisible ? "animate-slide-down" : "animate-slide-up";
    } else {
      return isVisible ? "animate-slide-up" : "animate-slide-down";
    }
  };

  if (!shouldRender) return null;

  const toastClasses = [
    "fixed z-50 max-w-sm w-full",
    "bg-white border rounded-lg shadow-lg",
    "p-4 pointer-events-auto",
    positions[position],
    types[type].bg,
    getAnimationClass(),
    animationClasses.transitionAll,
    animationClasses.willChangeTransform,
    "hover:shadow-xl hover:scale-[1.02]",
    className,
  ].join(" ");

  return (
    <div
      className={toastClasses}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${types[type].text}`}>
          {types[type].icon}
        </div>

        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${types[type].text}`}>{message}</p>
        </div>

        {showCloseButton && (
          <div className="ml-4 flex-shrink-0">
            <button
              className={`
                inline-flex rounded-md p-1.5 
                ${types[type].text} 
                hover:bg-black/5 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                ${animationClasses.transitionColors}
                hover:scale-110 active:scale-95
              `}
              onClick={onDismiss}
              aria-label="Dismiss notification"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Progress bar for auto-dismiss */}
      {duration > 0 && !isHovered && (
        <div className="mt-2 w-full bg-black/10 rounded-full h-1 overflow-hidden">
          <div
            className={`h-full ${types[type].text.replace(
              "text-",
              "bg-"
            )} rounded-full animate-progress`}
            style={{
              animation: `progress ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;
