import React from "react";

interface LoadingAnimationProps {
  type?: "spinner" | "dots" | "pulse" | "skeleton";
  size?: "sm" | "md" | "lg";
  className?: string;
  message?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  type = "spinner",
  size = "md",
  className = "",
  message,
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-4 w-4";
      case "lg":
        return "h-12 w-12";
      default:
        return "h-8 w-8";
    }
  };

  const renderSpinner = () => (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 ${getSizeClasses()}`}
    />
  );

  const renderDots = () => (
    <div className="flex space-x-1">
      <div
        className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <div
        className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <div
        className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );

  const renderPulse = () => (
    <div
      className={`bg-primary-600 rounded-full animate-pulse ${getSizeClasses()}`}
    />
  );

  const renderSkeleton = () => (
    <div className="animate-pulse space-y-3">
      <div className="skeleton skeleton-title w-3/4" />
      <div className="skeleton skeleton-text w-full" />
      <div className="skeleton skeleton-text w-5/6" />
    </div>
  );

  const renderAnimation = () => {
    switch (type) {
      case "dots":
        return renderDots();
      case "pulse":
        return renderPulse();
      case "skeleton":
        return renderSkeleton();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="animate-fade-in-scale">{renderAnimation()}</div>
      {message && (
        <div className="mt-3 text-sm text-gray-600 animate-pulse">
          {message}
        </div>
      )}
    </div>
  );
};

export default LoadingAnimation;
