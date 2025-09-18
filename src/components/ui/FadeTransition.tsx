import React, { useEffect, useState } from "react";
import { useReducedMotion } from "../../hooks/useAnimation";

interface FadeTransitionProps {
  /** Whether the content should be visible */
  show: boolean;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Content to render */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Callback when transition completes */
  onTransitionEnd?: () => void;
}

const FadeTransition: React.FC<FadeTransitionProps> = ({
  show,
  duration = 250,
  children,
  className = "",
  onTransitionEnd,
}) => {
  const [shouldRender, setShouldRender] = useState(show);
  const [opacity, setOpacity] = useState(show ? 1 : 0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      // Use requestAnimationFrame to ensure the element is rendered before changing opacity
      requestAnimationFrame(() => {
        setOpacity(1);
      });
    } else {
      setOpacity(0);
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

  const transitionStyle = prefersReducedMotion
    ? { opacity }
    : {
        opacity,
        transition: `opacity ${duration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
      };

  return (
    <div className={className} style={transitionStyle}>
      {children}
    </div>
  );
};

export default FadeTransition;
