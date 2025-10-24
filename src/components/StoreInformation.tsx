import React from "react";
import { MapPin, Clock, Phone, ExternalLink, Navigation } from "lucide-react";
import { Business } from "../types";
import LocationMap from "./LocationMap";

interface StoreInformationProps {
  business: Business;
  onCallClick?: () => void;
  onDirectionsClick?: () => void;
}

const StoreInformation: React.FC<StoreInformationProps> = ({
  business,
  onCallClick,
  onDirectionsClick,
}) => {
  const storeInfo = {
    address:
      business.location.length > 0
        ? business.location[0].formattedAddress || "Dirección no disponible"
        : "Dirección no disponible",
    phone: "+1 (555) 123-4567", // This would come from business.phone
    website: "www.example.com", // This would come from business.website
    openingHours: {
      monday: "9:00 AM - 9:00 PM",
      tuesday: "9:00 AM - 9:00 PM",
      wednesday: "9:00 AM - 9:00 PM",
      thursday: "9:00 AM - 9:00 PM",
      friday: "9:00 AM - 10:00 PM",
      saturday: "10:00 AM - 10:00 PM",
      sunday: "11:00 AM - 8:00 PM",
    },
  };

  console.log({ business });

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
    if (onDirectionsClick) {
      onDirectionsClick();
    } else {
      // Open in default maps app
      const encodedAddress = encodeURIComponent(storeInfo.address);
      window.open(`https://maps.google.com/?q=${encodedAddress}`, "_blank");
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
              <h4 className="font-medium text-gray-900 mb-1">Dirección</h4>
              <LocationMap locations={business.location} className="mt-4" />
              <p className="text-gray-600 text-sm leading-relaxed">
                {storeInfo.address}
              </p>
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
            <h4 className="font-medium text-gray-900">Horarios de atención</h4>
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
                  <span>{hours}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-500" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">Contacto</h4>
              <p className="text-gray-600 text-sm">{storeInfo.phone}</p>
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

        {/* Website/Additional Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <ExternalLink className="h-5 w-5 text-gray-500" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">Sitio web</h4>
              <a
                href={`https://${storeInfo.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                {storeInfo.website}
              </a>
            </div>
          </div>
        </div>

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
