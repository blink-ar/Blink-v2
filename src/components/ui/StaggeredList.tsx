import React, { useEffect, useState } from "react";
import { useReducedMotion, useInViewAnimation } from "../../hooks/useAnimation";

interface StaggeredListProps {
  /** Array of items to render */
  items: React.ReactNode[];
  /** Delay between each item animation in milliseconds */
  staggerDelay?: number;
  /** Animation type for each item */
  animation?: "fade" | "slide-up" | "scale";
  /** Whether to animate on scroll into view */
  animateOnScroll?: boolean;
  /** Container className */
  className?: string;
  /** Item wrapper className */
  itemClassName?: string;
  /** Callback when all animations complete */
  onAnimationComplete?: () => void;
}

const StaggeredList: React.FC<StaggeredListProps> = ({
  items,
  staggerDelay = 100,
  animation = "fade",
  animateOnScroll = true,
  className = "",
  itemClassName = "",
  onAnimationComplete,
}) => {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const prefersReducedMotion = useReducedMotion();
  const { elementRef, isInView } = useInViewAnimation(0.1);

  useEffect(() => {
    if (prefersReducedMotion) {
      // Show all items immediately if reduced motion is preferred
      setVisibleItems(new Set(items.map((_, index) => index)));
      onAnimationComplete?.();
      return;
    }

    if (!animateOnScroll || isInView) {
      // Clear existing visible items
      setVisibleItems(new Set());

      // Stagger the appearance of items
      items.forEach((_, index) => {
        setTimeout(() => {
          setVisibleItems((prev) => new Set([...prev, index]));

          // Call completion callback when last item is visible
          if (index === items.length - 1) {
            setTimeout(() => {
              onAnimationComplete?.();
            }, 250); // Wait for animation to complete
          }
        }, index * staggerDelay);
      });
    }
  }, [
    items,
    staggerDelay,
    animateOnScroll,
    isInView,
    prefersReducedMotion,
    onAnimationComplete,
  ]);

  const getItemAnimationClass = (index: number) => {
    if (prefersReducedMotion) return "";

    const isVisible = visibleItems.has(index);

    if (!isVisible) {
      return "opacity-0 transform";
    }

    switch (animation) {
      case "fade":
        return "animate-fade-in";
      case "slide-up":
        return "animate-slide-up";
      case "scale":
        return "animate-scale-in";
      default:
        return "animate-fade-in";
    }
  };

  const getInitialItemStyle = (index: number) => {
    if (prefersReducedMotion) return {};

    const isVisible = visibleItems.has(index);

    if (isVisible) return {};

    switch (animation) {
      case "slide-up":
        return { transform: "translateY(20px)" };
      case "scale":
        return { transform: "scale(0.9)" };
      default:
        return {};
    }
  };

  return (
    <div ref={elementRef} className={className}>
      {items.map((item, index) => (
        <div
          key={index}
          className={`${getItemAnimationClass(index)} ${itemClassName}`.trim()}
          style={getInitialItemStyle(index)}
        >
          {item}
        </div>
      ))}
    </div>
  );
};

export default StaggeredList;
