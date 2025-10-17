import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  message?: string;
  type?: "spinner" | "dots" | "pulse";
  fullScreen?: boolean;
}

// A modern animated spinner with multiple animation types
export default function LoadingSpinner({
  size = "md",
  className = "",
  message,
  type = "spinner",
  fullScreen = true,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const renderSpinner = () => (
    <div className="animate-spin text-4xl h-16 w-16 flex items-center justify-center">
      <span role="img" aria-label="dollar" className="text-primary-500">
        $
      </span>
    </div>
  );

  const renderDots = () => (
    <div className="flex space-x-2">
      <div
        className="w-3 h-3 bg-primary-600 rounded-full animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <div
        className="w-3 h-3 bg-primary-600 rounded-full animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <div
        className="w-3 h-3 bg-primary-600 rounded-full animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );

  const renderPulse = () => (
    <div
      className={`bg-primary-600 rounded-full animate-pulse ${sizeClasses[size]}`}
    />
  );

  const renderAnimation = () => {
    switch (type) {
      case "dots":
        return renderDots();
      case "pulse":
        return renderPulse();
      default:
        return renderSpinner();
    }
  };

  const containerClasses = fullScreen
    ? "fixed inset-0 flex flex-col justify-center items-center bg-white bg-opacity-90 z-50 animate-fade-in-scale"
    : `flex flex-col justify-center items-center animate-fade-in-scale ${className}`;

  return (
    <div className={containerClasses}>
      {renderAnimation()}
      {message && (
        <div className="mt-4 text-sm text-gray-600 animate-pulse text-center">
          {message}
        </div>
      )}
    </div>
  );
}
