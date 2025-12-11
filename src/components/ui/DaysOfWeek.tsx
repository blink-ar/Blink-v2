import React, { useMemo } from "react";
import {
  parseDayAvailability,
  parseDayAvailabilityFromBenefit,
  hasAnyDayAvailable,
  type DayAvailability,
} from "../../utils/dayAvailabilityParser";
import { DayIndicator } from "./DayIndicator";
import type { BankBenefit } from "../../types";

interface DaysOfWeekProps {
  /** The availability text to parse (e.g., "fines de semana", "lunes a viernes") - for backward compatibility */
  availability?: string;
  /** The full benefit object for multi-field parsing - preferred approach */
  benefit?: BankBenefit;
  /** Additional CSS classes */
  className?: string;
  /** Show label and icon (default: true) */
  showLabel?: boolean;
}

interface DayInfo {
  key: keyof Omit<DayAvailability, "allDays" | "customText">;
  abbreviation: string;
  name: string;
}

// Day configuration with Spanish names and abbreviations
const DAYS: DayInfo[] = [
  { key: "monday", abbreviation: "L", name: "Lunes" },
  { key: "tuesday", abbreviation: "M", name: "Martes" },
  { key: "wednesday", abbreviation: "M", name: "Miércoles" },
  { key: "thursday", abbreviation: "J", name: "Jueves" },
  { key: "friday", abbreviation: "V", name: "Viernes" },
  { key: "saturday", abbreviation: "S", name: "Sábado" },
  { key: "sunday", abbreviation: "D", name: "Domingo" },
];

/**
 * DaysOfWeek component displays the availability of a benefit across the week
 * using visual day indicators. Integrates with the day availability parser utility.
 */
export const DaysOfWeek: React.FC<DaysOfWeekProps> = ({
  availability,
  benefit,
  className = "",
  showLabel = true,
}) => {
  const dayAvailability = useMemo(() => {
    // Prefer multi-field parsing if benefit object is provided
    if (benefit) {
      return parseDayAvailabilityFromBenefit(benefit);
    }
    // Fallback to single-field parsing for backward compatibility
    return parseDayAvailability(availability);
  }, [availability, benefit]);

  // Don't render if no day information is available
  if (!dayAvailability) {
    return null;
  }

  // Show "Todos los días" for benefits available all days (only when label is shown)
  if (dayAvailability.allDays && showLabel) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm font-medium text-gray-700">
          📅 Disponible:
        </span>
        <span className="text-sm text-green-600 font-medium">
          Todos los días
        </span>
      </div>
    );
  }

  // Show custom text if no specific days were parsed
  if (dayAvailability.customText && !hasAnyDayAvailable(dayAvailability)) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showLabel && (
          <span className="text-sm font-medium text-gray-700">
            📅 Disponible:
          </span>
        )}
        <span className="text-sm text-gray-600">
          {dayAvailability.customText}
        </span>
      </div>
    );
  }

  // Only render if at least one day is available
  if (!hasAnyDayAvailable(dayAvailability)) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700">📅 Disponible:</span>
      )}
      <div className="flex gap-1">
        {DAYS.map((day) => (
          <DayIndicator
            key={day.key}
            dayAbbreviation={day.abbreviation}
            dayName={day.name}
            isAvailable={dayAvailability.allDays || dayAvailability[day.key]}
          />
        ))}
      </div>
    </div>
  );
};

export default DaysOfWeek;
