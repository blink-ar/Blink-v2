import React, { useEffect, useState } from "react";
import { useReducedMotion } from "../../hooks/useAnimation";
import { animationClasses } from "../../utils/animationUtils";

interface ProgressIndicatorProps {
  /** Progress value between 0 and 100 */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Color variant */
  variant?: "primary" | "success" | "warning" | "danger";
  /** Whether to show percentage text */
  showPercentage?: boolean;
  /** Whether to animate progress changes */
  animated?: boolean;
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Additional CSS classes */
  className?: string;
  /** Label for accessibility */
  label?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  max = 100,
  size = "md",
  variant = "primary",
  showPercentage = false,
  animated = true,
  animationDuration = 500,
  className = "",
  label,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  // Animate progress changes
  useEffect(() => {
    if (prefersReducedMotion || !animated) {
      setDisplayValue(value);
      return;
    }

    const startValue = displayValue;
    const endValue = Math.min(Math.max(value, 0), max);
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, max, animated, animationDuration, prefersReducedMotion]);

  const percentage = Math.min(Math.max((displayValue / max) * 100, 0), 100);

  const sizes = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const variants = {
    primary: "bg-blue-600",
    success: "bg-green-600",
    warning: "bg-yellow-600",
    danger: "bg-red-600",
  };

  const getProgressBarClasses = () => {
    const baseClasses = [
      "h-full rounded-full transition-all",
      variants[variant],
      prefersReducedMotion ? "duration-0" : `duration-${animationDuration}`,
      "ease-out",
    ];

    // Add shimmer effect for loading state
    if (percentage > 0 && percentage < 100) {
      baseClasses.push("animate-shimmer");
    }

    return baseClasses.join(" ");
  };

  const containerClasses = [
    "w-full bg-gray-200 rounded-full overflow-hidden",
    sizes[size],
    animationClasses.transitionAll,
    className,
  ].join(" ");

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-700">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      <div
        className={containerClasses}
        role="progressbar"
        aria-valuenow={Math.round(displayValue)}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={getProgressBarClasses()}
          style={{
            width: `${percentage}%`,
            transform: "translateZ(0)", // GPU acceleration
          }}
        />
      </div>
    </div>
  );
};

export default ProgressIndicator;
