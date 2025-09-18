import React, { forwardRef, HTMLAttributes } from "react";
import {
  useAnimatedVisibility,
  useInViewAnimation,
  useReducedMotion,
} from "../../hooks/useAnimation";

interface AnimatedContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Animation type to apply */
  animation?: "fade" | "slide-up" | "slide-down" | "scale" | "bounce";
  /** Whether the element should be visible */
  isVisible?: boolean;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Delay before animation starts */
  delay?: number;
  /** Whether to animate on scroll into view */
  animateOnScroll?: boolean;
  /** Intersection observer threshold for scroll animation */
  threshold?: number;
  /** Whether to only animate once */
  animateOnce?: boolean;
  children: React.ReactNode;
}

const AnimatedContainer = forwardRef<HTMLDivElement, AnimatedContainerProps>(
  (
    {
      animation = "fade",
      isVisible = true,
      duration = 250,
      delay = 0,
      animateOnScroll = false,
      threshold = 0.1,
      animateOnce = true,
      className = "",
      style,
      children,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const { shouldRender, animationClass } = useAnimatedVisibility(
      isVisible,
      duration
    );
    const { elementRef, isInView } = useInViewAnimation(threshold);

    // Combine refs
    const combinedRef = (node: HTMLDivElement) => {
      if (elementRef) elementRef.current = node;
      if (ref) {
        if (typeof ref === "function") ref(node);
        else ref.current = node;
      }
    };

    // Determine animation class based on type and state
    const getAnimationClass = () => {
      if (prefersReducedMotion) return "";

      if (animateOnScroll) {
        if (!isInView) return "opacity-0";

        switch (animation) {
          case "fade":
            return "animate-fade-in";
          case "slide-up":
            return "animate-slide-up";
          case "slide-down":
            return "animate-slide-down";
          case "scale":
            return "animate-scale-in";
          case "bounce":
            return "animate-bounce-in";
          default:
            return "animate-fade-in";
        }
      }

      return animationClass;
    };

    // Don't render if not visible and using visibility animation
    if (!animateOnScroll && !shouldRender) {
      return null;
    }

    const animationStyles = delay > 0 ? { animationDelay: `${delay}ms` } : {};

    return (
      <div
        ref={combinedRef}
        className={`${getAnimationClass()} ${className}`.trim()}
        style={{
          ...style,
          ...animationStyles,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AnimatedContainer.displayName = "AnimatedContainer";

export default AnimatedContainer;
