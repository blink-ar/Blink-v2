import React from "react";
import { Filter, ChevronDown } from "lucide-react";

interface BenefitsFilterProps {
  totalBenefits: number;
  activeOffers: number;
  onFilterToggle: () => void;
  isFilterOpen?: boolean;
  selectedFilter?: "all" | "active" | "upcoming" | "expired";
  onFilterSelect?: (filter: "all" | "active" | "upcoming" | "expired") => void;
}

const BenefitsFilter: React.FC<BenefitsFilterProps> = ({
  totalBenefits,
  activeOffers,
  onFilterToggle,
  isFilterOpen = false,
  selectedFilter = "all",
  onFilterSelect,
}) => {
  const filterOptions = [
    { key: "all", label: "Todos los beneficios", count: totalBenefits },
    { key: "active", label: "Ofertas activas", count: activeOffers },
    { key: "upcoming", label: "Próximamente", count: 0 },
    { key: "expired", label: "Expirados", count: totalBenefits - activeOffers },
  ] as const;

  const currentFilter = filterOptions.find(
    (option) => option.key === selectedFilter
  );

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="px-6 py-4">
        {/* Header with Filter Button */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Todos los beneficios
          </h2>

          <button
            onClick={onFilterToggle}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Toggle filter options"
          >
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtrar</span>
            <ChevronDown
              className={`h-4 w-4 text-gray-600 transition-transform ${
                isFilterOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Benefits Count */}
        <div className="text-sm text-gray-600">
          {currentFilter && (
            <span>
              {currentFilter.count}{" "}
              {currentFilter.count === 1 ? "beneficio" : "beneficios"}
              {selectedFilter !== "all" &&
                ` • ${currentFilter.label.toLowerCase()}`}
            </span>
          )}
        </div>

        {/* Filter Dropdown */}
        {isFilterOpen && (
          <div className="mt-4 bg-gray-50 rounded-lg p-3">
            <div className="space-y-2">
              {filterOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => {
                    onFilterSelect?.(option.key);
                    onFilterToggle(); // Close the filter after selection
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors ${
                    selectedFilter === option.key
                      ? "bg-primary-100 text-primary-800"
                      : "hover:bg-white text-gray-700"
                  }`}
                >
                  <span className="text-sm font-medium">{option.label}</span>
                  <span
                    className={`text-sm ${
                      selectedFilter === option.key
                        ? "text-primary-600"
                        : "text-gray-500"
                    }`}
                  >
                    {option.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BenefitsFilter;
