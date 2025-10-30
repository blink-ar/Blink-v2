import React from "react";
import {
  MapPin,
  Clock,
  Phone,
  ExternalLink,
  Navigation,
  Star,
  Loader2,
} from "lucide-react";
import { Business, CanonicalLocation } from "../types";
import LocationMap from "./LocationMap";
import { usePlaceDetails } from "../hooks/usePlaceDetails";

interface StoreInformationProps {
  business: Business;
  selectedLocation?: CanonicalLocation | null;
  onLocationSelect?: (location: CanonicalLocation) => void;
  onCallClick?: () => void;
}

const StoreInformation: React.FC<StoreInformationProps> = ({
  business,
  selectedLocation,
  onLocationSelect,
  onCallClick,
}) => {
  // Use selected location or default to first location
  const currentLocation =
    selectedLocation ||
    (business.location.length > 0 ? business.location[0] : null);

  // Fetch place details for the current location
  const {
    placeDetails,
    formattedDetails,
    formattedOpeningHours,
    loading,
    error,
  } = usePlaceDetails(currentLocation);

  const storeInfo = {
    address:
      formattedDetails?.address ||
      currentLocation?.formattedAddress ||
      "Dirección no disponible",
    locationName:
      formattedDetails?.name || currentLocation?.name || business.name,
    phone: formattedDetails?.contact?.phone || "+1 (555) 123-4567",
    website: formattedDetails?.contact?.website || "www.example.com",
    rating: formattedDetails?.rating?.score,
    totalReviews: formattedDetails?.rating?.totalReviews,
    coordinates: formattedDetails?.coordinates,
    categories: formattedDetails?.categories,
    photos: formattedDetails?.photos,
    openingHours: formattedOpeningHours || {
      monday: "9:00 AM - 9:00 PM",
      tuesday: "9:00 AM - 9:00 PM",
      wednesday: "9:00 AM - 9:00 PM",
      thursday: "9:00 AM - 9:00 PM",
      friday: "9:00 AM - 10:00 PM",
      saturday: "10:00 AM - 10:00 PM",
      sunday: "11:00 AM - 8:00 PM",
    },
  };

  const daysOfWeek = [
    { key: "monday", label: "Lunes" },
    { key: "tuesday", label: "Martes" },
    { key: "wednesday", label: "Miércoles" },
    { key: "thursday", label: "Jueves" },
    { key: "friday", label: "Viernes" },
    { key: "saturday", label: "Sábado" },
    { key: "sunday", label: "Domingo" },
  ];

  const handleCallClick = () => {
    if (onCallClick) {
      onCallClick();
    } else {
      window.location.href = `tel:${storeInfo.phone}`;
    }
  };

  const handleDirectionsClick = () => {
    if (currentLocation?.placeId) {
      // Use Place ID for exact Google Maps place card
      window.open(
        `https://maps.google.com/?q=place_id:${currentLocation.placeId}`,
        "_blank"
      );
    } else if (storeInfo.coordinates) {
      // Fallback to coordinates with place name
      const query = `${storeInfo.locationName}/@${storeInfo.coordinates.lat},${storeInfo.coordinates.lng}`;
      window.open(
        `https://maps.google.com/?q=${encodeURIComponent(query)}`,
        "_blank"
      );
    } else {
      // Final fallback to address
      window.open(
        `https://maps.google.com/?q=${encodeURIComponent(storeInfo.address)}`,
        "_blank"
      );
    }
  };

  return (
    <div className="bg-white">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">
          Información de la tienda
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Address Section */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">
                Dirección
                {selectedLocation && (
                  <span className="ml-2 text-sm font-normal text-blue-600">
                    ({storeInfo.locationName})
                  </span>
                )}
              </h4>
              <LocationMap
                locations={business.location}
                onMarkerClick={onLocationSelect}
                selectedLocation={selectedLocation}
                className="mt-4"
              />
              <div className="mt-3 space-y-2">
                <p className="text-gray-600 text-sm leading-relaxed">
                  {storeInfo.address}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleDirectionsClick}
            className="ml-8 flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            <Navigation className="h-4 w-4" />
            <span>Cómo llegar</span>
          </button>
        </div>

        {/* Opening Hours Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-gray-500" />
            <h4 className="font-medium text-gray-900">
              Horarios de atención
              {loading && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin text-blue-500" />
              )}
            </h4>
            {formattedOpeningHours?.currentStatus && (
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  formattedOpeningHours.isOpen
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {formattedOpeningHours.currentStatus}
              </span>
            )}
          </div>

          <div className="ml-8 space-y-2">
            {daysOfWeek.map((day) => {
              const hours =
                storeInfo.openingHours[
                  day.key as keyof typeof storeInfo.openingHours
                ];
              const isToday =
                new Date().getDay() === daysOfWeek.indexOf(day) + 1; // Adjust for Monday = 0

              return (
                <div
                  key={day.key}
                  className={`flex justify-between items-center text-sm ${
                    isToday ? "font-medium text-gray-900" : "text-gray-600"
                  }`}
                >
                  <span>{day.label}</span>
                  <span className={hours === "Closed" ? "text-red-600" : ""}>
                    {hours || "No disponible"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Information */}
        {formattedDetails?.contact?.phone && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-500" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">Contacto</h4>
                <p className="text-gray-600 text-sm">
                  {formattedDetails.contact.phone}
                </p>
                <p className="text-green-600 text-xs">
                  ✅ Información verificada por Google Places
                </p>
              </div>
            </div>

            <button
              onClick={handleCallClick}
              className="ml-8 flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              <Phone className="h-4 w-4" />
              <span>Llamar ahora</span>
            </button>
          </div>
        )}

        {/* Website/Additional Info */}
        {(formattedDetails?.contact?.website ||
          storeInfo.website !== "www.example.com") && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ExternalLink className="h-5 w-5 text-gray-500" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">Sitio web</h4>
                <a
                  href={
                    formattedDetails?.contact?.website ||
                    `https://${storeInfo.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 text-sm break-all"
                >
                  {formattedDetails?.contact?.website || storeInfo.website}
                </a>
                {formattedDetails?.contact?.website && (
                  <p className="text-green-600 text-xs mt-1">
                    ✅ Sitio web verificado por Google Places
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Categories */}
        {formattedDetails?.categories &&
          formattedDetails.categories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-500" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">Categorías</h4>
                  <div className="flex flex-wrap gap-2">
                    {formattedDetails.categories
                      .slice(0, 5)
                      .map((category, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                        >
                          {category.replace(/_/g, " ")}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Location-specific Information */}
        {selectedLocation && currentLocation && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-gray-500" />
              <h4 className="font-medium text-gray-900">Rating</h4>
            </div>

            <div className="ml-8">
              {formattedDetails?.rating ? (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-semibold text-gray-900">
                    {formattedDetails.rating.score.toFixed(1)}
                  </span>
                  <span className="text-gray-600">
                    ({formattedDetails.rating.totalReviews} reseñas)
                  </span>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Rating no disponible</p>
              )}
            </div>
          </div>
        )}

        {/* Error state for place details */}
        {error && selectedLocation && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              ⚠️ No se pudieron cargar los detalles específicos de esta
              ubicación. Mostrando información general.
            </p>
          </div>
        )}

        {/* Store Description */}
        {business.description && (
          <div className="pt-4 border-t border-gray-100">
            <h4 className="font-medium text-gray-900 mb-2">
              Acerca de {business.name}
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              {business.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreInformation;
