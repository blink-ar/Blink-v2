import React from "react";
import { MapPin, Heart } from "lucide-react";
import { Business } from "../types";
import { BBVALogo, SantanderLogo, GaliciaLogo, NacionLogo } from "./BankLogos";

export interface PaymentMethod {
  type: "bbva" | "santander" | "galicia" | "nacion";
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}

interface ActiveOffersProps {
  businesses: Business[];
  onBusinessClick: (businessId: string) => void;
  onViewAll: () => void;
}

const ActiveOffers: React.FC<ActiveOffersProps> = ({
  businesses,
  onBusinessClick,
  onViewAll,
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

    return methods; // Return all methods, we'll handle display limit in render
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

  const getLocationWithDistance = (): string => {
    // Simulate distance calculation
    const distances = [
      "Palermo +8",
      "Recoleta +12",
      "Belgrano +5",
      "Centro +3",
    ];
    return distances[Math.floor(Math.random() * distances.length)];
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6">
        <h2 className="text-xl font-bold text-gray-900">Ofertas Activas</h2>
        <button
          className="text-blue-500 text-sm font-medium hover:text-blue-600 transition-colors"
          onClick={onViewAll}
          aria-label="Ver todas las ofertas activas"
        >
          Ver todas
        </button>
      </div>

      <div
        className="overflow-x-auto [&::-webkit-scrollbar]:hidden scroll-smooth snap-x snap-mandatory ml-4"
        style={{
          scrollbarWidth: "none" /* Firefox */,
          msOverflowStyle: "none" /* Internet Explorer 10+ */,
        }}
      >
        <div className="flex gap-4 pb-2">
          {businesses.slice(0, 5).map((business) => (
            <div
              key={business.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer flex-shrink-0 w-80 snap-start"
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
                <div className="relative flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
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
                  <div className="absolute -top-1 -right-1 bg-gray-700 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {getBenefitCount(business)}
                  </div>
                </div>

                {/* Business Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-semibold text-gray-900 text-base mb-1 truncate max-w-full">
                        {business.name}
                      </h3>
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {getLocationWithDistance()}
                        </span>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-50 rounded-full transition-colors flex-shrink-0 ml-1">
                      <Heart className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Discount Badge */}
                  <div className="mb-3">
                    <span className="inline-block bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
                      {getDiscountPercentage(business)}
                    </span>
                  </div>

                  {/* Payment Methods */}
                  <div className="flex items-center gap-2">
                    {(() => {
                      const allMethods = getPaymentMethods(business);
                      const displayMethods = allMethods.slice(0, 3);
                      const remainingCount = allMethods.length - 3;

                      return (
                        <>
                          {displayMethods.map((method, methodIndex) => {
                            const IconComponent = method.icon;
                            return (
                              <div
                                key={`${method.type}-${methodIndex}`}
                                className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm overflow-hidden"
                                title={method.type.toUpperCase()}
                              >
                                <IconComponent
                                  size={28}
                                  className="w-full h-full"
                                />
                              </div>
                            );
                          })}
                          {remainingCount > 0 && (
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-100 text-gray-600 text-xs font-bold shadow-sm"
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActiveOffers;
