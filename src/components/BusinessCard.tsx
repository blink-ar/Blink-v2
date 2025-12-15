import React from "react";
import { MapPin } from "lucide-react";
import { Business } from "../types";
import { BBVALogo, SantanderLogo, GaliciaLogo, NacionLogo } from "./BankLogos";

export interface PaymentMethod {
  type: "bbva" | "santander" | "galicia" | "nacion";
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}

interface BusinessCardProps {
  business: Business;
  onClick: (businessId: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

const BusinessCard: React.FC<BusinessCardProps> = React.memo(({
  business,
  onClick,
  className = "",
  style,
}) => {
  const getPaymentMethods = (business: Business): PaymentMethod[] => {
    const methods: PaymentMethod[] = [];

    // Get unique bank names from business benefits
    const uniqueBanks = new Set<string>();
    business.benefits.forEach((benefit) => {
      if (benefit.bankName) {
        uniqueBanks.add(benefit.bankName.toLowerCase());
      }
    });

    // Map bank names to payment method components
    const bankMapping: Record<string, PaymentMethod> = {
      bbva: { type: "bbva", icon: BBVALogo, color: "#004481" },
      santander: { type: "santander", icon: SantanderLogo, color: "#ec0000" },
      galicia: { type: "galicia", icon: GaliciaLogo, color: "#f39200" },
      nacion: { type: "nacion", icon: NacionLogo, color: "#0066cc" },
      "banco nacion": { type: "nacion", icon: NacionLogo, color: "#0066cc" },
      "banco de la nacion": {
        type: "nacion",
        icon: NacionLogo,
        color: "#0066cc",
      },
      "banco galicia": { type: "galicia", icon: GaliciaLogo, color: "#f39200" },
      "banco santander": {
        type: "santander",
        icon: SantanderLogo,
        color: "#ec0000",
      },
    };

    // Add bank-specific payment methods based on actual benefits
    uniqueBanks.forEach((bankName) => {
      const paymentMethod = bankMapping[bankName];
      if (paymentMethod) {
        methods.push(paymentMethod);
      }
    });

    return methods;
  };

  const getDiscountPercentage = (business: Business): string => {
    const discounts = business.benefits
      .map((benefit) => {
        const match = benefit.rewardRate.match(/(\d+)%/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter((discount) => discount > 0);

    if (discounts.length > 0) {
      const maxDiscount = Math.max(...discounts);
      return `hasta ${maxDiscount}% OFF`;
    }

    return "hasta 15% OFF";
  };

  const getBenefitCount = (business: Business): string => {
    const count = business.benefits.length;
    return `+${count}`;
  };

  const getLocationDisplayText = (business: Business): string => {
    if (!business.location || business.location.length === 0) {
      return "Ubicación no disponible";
    }

    // Helper function to extract short location name
    const getShortLocationName = (
      location: Business["location"][0]
    ): string => {
      // If we have a formatted address, use it
      if (
        location.formattedAddress &&
        location.formattedAddress !== "Location not available" &&
        location.formattedAddress !== "Address not available"
      ) {
        // Extract neighborhood or area from formatted address
        const addressParts = location.formattedAddress.split(",");
        if (addressParts.length > 1) {
          return addressParts[0].trim(); // Return the first part (usually street or area)
        }
        return location.formattedAddress;
      }

      // If we have address components, try to get neighborhood or locality
      if (location.addressComponents) {
        const { neighborhood, sublocality, locality } =
          location.addressComponents;
        if (neighborhood) return neighborhood;
        if (sublocality) return sublocality;
        if (locality) return locality;
      }

      // If we have a name, use it
      if (location.name) {
        return location.name;
      }

      return "Ubicación";
    };

    // For single location, just return it
    if (business.location.length === 1) {
      return getShortLocationName(business.location[0]);
    }

    // For multiple locations, try to fit as many as possible
    const locationNames = business.location.map(getShortLocationName);
    const maxLength = 25; // Approximate character limit for the truncated display

    let displayText = "";
    let locationsShown = 0;

    for (let i = 0; i < locationNames.length; i++) {
      const locationName = locationNames[i];
      const separator = i === 0 ? "" : ", ";
      const remainingCount = locationNames.length - i;
      const plusIndicator = remainingCount > 1 ? ` +${remainingCount - 1}` : "";

      // Check if adding this location (plus potential +N) would exceed the limit
      const testText =
        displayText +
        separator +
        locationName +
        (remainingCount > 1 ? plusIndicator : "");

      if (testText.length <= maxLength) {
        displayText += separator + locationName;
        locationsShown++;
      } else {
        // If we can't fit this location, add the +N indicator for remaining locations
        const remaining = locationNames.length - locationsShown;
        if (remaining > 0) {
          displayText += ` +${remaining}`;
        }
        break;
      }
    }

    return displayText || "Múltiples ubicaciones";
  };

  return (
    <div
      className={`bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer ${className}`}
      onClick={() => onClick(business.id)}
      role="button"
      tabIndex={0}
      style={style}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(business.id);
        }
      }}
      aria-label={`Ver ofertas de ${business.name}`}
    >
      <div className="flex items-start gap-3">
        {/* Business Icon */}
        <div className="relative flex-shrink-0">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-base"
            style={{
              backgroundColor:
                business.category === "gastronomia"
                  ? "#F59E0B"
                  : business.category === "moda"
                  ? "#8B5CF6"
                  : business.category === "viajes"
                  ? "#06B6D4"
                  : "#10B981",
            }}
          >
            {business.category === "gastronomia"
              ? "🍽️"
              : business.category === "moda"
              ? "🛍️"
              : business.category === "viajes"
              ? "✈️"
              : "🛒"}
          </div>
          <div className="absolute -top-1 -right-1 bg-gray-700 text-white text-xs font-bold px-1 py-0.5 rounded-full min-w-[18px] text-center leading-none">
            {getBenefitCount(business)}
          </div>
        </div>

        {/* Business Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate max-w-full">
                {business.name}
                <span className="text-gray-500 font-normal ml-1">
                  • {business.location[0]?.types?.[0] || business.category}
                </span>
              </h3>
              <div className="flex items-center text-gray-500 text-xs mb-2">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">
                  {getLocationDisplayText(business)}
                </span>
              </div>
            </div>
          </div>

          {/* Discount Badge and Payment Methods in same row */}
          <div className="flex items-center justify-between">
            <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
              {getDiscountPercentage(business)}
            </span>

            <div className="flex items-center gap-1">
              {(() => {
                const allMethods = getPaymentMethods(business);
                const displayMethods = allMethods.slice(0, 2);
                const remainingCount = allMethods.length - 2;

                return (
                  <>
                    {displayMethods.map((method, methodIndex) => {
                      const IconComponent = method.icon;
                      return (
                        <div
                          key={`${method.type}-${methodIndex}`}
                          className="w-5 h-5 rounded flex items-center justify-center shadow-sm overflow-hidden"
                          title={method.type.toUpperCase()}
                        >
                          <IconComponent size={20} className="w-full h-full" />
                        </div>
                      );
                    })}
                    {remainingCount > 0 && (
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 text-gray-600 text-xs font-bold shadow-sm"
                        title={`${remainingCount} more payment methods`}
                      >
                        +{remainingCount}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

BusinessCard.displayName = 'BusinessCard';

export default BusinessCard;
