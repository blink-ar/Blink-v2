import React from "react";

interface DayIndicatorProps {
  /** The day abbreviation (e.g., 'L', 'M', 'X', 'J', 'V', 'S', 'D') */
  dayAbbreviation: string;
  /** The full day name for accessibility */
  dayName: string;
  /** Whether this day is available/active */
  isAvailable: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * DayIndicator component displays a single day of the week with visual states
 * for available (filled) and unavailable (empty) days.
 */
export const DayIndicator: React.FC<DayIndicatorProps> = ({
  dayAbbreviation,
  dayName,
  isAvailable,
  className = "",
}) => {
  const baseClasses = [
    "inline-flex",
    "items-center",
    "justify-center",
    "w-8",
    "h-8",
    "text-xs",
    "font-medium",
    "rounded-full",
    "transition-all",
    "duration-200",
    "ease-in-out",
    "cursor-default",
    // Responsive sizing
    "sm:w-9",
    "sm:h-9",
    "sm:text-sm",
  ].join(" ");

  const availableClasses = [
    "bg-blue-500",
    "text-white",
    "shadow-sm",
    "hover:bg-blue-600",
    "hover:shadow-md",
    "hover:scale-105",
  ].join(" ");

  const unavailableClasses = [
    "bg-gray-100",
    "text-gray-400",
    "border",
    "border-gray-200",
    "hover:bg-gray-50",
    "hover:border-gray-300",
  ].join(" ");

  const combinedClasses = `${baseClasses} ${
    isAvailable ? availableClasses : unavailableClasses
  } ${className}`;

  const ariaLabel = `${dayName}: ${
    isAvailable ? "disponible" : "no disponible"
  }`;

  return (
    <div
      className={combinedClasses}
      role="status"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <span aria-hidden="true">{dayAbbreviation}</span>
    </div>
  );
};

export default DayIndicator;
