import React, { useState } from "react";

interface TouchButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  isLoading?: boolean;
  touchOptimized?: boolean;
  animationIntensity?: "subtle" | "normal" | "enhanced";
}

const variants = {
  primary:
    "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm",
  secondary:
    "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900 border border-gray-300",
  ghost: "bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-700",
  danger: "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm",
};

const sizes = {
  sm: "px-3 py-2 text-sm min-h-[36px]",
  md: "px-4 py-3 text-base min-h-[44px]", // 44px minimum for touch
  lg: "px-6 py-4 text-lg min-h-[48px]",
};

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  isLoading = false,
  touchOptimized = true,
  animationIntensity = "normal",
  className = "",
  disabled,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);

  // Simple reduced motion detection
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Animation intensity settings
  const getAnimationClasses = () => {
    if (prefersReducedMotion) return "";

    const intensity = {
      subtle: {
        hover: "hover:scale-[1.01] hover:shadow-sm",
        active: "active:scale-[0.99]",
        transition: "transition-all duration-150 ease-out",
      },
      normal: {
        hover: "hover:scale-[1.02] hover:shadow-md",
        active: "active:scale-[0.98]",
        transition: "transition-all duration-150 ease-out",
      },
      enhanced: {
        hover: "hover:scale-[1.03] hover:shadow-lg hover:-translate-y-0.5",
        active: "active:scale-[0.97] active:translate-y-0",
        transition: "transition-all duration-200 ease-out",
      },
    };

    return [
      intensity[animationIntensity].transition,
      intensity[animationIntensity].hover,
      intensity[animationIntensity].active,
    ].join(" ");
  };

  const baseClasses = [
    "inline-flex items-center justify-center",
    "font-medium rounded-lg",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    // Touch optimizations
    touchOptimized && "touch-manipulation", // Improves touch responsiveness
    touchOptimized && "select-none", // Prevents text selection on touch
    // Animation classes
    getAnimationClasses(),
    // Performance optimization
    "will-change-transform",
    // Pressed state
    isPressed && !disabled && "scale-95",
  ].filter(Boolean);

  const variantClasses = variants[variant];
  const sizeClasses = sizes[size];
  const widthClass = fullWidth ? "w-full" : "";

  const allClasses = [
    ...baseClasses,
    variantClasses,
    sizeClasses,
    widthClass,
    className,
  ].join(" ");

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  return (
    <button
      className={allClasses}
      disabled={disabled || isLoading}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <span>{children}</span>
      )}
    </button>
  );
};
