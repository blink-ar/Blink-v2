import React from "react";
import {
  MapPin,
  Clock,
  Phone,
  ExternalLink,
  Navigation,
  Star,
  Loader2,
  Globe,
  ChevronDown,
} from "lucide-react";
import { Business, CanonicalLocation } from "../types";
import LocationMap from "./LocationMap";
import { usePlaceDetails } from "../hooks/usePlaceDetails";
import { useGeolocation } from "../hooks/useGeolocation";

interface StoreInformationProps {
  business: Business;
  selectedLocation?: CanonicalLocation | null;
  onLocationSelect?: (location: CanonicalLocation) => void;
  onCallClick?: () => void;
}

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const StoreInformation: React.FC<StoreInformationProps> = ({
  business,
  selectedLocation,
  onLocationSelect,
  onCallClick,
}) => {
  // Use only explicitly selected location (no default)
  const currentLocation = selectedLocation || null;

  // Fetch place details for the current location
  const { formattedDetails, formattedOpeningHours, loading, error } =
    usePlaceDetails(currentLocation);

  // Get user's location for proximity sorting
  const { position: userPosition } = useGeolocation();

  // State for dropdown
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Memoize user coordinates to prevent unnecessary re-sorts
  const userCoords = React.useMemo(() => {
    if (!userPosition?.latitude || !userPosition?.longitude) {
      return null;
    }
    return {
      latitude: userPosition.latitude,
      longitude: userPosition.longitude,
    };
  }, [userPosition?.latitude, userPosition?.longitude]);

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

  // Filter physical locations (exclude virtual ones like "Online", "Nacional")
  const physicalLocations = React.useMemo(() => {
    // Safety check: ensure business.location exists and is an array
    if (!business.location || !Array.isArray(business.location)) {
      return [];
    }

    const filtered = business.location.filter((location) => {
      // Safety check: ensure location has required properties
      if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
        return false;
      }

      const locationName =
        location.name?.toLowerCase() ||
        location.formattedAddress?.toLowerCase() ||
        "";
      // Check for virtual location indicators
      const isVirtual =
        locationName.includes("nacional") ||
        locationName.includes("online") ||
        locationName.includes("todo el país") ||
        locationName.includes("tienda online");
      // Also check for invalid coordinates
      const hasValidCoordinates = location.lat !== 0 || location.lng !== 0;
      return !isVirtual && hasValidCoordinates;
    });

    // Sort by proximity if user position is available
    if (userCoords) {
      return [...filtered].sort((a, b) => {
        const distanceA = calculateDistance(
          userCoords.latitude,
          userCoords.longitude,
          a.lat,
          a.lng
        );
        const distanceB = calculateDistance(
          userCoords.latitude,
          userCoords.longitude,
          b.lat,
          b.lng
        );
        return distanceA - distanceB;
      });
    }

    return filtered;
  }, [business.location, userCoords]);

  const hasPhysicalLocations = physicalLocations.length > 0;

  // Get the store website URL from benefits
  const storeWebsite = React.useMemo(() => {
    for (const benefit of business.benefits) {
      if (benefit.textoAplicacion) {
        // Ensure it's a valid URL
        const url = benefit.textoAplicacion;
        if (url.startsWith("http://") || url.startsWith("https://")) {
          return url;
        } else if (url.includes(".")) {
          return `https://${url}`;
        }
      }
    }
    return null;
  }, [business.benefits]);

  // Check if this is an online-only store
  const isOnlineOnly = !hasPhysicalLocations;

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

  // Online-only store view
  if (isOnlineOnly) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Tienda Online
          </h3>
        </div>

        <div className="p-6">
          {/* Website link */}
          {storeWebsite ? (
            <a
              href={storeWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5" />
                <span className="font-medium">Visitar sitio web</span>
              </div>
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <p className="text-gray-500 text-sm">
              Sitio web no disponible
            </p>
          )}
        </div>
      </div>
    );
  }

  // Physical store view (existing code)
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 mb-1 flex items-baseline gap-2 min-w-0">
                <span className="flex-shrink-0">Dirección</span>
                {selectedLocation && (
                  <span className="text-sm font-normal text-blue-600 truncate">
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
                {/* Show location dropdown when there are multiple locations */}
                {physicalLocations.length > 1 ? (
                  <div ref={dropdownRef} className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full flex items-center justify-between gap-2 p-3 bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-colors min-w-0"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                        <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0 text-left overflow-hidden">
                          {selectedLocation ? (
                            <div className="min-w-0">
                              {selectedLocation.name && (
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {selectedLocation.name}
                                </p>
                              )}
                              <p className="text-xs text-gray-600 truncate">
                                {selectedLocation.formattedAddress}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600 truncate">
                              Selecciona una ubicación ({physicalLocations.length})
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-500 flex-shrink-0 transition-transform ${
                          isDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Dropdown menu */}
                    {isDropdownOpen && (
                      <div
                        className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        onWheel={(e) => {
                          // Prevent scroll from bubbling to parent
                          e.stopPropagation();
                        }}
                        onTouchMove={(e) => {
                          // Prevent scroll from bubbling on touch devices
                          e.stopPropagation();
                        }}
                      >
                        {physicalLocations.map((location, index) => {
                          const isSelected = selectedLocation?.placeId
                            ? location.placeId === selectedLocation.placeId
                            : selectedLocation?.formattedAddress === location.formattedAddress;

                          // Calculate distance if user position is available
                          const distance = userCoords
                            ? calculateDistance(
                                userCoords.latitude,
                                userCoords.longitude,
                                location.lat,
                                location.lng
                              )
                            : null;

                          return (
                            <button
                              key={location.placeId || index}
                              onClick={() => {
                                onLocationSelect?.(location);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-left p-3 border-b border-gray-100 last:border-b-0 transition-colors ${
                                isSelected
                                  ? 'bg-blue-50'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    {location.name && (
                                      <p className={`text-sm font-medium mb-1 truncate ${
                                        isSelected ? 'text-blue-900' : 'text-gray-900'
                                      }`}>
                                        {location.name}
                                      </p>
                                    )}
                                    <p className={`text-xs truncate ${
                                      isSelected ? 'text-blue-700' : 'text-gray-600'
                                    }`}>
                                      {location.formattedAddress}
                                    </p>
                                  </div>
                                {distance !== null && (
                                  <span className={`text-xs font-semibold flex-shrink-0 ${
                                    isSelected ? 'text-blue-600' : 'text-gray-500'
                                  }`}>
                                    {distance < 1
                                      ? `${Math.round(distance * 1000)}m`
                                      : `${distance.toFixed(1)}km`}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {storeInfo.address}
                  </p>
                )}
              </div>
            </div>
          </div>

          {hasPhysicalLocations && (
            <button
              onClick={handleDirectionsClick}
              className="ml-8 flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              <Navigation className="h-4 w-4" />
              <span>Cómo llegar</span>
            </button>
          )}
        </div>

        {/* Opening Hours Section - Only show when location is selected */}
        {selectedLocation ? (
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
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-blue-800 text-sm leading-relaxed break-words">
                📍 Selecciona una ubicación en el mapa para ver horarios y
                detalles específicos
              </p>
            </div>
          </div>
        )}

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

        {/* Store Description
        {business.description && (
          <div className="pt-4 border-t border-gray-100">
            <h4 className="font-medium text-gray-900 mb-2">
              Acerca de {business.name}
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              {business.description}
            </p>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default StoreInformation;
