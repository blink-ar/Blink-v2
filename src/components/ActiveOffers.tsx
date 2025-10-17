import React from "react";
import { MapPin, Heart } from "lucide-react";
import { Business } from "../types";

export interface PaymentMethod {
  type: "visa" | "mastercard" | "bbva" | "santander" | "galicia" | "nacion";
  icon: string;
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

    // Add payment methods based on business benefits and category
    methods.push(
      { type: "visa", icon: "V", color: "#1a1f71" },
      { type: "mastercard", icon: "M", color: "#eb001b" }
    );

    // Add specific bank methods based on category
    if (business.category === "gastronomia") {
      methods.push({ type: "bbva", icon: "B", color: "#004481" });
    } else if (business.category === "moda") {
      methods.push(
        { type: "santander", icon: "S", color: "#ec0000" },
        { type: "galicia", icon: "G", color: "#f39200" }
      );
    } else if (business.category === "viajes") {
      methods.push({ type: "nacion", icon: "N", color: "#0066cc" });
    }

    return methods.slice(0, 4); // Limit to 4 methods max
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
    <div className="px-4 sm:px-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Ofertas Activas</h2>
        <button
          className="text-blue-500 text-sm font-medium hover:text-blue-600 transition-colors"
          onClick={onViewAll}
          aria-label="Ver todas las ofertas activas"
        >
          Ver todas
        </button>
      </div>

      <div className="space-y-4">
        {businesses.slice(0, 3).map((business) => (
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
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-base mb-1">
                      {business.name}
                    </h3>
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{getLocationWithDistance()}</span>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
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
                  {getPaymentMethods(business).map((method, methodIndex) => (
                    <div
                      key={`${method.type}-${methodIndex}`}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                      style={{ backgroundColor: method.color }}
                      title={method.type.toUpperCase()}
                    >
                      {method.icon}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveOffers;
