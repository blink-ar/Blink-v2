import React, { useState } from "react";

interface TouchOptimizedCardProps {
  children: React.ReactNode;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  className?: string;
  disabled?: boolean;
  hapticFeedback?: boolean;
}

export const TouchOptimizedCard: React.FC<TouchOptimizedCardProps> = ({
  children,
  onTap,
  onDoubleTap,
  onLongPress,
  className = "",
  disabled = false,
  hapticFeedback = true,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // Haptic feedback function (works on supported devices)
  const triggerHaptic = (type: "light" | "medium" | "heavy" = "light") => {
    if (!hapticFeedback) return;

    // Check if device supports haptic feedback
    if ("vibrate" in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
      };
      navigator.vibrate(patterns[type]);
    }
  };

  const handleTouchStart = () => {
    if (disabled) return;
    setIsPressed(true);

    // Start long press timer
    if (onLongPress) {
      const timer = setTimeout(() => {
        triggerHaptic("medium");
        onLongPress();
        setLongPressTimer(null);
      }, 500); // 500ms for long press
      setLongPressTimer(timer);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);

    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleClick = () => {
    if (disabled) return;

    setTapCount((prev) => prev + 1);

    // Handle double tap
    if (onDoubleTap) {
      setTimeout(() => {
        if (tapCount === 1) {
          // Single tap
          triggerHaptic("light");
          onTap?.();
        } else if (tapCount === 2) {
          // Double tap
          triggerHaptic("medium");
          onDoubleTap();
        }
        setTapCount(0);
      }, 300); // Wait 300ms to detect double tap
    } else {
      // Single tap only
      triggerHaptic("light");
      onTap?.();
      setTapCount(0);
    }
  };

  const cardClasses = [
    "touch-manipulation select-none", // Touch optimizations
    "transition-all duration-150 ease-out",
    "cursor-pointer",
    // Visual feedback for touch
    isPressed && !disabled && "scale-[0.98] shadow-sm",
    disabled && "opacity-50 cursor-not-allowed",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cardClasses}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      style={{
        // Prevent text selection and callouts on mobile
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {children}
    </div>
  );
};
