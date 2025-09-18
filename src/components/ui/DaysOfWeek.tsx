import React, { useMemo } from "react";
import {
  parseDayAvailability,
  hasAnyDayAvailable,
  type DayAvailability,
} from "../../utils/dayAvailabilityParser";
import { DayIndicator } from "./DayIndicator";

interface DaysOfWeekProps {
  /** The availability text to parse (e.g., "fines de semana", "lunes a viernes") */
  availability?: string;
  /** Additional CSS classes */
  className?: string;
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
  { key: "wednesday", abbreviation: "X", name: "Miércoles" },
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
  className = "",
}) => {
  const dayAvailability = useMemo(() => {
    return parseDayAvailability(availability);
  }, [availability]);

  // Don't render if no day information is available
  if (!dayAvailability) {
    return null;
  }

  // Show "Todos los días" for benefits available all days
  if (dayAvailability.allDays) {
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
        <span className="text-sm font-medium text-gray-700">
          📅 Disponible:
        </span>
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
      <span className="text-sm font-medium text-gray-700">📅 Disponible:</span>
      <div className="flex gap-1">
        {DAYS.map((day) => (
          <DayIndicator
            key={day.key}
            dayAbbreviation={day.abbreviation}
            dayName={day.name}
            isAvailable={dayAvailability[day.key]}
          />
        ))}
      </div>
    </div>
  );
};

export default DaysOfWeek;
