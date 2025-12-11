import React from 'react';

export type BadgeVariant = 'active' | 'featured' | 'upcoming' | 'expired';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface GradientBadgeProps {
  percentage: string | number;
  installments?: number | null;
  benefitTitle?: string;
  variant: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export const GradientBadge: React.FC<GradientBadgeProps> = ({
  percentage,
  installments,
  benefitTitle,
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

  if (numericValue && Number(numericValue) > 0) {
    // Show discount percentage
    displayValue = `${numericValue}% OFF`;
  } else if (installments && installments > 0) {
    // Show installments from data
    displayValue = `${installments} cuotas`;
  } else {
    // Fallback: try to extract installments from title
    const extractedInstallments = extractInstallmentsFromText(benefitTitle);
    if (extractedInstallments && extractedInstallments > 0) {
      displayValue = `${extractedInstallments} cuotas`;
    } else {
      // No meaningful value to show
      displayValue = '';
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

  // Don't render if there's no value to display
  if (!displayValue) {
    return null;
  }

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
