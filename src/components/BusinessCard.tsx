import React, { useState } from "react";
import { ChevronDown, Star, MapPin, CreditCard } from "lucide-react";
import { Business } from "../types";
import { TouchOptimizedCard, TouchButton } from "./ui";

export interface PaymentMethod {
  type: "visa" | "mastercard" | "bbva" | "santander";
  icon: string;
  color: string;
}

interface BusinessCardProps {
  business: Business;
  onBenefitClick?: (benefitIndex: number) => void;
  onFavoriteToggle?: (businessId: string) => void;
  isFavorite?: boolean;
  isLoading?: boolean;
  variant?: "default" | "compact" | "featured";
}

export const BusinessCard: React.FC<BusinessCardProps> = ({
  business,
  onBenefitClick,
  onFavoriteToggle,
  isFavorite = false,
  isLoading = false,
  variant = "default",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const benefits = business.benefits;
  const hasSingleBenefit = benefits.length === 1;

  // Get payment methods for the business
  const getPaymentMethods = (): PaymentMethod[] => {
    const methods: PaymentMethod[] = [];

    // Add default payment methods
    methods.push(
      { type: "visa", icon: "V", color: "#1a1f71" },
      { type: "mastercard", icon: "M", color: "#eb001b" }
    );

    // Add BBVA for certain categories
    if (
      business.category === "gastronomia" ||
      business.category === "entretenimiento"
    ) {
      methods.push({ type: "bbva", icon: "B", color: "#004481" });
    }

    return methods;
  };

  // Get discount percentage from benefits
  const getDiscountPercentage = (): string => {
    const discounts = benefits
      .map((benefit) => {
        const match = benefit.rewardRate.match(/(\d+)%/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter((discount) => discount > 0);

    if (discounts.length > 0) {
      return `${Math.max(...discounts)}%`;
    }

    return "10%"; // Default fallback
  };

  // Get discount badge color based on percentage
  const getDiscountBadgeColor = (percentage: string): string => {
    const num = parseInt(percentage);
    if (num >= 20) return "var(--color-discount-active)"; // Red for high discounts
    if (num >= 15) return "var(--color-discount-featured)"; // Green for medium discounts
    if (num >= 10) return "var(--color-discount-upcoming)"; // Blue for low discounts
    return "var(--color-discount-expired)"; // Gray for minimal discounts
  };

  // Responsive classes based on variant and screen size
  const getCardClasses = () => {
    const baseClasses =
      "business-card-modern business-card touch-card micro-lift card-hover";

    if (variant === "featured") {
      return `${baseClasses} lg:col-span-2 xl:col-span-3`;
    }

    return baseClasses;
  };

  const getImageClasses = () => {
    if (variant === "compact") {
      return "business-card-image h-24 xs:h-28 sm:h-32 md:h-28 lg:h-32";
    }

    if (variant === "featured") {
      return "business-card-image h-40 xs:h-44 sm:h-48 md:h-52 lg:h-56 xl:h-60";
    }

    return "business-card-image h-28 xs:h-32 sm:h-36 md:h-32 lg:h-36";
  };

  const getContentClasses = () => {
    if (variant === "compact") {
      return "business-card-content p-3 sm:p-4 md:p-3 lg:p-4";
    }

    return "business-card-content p-4 sm:p-5 md:p-4 lg:p-5";
  };

  const discountPercentage = getDiscountPercentage();
  const paymentMethods = getPaymentMethods();

  return (
    <TouchOptimizedCard className={getCardClasses()}>
      <div className="relative">
        <img
          src={business.image}
          alt={business.name}
          className={getImageClasses()}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Discount Badge */}
        <div
          className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-1 rounded text-white text-xs sm:text-sm font-bold shadow-sm touch-target"
          style={{ backgroundColor: getDiscountBadgeColor(discountPercentage) }}
        >
          {discountPercentage}
        </div>

        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 text-white">
          <div className="flex items-center gap-1 text-xs">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs sm:text-sm">{business.rating}</span>
          </div>
        </div>
      </div>

      <div className={getContentClasses()}>
        {/* Business Header */}
        <div className="business-card-header mb-2 sm:mb-3">
          <div className="flex-1">
            <h3 className="business-name text-sm sm:text-base md:text-sm lg:text-base font-semibold text-gray-900 line-clamp-1">
              {business.name}
            </h3>
            <p className="business-category text-xs sm:text-sm text-gray-600 capitalize">
              {business.category}
            </p>
          </div>
        </div>

        {/* Business Location */}
        <div className="business-location flex items-center gap-1 text-xs sm:text-sm text-gray-500 mb-3">
          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="line-clamp-1">
            {business.location.length > 0
              ? business.location[0].formattedAddress ||
                "Location not available"
              : "Location not available"}
            {business.location.length > 1 &&
              ` (+${business.location.length - 1} more)`}
          </span>
        </div>

        {/* Payment Methods */}
        <div className="payment-methods flex gap-1 sm:gap-2 mb-3">
          {paymentMethods.map((method, index) => (
            <div
              key={`${method.type}-${index}`}
              className="payment-icon w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center text-white text-xs sm:text-sm font-bold"
              style={{ backgroundColor: method.color }}
              title={method.type}
            >
              {method.icon}
            </div>
          ))}
        </div>

        {hasSingleBenefit ? (
          <TouchButton
            variant="ghost"
            className="w-full text-left p-0 hover:bg-gray-50 transition-colors duration-200 min-h-[44px] rounded-lg mt-3"
            onClick={() => onBenefitClick && onBenefitClick(0)}
          >
            <div className="flex items-start gap-3 p-3">
              <div
                className={`${benefits[0].color} p-1.5 rounded-md flex-shrink-0`}
              >
                <CreditCard className="h-3 w-3 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {benefits[0].bankName}
                  </h4>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-600 truncate">
                    {benefits[0].cardName}
                  </span>
                </div>
                {variant !== "compact" && (
                  <p className="text-gray-500 text-xs mb-2 line-clamp-1">
                    {business.description}
                  </p>
                )}
                <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium">
                  {benefits[0].rewardRate}
                </span>
              </div>
            </div>
          </TouchButton>
        ) : (
          <div className="space-y-3 mt-3">
            {/* Benefits List */}
            <div className="space-y-2">
              {benefits.slice(0, 2).map((benefit, index) => (
                <TouchButton
                  key={index}
                  variant="ghost"
                  className="w-full text-left p-0 hover:bg-gray-50 transition-colors duration-200 min-h-[44px] rounded-lg"
                  onClick={() => onBenefitClick && onBenefitClick(index)}
                >
                  <div className="flex items-center gap-3 p-3">
                    <div
                      className={`${benefit.color} p-1 rounded-md flex-shrink-0`}
                    >
                      <CreditCard className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 text-sm truncate">
                            {benefit.bankName}
                          </h4>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-600 truncate">
                            {benefit.cardName}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-3">
                        <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium">
                          {benefit.rewardRate}
                        </span>
                      </div>
                    </div>
                  </div>
                </TouchButton>
              ))}
            </div>

            {/* Expanded Benefits */}
            {benefits.length > 2 && isExpanded && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                {benefits.slice(2).map((benefit, index) => (
                  <TouchButton
                    key={index + 2}
                    variant="ghost"
                    className="w-full text-left p-0 hover:bg-gray-50 transition-colors duration-200 min-h-[44px] rounded-lg"
                    onClick={() => onBenefitClick && onBenefitClick(index + 2)}
                  >
                    <div className="flex items-center gap-3 p-3">
                      <div
                        className={`${benefit.color} p-1 rounded-md flex-shrink-0`}
                      >
                        <CreditCard className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 text-sm truncate">
                              {benefit.bankName}
                            </h4>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-600 truncate">
                              {benefit.cardName}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-3">
                          <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium">
                            {benefit.rewardRate}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TouchButton>
                ))}
              </div>
            )}

            {/* Show More/Less Button */}
            {benefits.length > 2 && (
              <TouchButton
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-center p-0 hover:bg-gray-50 transition-colors duration-200 min-h-[36px] rounded-lg"
              >
                <div className="flex items-center justify-center gap-1 py-2">
                  <span className="text-xs font-medium text-gray-600">
                    {isExpanded ? "Ver menos" : `+${benefits.length - 2} más`}
                  </span>
                  <ChevronDown
                    className={`h-3 w-3 text-gray-600 transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </TouchButton>
            )}
          </div>
        )}
      </div>
    </TouchOptimizedCard>
  );
};
