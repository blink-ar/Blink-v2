import React from "react";
import { MapPin } from "lucide-react";
import { Business } from "../types/index";

interface NearbyBusinessesProps {
  businesses: Business[];
  onBusinessClick: (businessId: string) => void;
  onViewMap: () => void;
}

const NearbyBusinesses: React.FC<NearbyBusinessesProps> = ({
  businesses,
  onBusinessClick,
  onViewMap,
}) => {
  const getDiscountPercentage = (business: Business): string => {
    const discounts = business.benefits
      .map((benefit) => {
        const match = benefit.rewardRate.match(/(\d+)%/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter((discount) => discount > 0);

    const maxDiscount = discounts.length > 0 ? Math.max(...discounts) : 10;
    return `${maxDiscount}% OFF`;
  };

  const getDiscountColor = (business: Business): string => {
    const discounts = business.benefits
      .map((benefit) => {
        const match = benefit.rewardRate.match(/(\d+)%/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter((discount) => discount > 0);

    const maxDiscount = discounts.length > 0 ? Math.max(...discounts) : 10;

    if (maxDiscount >= 20) return "bg-red-500";
    if (maxDiscount >= 15) return "bg-green-500";
    return "bg-blue-500";
  };

  const formatDistance = (distance?: number): string => {
    if (!distance) return "A 200m de tu ubicación";

    if (distance < 1) {
      return `A ${Math.round(distance * 1000)}m de tu ubicación`;
    }

    return `A ${distance.toFixed(1)}km de tu ubicación`;
  };

  const getBusinessIcon = (category: string): string => {
    switch (category) {
      case "gastronomia":
        return "☕";
      case "moda":
        return "🛒";
      case "viajes":
        return "⛽";
      default:
        return "🏪";
    }
  };

  const getBusinessIconColor = (category: string): string => {
    switch (category) {
      case "gastronomia":
        return "#F59E0B";
      case "moda":
        return "#FBBF24";
      case "viajes":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  const getLocationText = (): string => {
    const locations = ["Av. Santa Fe 1234", "Av. Córdoba 5678"];
    return locations[Math.floor(Math.random() * locations.length)];
  };

  return (
    <div className="px-4 sm:px-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Cerca de ti</h2>
        <button
          className="text-blue-500 text-sm font-medium hover:text-blue-600 transition-colors"
          onClick={onViewMap}
          aria-label="Ver mapa de negocios cercanos"
        >
          Ver mapa
        </button>
      </div>

      <div className="space-y-4">
        {businesses.slice(0, 2).map((business) => (
          <div
            key={business.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer"
            onClick={() => onBusinessClick(business.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onBusinessClick(business.id);
              }
            }}
            aria-label={`Ver ofertas de ${business.name}`}
          >
            <div className="flex items-start gap-4">
              {/* Business Icon */}
              <div className="flex-shrink-0">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{
                    backgroundColor: getBusinessIconColor(business.category),
                  }}
                >
                  {getBusinessIcon(business.category)}
                </div>
              </div>

              {/* Business Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-base mb-1">
                      {business.name}
                    </h3>
                    <div className="text-gray-500 text-sm mb-2">
                      {formatDistance(business.distance)}
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{getLocationText()}</span>
                    </div>
                  </div>

                  {/* Discount Badge */}
                  <div
                    className={`${getDiscountColor(
                      business
                    )} text-white text-xs font-bold px-2 py-1 rounded-md`}
                  >
                    {getDiscountPercentage(business)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NearbyBusinesses;
