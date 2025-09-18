import React from "react";

interface TouchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  touchOptimized?: boolean;
}

export const TouchInput: React.FC<TouchInputProps> = ({
  label,
  error,
  icon,
  touchOptimized = true,
  className = "",
  ...props
}) => {
  const inputClasses = [
    "w-full px-4 py-3", // Increased padding for touch
    "min-h-[44px]", // Minimum touch target size
    "text-base", // Prevents zoom on iOS
    "border border-gray-300 rounded-lg",
    "bg-white",
    "transition-colors duration-150",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
    error && "border-red-500 focus:ring-red-500 focus:border-red-500",
    icon && "pl-12",
    touchOptimized && "touch-manipulation",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400">{icon}</div>
          </div>
        )}
        <input className={inputClasses} {...props} />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};
