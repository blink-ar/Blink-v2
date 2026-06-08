import React from "react";
import { BankBenefit } from "../types";
import { GradientBadge, BadgeVariant } from "./GradientBadge";
import { DaysOfWeek } from "./ui/DaysOfWeek";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { ShoppingBag } from "lucide-react";

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
  const { getSubscriptionName } = useSubscriptions();

  // Extract discount percentage from rewardRate
  const getDiscountPercentage = (rewardRate: string) => {
    const match = rewardRate.match(/(\d+)%/);
    return match ? match[1] : rewardRate;
  };

  const discountPercentage = getDiscountPercentage(benefit.rewardRate);
  const subscriptionName = getSubscriptionName(benefit.subscription);

  // Extract minimum purchase amount
  const minPurchaseAmount = benefit.minumumPurchaseAmount?.amount ?? benefit.minimumPurchaseAmount?.amount ?? null;

  return (
    <div
      className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all duration-300 cursor-pointer relative flex flex-col justify-between"
      onClick={onSelect}
    >
      <div>
        {/* Header with Discount Badge and Card Name */}
        <div className="flex items-start justify-between mb-4">
          <GradientBadge
            percentage={discountPercentage}
            installments={benefit.installments}
            benefitTitle={benefit.benefit}
            variant={variant as BadgeVariant}
            size="md"
          />

          <div className="flex items-center gap-1.5">
            {variant === "featured" && (
              <span className="bg-blink-warning text-blink-ink px-1.5 py-0.5 text-[10px] font-bold border border-blink-ink uppercase">
                Destacado
              </span>
            )}
            {subscriptionName && (
              <span className="bg-blink-accent text-white px-1.5 py-0.5 text-[10px] font-bold border border-blink-ink uppercase">
                {subscriptionName}
              </span>
            )}
          </div>
        </div>

        {/* Benefit Description */}
        <div className="mb-4">
          <p className="text-gray-800 text-sm leading-relaxed line-clamp-2">
            {benefit.benefit}
          </p>
        </div>
      </div>

      {/* Footer with Min Purchase and Days of Week */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
        {minPurchaseAmount !== null ? (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-600 bg-gray-100/50 hover:bg-gray-100 transition-colors duration-200 px-2 py-0.5 rounded border border-gray-200/30">
            <ShoppingBag className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] text-gray-400 font-medium">Mín:</span>
            <span className="text-gray-800 font-bold">${minPurchaseAmount.toLocaleString('es-CO')}</span>
          </div>
        ) : (
          <div />
        )}

        <div
          style={{ transform: "scale(0.75)", transformOrigin: "right center" }}
        >
          <DaysOfWeek benefit={benefit} showLabel={false} />
        </div>
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
