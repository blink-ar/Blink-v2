import React from "react";
import { Search, Filter } from "lucide-react";
import { TouchInput } from "./ui";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFilterClick?: () => void;
  showFilter?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Buscar descuentos, tiendas...",
  onFilterClick,
  showFilter = true,
}) => {
  return (
    <div className="w-full search-bar">
      <div className="relative">
        <TouchInput
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          icon={<Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />}
          className="modern-search-input w-full pl-10 sm:pl-12 pr-12 sm:pr-14 py-3 sm:py-4 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white focus-ring"
          touchOptimized={true}
          aria-label="Buscar descuentos y tiendas"
          style={{
            minHeight: "var(--touch-target-min)",
            fontSize: "16px", // Prevents zoom on iOS
          }}
        />
        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
        </div>
        {showFilter && (
          <button
            onClick={onFilterClick}
            className="modern-filter-button touch-target touch-button absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-primary-600 transition-colors"
            aria-label="Filtrar resultados"
            type="button"
            style={{
              minWidth: "var(--touch-target-min)",
              minHeight: "var(--touch-target-min)",
            }}
          >
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}
      </div>
    </div>
  );
};
