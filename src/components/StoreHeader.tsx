import React from "react";
import { ArrowLeft, MapPin, Star } from "lucide-react";
import { Business } from "../types";

interface StoreHeaderProps {
  business: Business;
  onBack: () => void;
}

const StoreHeader: React.FC<StoreHeaderProps> = ({
  business,
  onBack,
}) => {
  // Safely handle missing location data
  const locations = Array.isArray(business.location) ? business.location : [];

  // Filter out "Online" locations for display purposes
  const physicalLocations = locations.filter(
    (loc) => loc && loc.formattedAddress && loc.formattedAddress.toLowerCase() !== "online"
  );

  console.log(business);

  return (
    <div className="bg-white">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>

      </div>

      {/* Store Information */}
      <div className="p-4">
        {/* Store Logo and Basic Info */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
            <img
              src={business.image}
              alt={`${business.name} logo`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.parentElement!.innerHTML = `
                  <div class="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                    <span class="text-white font-bold text-lg">${business.name.charAt(
                      0
                    )}</span>
                  </div>
                `;
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 mb-1 truncate">
              {business.name}
            </h1>
            {/* Category */}
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                {physicalLocations[0]?.types?.[0] || business.category}
              </span>

            </div>
            {/* Location */}
            {physicalLocations.length > 0 && (
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <div className="flex items-center min-w-0 flex-1">
                  <span className="truncate">
                    {physicalLocations[0].formattedAddress ||
                      "Location not available"}
                  </span>
                  {physicalLocations.length > 1 && (
                    <span className="flex-shrink-0 ml-1">
                      (+{physicalLocations.length - 1})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreHeader;
