import React, { useEffect, useState } from "react";
import { useReducedMotion } from "../../hooks/useAnimation";

interface SlideTransitionProps {
  /** Whether the content should be visible */
  show: boolean;
  /** Direction of the slide animation */
  direction?: "up" | "down" | "left" | "right";
  /** Animation duration in milliseconds */
  duration?: number;
  /** Distance to slide in pixels */
  distance?: number;
  /** Content to render */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Callback when transition completes */
  onTransitionEnd?: () => void;
}

const SlideTransition: React.FC<SlideTransitionProps> = ({
  show,
  direction = "up",
  duration = 300,
  distance = 20,
  children,
  className = "",
  onTransitionEnd,
}) => {
  const [shouldRender, setShouldRender] = useState(show);
  const [isVisible, setIsVisible] = useState(show);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(
        () => {
          setShouldRender(false);
          onTransitionEnd?.();
        },
        prefersReducedMotion ? 0 : duration
      );

      return () => clearTimeout(timer);
    }
  }, [show, duration, prefersReducedMotion, onTransitionEnd]);

  if (!shouldRender) {
    return null;
  }

  const getTransform = () => {
    if (prefersReducedMotion) {
      return isVisible ? "translate3d(0, 0, 0)" : "translate3d(0, 0, 0)";
    }

    const translateValue = isVisible ? 0 : distance;

    switch (direction) {
      case "up":
        return `translate3d(0, ${isVisible ? 0 : translateValue}px, 0)`;
      case "down":
        return `translate3d(0, ${isVisible ? 0 : -translateValue}px, 0)`;
      case "left":
        return `translate3d(${isVisible ? 0 : translateValue}px, 0, 0)`;
      case "right":
        return `translate3d(${isVisible ? 0 : -translateValue}px, 0, 0)`;
      default:
        return `translate3d(0, ${isVisible ? 0 : translateValue}px, 0)`;
    }
  };

  const transitionStyle = prefersReducedMotion
    ? {
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
      }
    : {
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: `opacity ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1), transform ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
      };

  return (
    <div className={className} style={transitionStyle}>
      {children}
    </div>
  );
};

export default SlideTransition;
