import React, { useState, useEffect } from "react";
import {
  useLoadingAnimation,
  useReducedMotion,
} from "../../hooks/useAnimation";
import { animationClasses } from "../../utils/animationUtils";

interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  successText?: string;
  successDuration?: number;
  variant?: "primary" | "secondary" | "success" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  showSuccessState?: boolean;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  children,
  isLoading = false,
  loadingText = "Loading...",
  successText = "Success!",
  successDuration = 2000,
  variant = "primary",
  size = "md",
  fullWidth = false,
  showSuccessState = true,
  className = "",
  disabled,
  onClick,
  ...props
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const { animationState, getLoadingClass } = useLoadingAnimation(isLoading);
  const prefersReducedMotion = useReducedMotion();

  // Handle success state display
  useEffect(() => {
    if (animationState === "success" && showSuccessState) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, successDuration);
      return () => clearTimeout(timer);
    }
  }, [animationState, showSuccessState, successDuration]);

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
    secondary:
      "bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300",
    success: "bg-green-600 hover:bg-green-700 text-white shadow-sm",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm min-h-[36px]",
    md: "px-4 py-3 text-base min-h-[44px]",
    lg: "px-6 py-4 text-lg min-h-[48px]",
  };

  const getAnimationClasses = () => {
    if (prefersReducedMotion) return "";

    return [
      animationClasses.transitionAll,
      "hover:scale-[1.02] hover:shadow-md",
      "active:scale-[0.98]",
      getLoadingClass(),
    ].join(" ");
  };

  const baseClasses = [
    "inline-flex items-center justify-center",
    "font-medium rounded-lg",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "touch-manipulation select-none",
    getAnimationClasses(),
    variants[showSuccess ? "success" : variant],
    sizes[size],
    fullWidth && "w-full",
    animationClasses.willChangeTransform,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !isLoading && onClick) {
      onClick(event);
    }
  };

  const renderContent = () => {
    if (showSuccess) {
      return (
        <div className="flex items-center animate-bounce-in">
          <svg
            className="w-4 h-4 mr-2 animate-scale-in"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="animate-fade-in">{successText}</span>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center">
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
          <span className="animate-pulse-slow">{loadingText}</span>
        </div>
      );
    }

    return (
      <span className={animationClasses.transitionColors}>{children}</span>
    );
  };

  return (
    <button
      className={baseClasses}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

export default LoadingButton;
