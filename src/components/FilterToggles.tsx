import React from 'react';
import { MapPin, Globe } from 'lucide-react';

interface FilterTogglesProps {
  nearbyOnly: boolean;
  onlineOnly: boolean;
  onNearbyToggle: () => void;
  onOnlineToggle: () => void;
  nearbyDisabled?: boolean; // Disable if location not available
}

const FilterToggles: React.FC<FilterTogglesProps> = ({
  nearbyOnly,
  onlineOnly,
  onNearbyToggle,
  onOnlineToggle,
  nearbyDisabled = false,
}) => {
  return (
    <div className="px-4 sm:px-6 md:px-8 py-3 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 mr-2">
          Filtros:
        </span>

        {/* Nearby Toggle */}
        <button
          onClick={onNearbyToggle}
          disabled={nearbyDisabled}
          className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
            transition-all duration-200
            ${
              nearbyOnly
                ? 'bg-green-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
            ${nearbyDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          aria-pressed={nearbyOnly}
          title={nearbyDisabled ? 'Activa la ubicación para usar este filtro' : 'Filtrar por cercanía'}
        >
          <MapPin className="w-4 h-4" />
          Solo cerca de mi
        </button>

        {/* Online Toggle */}
        <button
          onClick={onOnlineToggle}
          className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
            transition-all duration-200 cursor-pointer
            ${
              onlineOnly
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
          aria-pressed={onlineOnly}
          title="Filtrar solo beneficios online"
        >
          <Globe className="w-4 h-4" />
          Solo online
        </button>
      </div>
    </div>
  );
};

export default FilterToggles;
