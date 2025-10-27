import React from "react";
import { ArrowLeft, Heart, Clock, MapPin, Star } from "lucide-react";
import { Business } from "../types";

interface StoreHeaderProps {
  business: Business;
  onBack: () => void;
  onFavoriteToggle: () => void;
  isFavorite: boolean;
  benefitsCount: number;
  activeOffersCount: number;
}

const StoreHeader: React.FC<StoreHeaderProps> = ({
  business,
  onBack,
  onFavoriteToggle,
  isFavorite,
}) => {
  // Mock opening hours - in a real app this would come from business data
  const isOpen = true; // This would be calculated based on current time and business hours
  const openingHours = "9:00 AM - 9:00 PM";

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

        <button
          onClick={onFavoriteToggle}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
            isFavorite
              ? "bg-red-100 hover:bg-red-200"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            className={`h-5 w-5 ${
              isFavorite ? "text-red-500 fill-current" : "text-gray-700"
            }`}
          />
        </button>
      </div>

      {/* Store Information */}
      <div className="p-6">
        {/* Store Logo and Basic Info */}
        <div className="flex items-start gap-4 mb-4">
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
                {business.location[0]?.types?.[0] || business.category}
              </span>

              {/* Rating */}
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-gray-700">
                  {typeof business.rating === "number"
                    ? business.rating.toFixed(1)
                    : "5.0"}
                </span>
              </div>
            </div>

            {/* Opening Hours and Status */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">{openingHours}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  isOpen
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {isOpen ? "Abierto" : "Cerrado"}
              </span>
            </div>

            {/* Location */}
            {business.location.length > 0 && (
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="truncate">
                  {business.location[0].formattedAddress ||
                    "Location not available"}
                  {business.location.length > 1 &&
                    ` (+${business.location.length - 1} more)`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreHeader;
