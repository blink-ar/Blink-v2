import React, {
  forwardRef,
  HTMLAttributes,
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
} from "react";

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
    const [shouldRender, setShouldRender] = useState(isVisible);
    const [isInView, setIsInView] = useState(!animateOnScroll);
    const elementRef = useRef<HTMLDivElement>(null);

    // Simple reduced motion detection
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Handle visibility changes
    useEffect(() => {
      if (isVisible) {
        setShouldRender(true);
      } else {
        const timer = setTimeout(() => setShouldRender(false), duration);
        return () => clearTimeout(timer);
      }
    }, [isVisible, duration]);

    // Simple intersection observer for scroll animations
    useEffect(() => {
      if (!animateOnScroll || !elementRef.current) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            if (animateOnce) {
              observer.disconnect();
            }
          } else if (!animateOnce) {
            setIsInView(false);
          }
        },
        { threshold }
      );

      observer.observe(elementRef.current);
      return () => observer.disconnect();
    }, [animateOnScroll, threshold, animateOnce]);

    // Use imperative handle to properly expose the ref
    useImperativeHandle(ref, () => elementRef.current!);

    // Determine animation class based on type and state
    const getAnimationClass = () => {
      if (prefersReducedMotion) return "";

      const baseClasses = "transition-all ease-out";
      const durationClass = `duration-${duration}`;

      if (animateOnScroll) {
        if (!isInView) {
          switch (animation) {
            case "fade":
              return `${baseClasses} ${durationClass} opacity-0`;
            case "slide-up":
              return `${baseClasses} ${durationClass} opacity-0 translate-y-4`;
            case "slide-down":
              return `${baseClasses} ${durationClass} opacity-0 -translate-y-4`;
            case "scale":
              return `${baseClasses} ${durationClass} opacity-0 scale-95`;
            default:
              return `${baseClasses} ${durationClass} opacity-0`;
          }
        } else {
          return `${baseClasses} ${durationClass} opacity-100 translate-y-0 scale-100`;
        }
      }

      // Visibility-based animation
      if (isVisible) {
        return `${baseClasses} ${durationClass} opacity-100 translate-y-0 scale-100`;
      } else {
        switch (animation) {
          case "fade":
            return `${baseClasses} ${durationClass} opacity-0`;
          case "slide-up":
            return `${baseClasses} ${durationClass} opacity-0 translate-y-4`;
          case "slide-down":
            return `${baseClasses} ${durationClass} opacity-0 -translate-y-4`;
          case "scale":
            return `${baseClasses} ${durationClass} opacity-0 scale-95`;
          default:
            return `${baseClasses} ${durationClass} opacity-0`;
        }
      }
    };

    // Don't render if not visible and using visibility animation
    if (!animateOnScroll && !shouldRender) {
      return null;
    }

    const animationStyles = delay > 0 ? { transitionDelay: `${delay}ms` } : {};

    return (
      <div
        ref={elementRef}
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
