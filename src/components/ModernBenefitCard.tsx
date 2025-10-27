import React from "react";
import { Calendar, ExternalLink, CreditCard } from "lucide-react";
import { BankBenefit } from "../types";

interface ModernBenefitCardProps {
  benefit: BankBenefit;
  onSelect: () => void;
  variant?: "active" | "expired" | "upcoming" | "featured";
}

const ModernBenefitCard: React.FC<ModernBenefitCardProps> = ({
  benefit,
  onSelect,
  variant = "active",
}) => {
  // Determine badge color based on variant
  const getBadgeStyles = (variant: string) => {
    switch (variant) {
      case "active":
        return "bg-red-500 text-white";
      case "featured":
        return "bg-green-500 text-white";
      case "upcoming":
        return "bg-blue-500 text-white";
      case "expired":
        return "bg-gray-400 text-white";
      default:
        return "bg-red-500 text-white";
    }
  };

  // Extract discount percentage from rewardRate
  const getDiscountPercentage = (rewardRate: string) => {
    const match = rewardRate.match(/(\d+)%/);
    return match ? match[1] : rewardRate;
  };

  // Mock expiration date - in a real app this would come from benefit data
  const expirationDate = "31 Dic 2024";

  const badgeStyles = getBadgeStyles(variant);
  const discountPercentage = getDiscountPercentage(benefit.rewardRate);

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onSelect}
    >
      {/* Header with Discount Badge */}
      <div className="flex items-start justify-between mb-3">
        <div
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${badgeStyles}`}
        >
          {discountPercentage}% OFF
        </div>

        {variant === "featured" && (
          <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
            Destacado
          </div>
        )}
      </div>

      {/* Bank and Card Information */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900">
            {benefit.bankName}
          </span>
        </div>
        <div className="text-xs text-gray-600">{benefit.cardName}</div>
      </div>

      {/* Benefit Description */}
      <div className="mb-4">
        <p className="text-gray-800 text-sm leading-relaxed line-clamp-2">
          {benefit.benefit}
        </p>
      </div>

      {/* Footer with Expiration and Terms */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>Válido hasta {expirationDate}</span>
        </div>

        <button
          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
          onClick={(e) => {
            e.stopPropagation();
            // Handle terms and conditions click
          }}
        >
          <span>Términos</span>
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>

      {/* Status Indicator for Expired/Upcoming */}
      {variant === "expired" && (
        <div className="mt-3 text-center">
          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
            Beneficio expirado
          </span>
        </div>
      )}

      {variant === "upcoming" && (
        <div className="mt-3 text-center">
          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">
            Próximamente disponible
          </span>
        </div>
      )}
    </div>
  );
};

export default ModernBenefitCard;
