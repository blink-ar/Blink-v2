import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Base skeleton component with shimmer animation
 */
const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  className = '',
  style,
}) => {
  const baseClasses = 'animate-pulse bg-gray-200';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const defaultDimensions = {
    text: { width: '100%', height: '1em' },
    circular: { width: '40px', height: '40px' },
    rectangular: { width: '100%', height: '100px' },
  };

  const finalWidth = width ?? defaultDimensions[variant].width;
  const finalHeight = height ?? defaultDimensions[variant].height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{
        width: typeof finalWidth === 'number' ? `${finalWidth}px` : finalWidth,
        height: typeof finalHeight === 'number' ? `${finalHeight}px` : finalHeight,
        ...style,
      }}
      aria-hidden="true"
      role="presentation"
    />
  );
};

export default Skeleton;
