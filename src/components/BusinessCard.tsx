import React, { useState } from "react";
import { ChevronDown, Star, MapPin, CreditCard } from "lucide-react";
import { Business } from "../types";
import { TouchOptimizedCard, TouchButton } from "./ui";

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

  // Responsive classes based on variant and screen size
  const getCardClasses = () => {
    const baseClasses =
      "bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100";

    if (variant === "featured") {
      return `${baseClasses} lg:col-span-2`;
    }

    return baseClasses;
  };

  const getImageClasses = () => {
    if (variant === "compact") {
      return "w-full h-28 sm:h-32 lg:h-28 object-cover";
    }

    if (variant === "featured") {
      return "w-full h-48 lg:h-56 object-cover";
    }

    return "w-full h-32 sm:h-40 lg:h-32 object-cover";
  };

  const getContentClasses = () => {
    if (variant === "compact") {
      return "p-3 lg:p-3";
    }

    return "p-4 lg:p-4";
  };

  return (
    <TouchOptimizedCard className={getCardClasses()}>
      <div className="relative">
        <img
          src={business.image}
          alt={business.name}
          className={getImageClasses()}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute bottom-3 left-3 lg:bottom-2 lg:left-2 text-white">
          <h3
            className={`font-bold mb-1 ${
              variant === "featured"
                ? "text-xl lg:text-2xl"
                : "text-lg lg:text-base"
            }`}
          >
            {business.name}
          </h3>
          <div className="flex items-center gap-2 text-xs lg:text-xs">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 lg:h-3 lg:w-3 fill-yellow-400 text-yellow-400" />
              <span>{business.rating}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 lg:h-3 lg:w-3" />
              <span className="truncate max-w-24 lg:max-w-20">
                {business.location}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={getContentClasses()}>
        {hasSingleBenefit ? (
          <TouchButton
            variant="ghost"
            className="w-full text-left p-0 hover:bg-gray-50 transition-colors duration-200 min-h-[44px] rounded-lg"
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
          <div className="space-y-3">
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
