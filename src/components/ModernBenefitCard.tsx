import React from "react";
import { BankBenefit } from "../types";
import { GradientBadge, BadgeVariant } from "./GradientBadge";
import { DaysOfWeek } from "./ui/DaysOfWeek";

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
  // Extract discount percentage from rewardRate
  const getDiscountPercentage = (rewardRate: string) => {
    const match = rewardRate.match(/(\d+)%/);
    return match ? match[1] : rewardRate;
  };

  const discountPercentage = getDiscountPercentage(benefit.rewardRate);

  return (
    <div
      className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all duration-300 cursor-pointer relative"
      onClick={onSelect}
    >
      {/* Header with Discount Badge and Card Name */}
      <div className="flex items-start justify-between mb-4">
        <GradientBadge
          percentage={discountPercentage}
          installments={benefit.installments}
          benefitTitle={benefit.benefit}
          variant={variant as BadgeVariant}
          size="md"
        />

        <div className="flex items-center gap-2">
          {variant === "featured" && (
            <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
              Destacado
            </div>
          )}
          <div className="text-xs font-medium text-gray-600">
            {benefit.cardName}
          </div>
        </div>
      </div>

      {/* Benefit Description */}
      <div className="pb-6">
        <p className="text-gray-800 text-sm leading-relaxed line-clamp-2">
          {benefit.benefit}
        </p>
      </div>

      {/* Days of Week Availability - Bottom Right */}
      <div
        className="absolute bottom-3 right-3"
        style={{ transform: "scale(0.6)", transformOrigin: "bottom right" }}
      >
        <DaysOfWeek benefit={benefit} showLabel={false} />
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
