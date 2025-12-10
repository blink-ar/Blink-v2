import React from 'react';

export type BadgeVariant = 'active' | 'featured' | 'upcoming' | 'expired';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface GradientBadgeProps {
  percentage: string | number;
  variant: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export const GradientBadge: React.FC<GradientBadgeProps> = ({
  percentage,
  variant,
  size = 'md',
  className = '',
}) => {
  // Extract numeric value for display
  const numericValue = typeof percentage === 'string'
    ? percentage.replace(/[^0-9.]/g, '')
    : percentage;

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
      {numericValue}% OFF
    </div>
  );
};
