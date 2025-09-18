import React, { useState } from "react";
import { useHoverAnimation, useReducedMotion } from "../../hooks/useAnimation";
import { animationClasses } from "../../utils/animationUtils";

interface InteractiveCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "elevated" | "bordered" | "ghost";
  hoverEffect?: "lift" | "scale" | "glow" | "none";
  pressEffect?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

const InteractiveCard: React.FC<InteractiveCardProps> = ({
  children,
  onClick,
  className = "",
  variant = "default",
  hoverEffect = "lift",
  pressEffect = true,
  disabled = false,
  loading = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const { elementRef, isHovered } = useHoverAnimation();
  const prefersReducedMotion = useReducedMotion();

  const variants = {
    default: "bg-white border border-gray-200 shadow-sm",
    elevated: "bg-white shadow-md border-0",
    bordered: "bg-white border-2 border-gray-300 shadow-none",
    ghost: "bg-transparent border-0 shadow-none",
  };

  const getHoverEffectClasses = () => {
    if (prefersReducedMotion || disabled) return "";

    switch (hoverEffect) {
      case "lift":
        return "hover:shadow-lg hover:-translate-y-1";
      case "scale":
        return "hover:scale-[1.02]";
      case "glow":
        return "hover:shadow-xl hover:ring-2 hover:ring-blue-500/20";
      case "none":
      default:
        return "";
    }
  };

  const getPressEffectClasses = () => {
    if (prefersReducedMotion || disabled || !pressEffect) return "";
    return "active:scale-[0.98] active:shadow-sm";
  };

  const getLoadingClasses = () => {
    if (!loading) return "";
    return animationClasses.pulseSlow;
  };

  const baseClasses = [
    "rounded-lg p-4",
    "transition-all duration-200 ease-out-smooth",
    "cursor-pointer select-none",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    variants[variant],
    getHoverEffectClasses(),
    getPressEffectClasses(),
    getLoadingClasses(),
    disabled && "opacity-50 cursor-not-allowed",
    loading && "pointer-events-none",
    animationClasses.willChangeTransform,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleMouseDown = () => {
    if (!disabled && !loading) {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === "Enter" || event.key === " ") && !disabled && !loading) {
      event.preventDefault();
      setIsPressed(true);
      onClick?.();
    }
  };

  const handleKeyUp = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      setIsPressed(false);
    }
  };

  return (
    <div
      ref={elementRef}
      className={baseClasses}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      tabIndex={onClick && !disabled ? 0 : -1}
      role={onClick ? "button" : undefined}
      aria-disabled={disabled}
      aria-busy={loading}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}
      <div className={loading ? "opacity-50" : ""}>{children}</div>
    </div>
  );
};

export default InteractiveCard;
