import React from 'react';

export type BadgeVariant = 'active' | 'featured' | 'upcoming' | 'expired';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface GradientBadgeProps {
  percentage: string | number;
  installments?: number | null;
  benefitTitle?: string;
  otherDiscounts?: string;
  variant: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export const GradientBadge: React.FC<GradientBadgeProps> = ({
  percentage,
  installments,
  benefitTitle,
  otherDiscounts,
  variant,
  size = 'md',
  className = '',
}) => {
  // Extract numeric value for display
  const numericValue = typeof percentage === 'string'
    ? percentage.replace(/[^0-9.]/g, '')
    : percentage;

  // Helper to extract installments from text
  const extractInstallmentsFromText = (text?: string): number | null => {
    if (!text) return null;

    // Match patterns like "6 cuotas", "12 cuotas sin interés", "hasta 3 cuotas"
    const match = text.match(/(\d+)\s*cuotas/i);
    return match ? parseInt(match[1], 10) : null;
  };

  // Determine what to display
  let displayValue: string;

  // Debug logging
  console.log('GradientBadge Debug:', {
    percentage,
    numericValue,
    installments,
    otherDiscounts,
    otherDiscountsType: typeof otherDiscounts,
    otherDiscountsTrimmed: otherDiscounts?.trim(),
    benefitTitle
  });

  // Check if we have a valid percentage discount (similar to modal logic)
  const percentageStr = String(percentage);
  const hasValidPercentage = numericValue &&
    Number(numericValue) > 0 &&
    percentageStr !== '0' &&
    percentageStr !== '0%' &&
    percentageStr !== 'N/A' &&
    (percentageStr.includes('%') || !isNaN(Number(percentage))); // Must contain % or be a pure number

  if (hasValidPercentage) {
    // Show discount percentage
    displayValue = `${numericValue}% OFF`;
  } else if (installments && installments > 0) {
    // Show installments from data
    displayValue = `${installments} cuotas`;
  } else if (otherDiscounts && otherDiscounts.trim()) {
    // Show other discounts (e.g., "2x1", "3x2")
    displayValue = otherDiscounts.trim();
  } else {
    // Fallback: try to extract installments from title
    const extractedInstallments = extractInstallmentsFromText(benefitTitle);
    if (extractedInstallments && extractedInstallments > 0) {
      displayValue = `${extractedInstallments} cuotas`;
    } else {
      // Final fallback
      displayValue = 'Ver detalles';
    }
  }

  // Gradient styles based on variant
  const gradientStyles: Record<BadgeVariant, string> = {
    active: 'bg-gradient-discount-active shadow-red-500/30',
    featured: 'bg-gradient-discount-featured shadow-green-500/30',
    upcoming: 'bg-gradient-discount-upcoming shadow-blue-500/30',
    expired: 'bg-gradient-discount-expired shadow-gray-500/20',
  };

  // Size classes
  const sizeClasses: Record<BadgeSize, string> = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  // Always render, even if it's just 'Ver detalles'
  // (removed the null check since we now have a fallback)

  return (
    <div
      className={`
        inline-flex items-center justify-center
        rounded-full font-bold text-white
        shadow-md
        ${gradientStyles[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      style={{
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
      }}
    >
      {displayValue}
    </div>
  );
};
