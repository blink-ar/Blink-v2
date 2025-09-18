import React from "react";
import { useResponsive, Breakpoint } from "../../hooks/useResponsive";

interface ResponsiveProps {
  children: React.ReactNode;
  show?: Breakpoint[];
  hide?: Breakpoint[];
  className?: string;
}

export const Responsive: React.FC<ResponsiveProps> = ({
  children,
  show,
  hide,
  className = "",
}) => {
  const { currentBreakpoint, isBreakpoint } = useResponsive();

  // If show prop is provided, only show on those breakpoints
  if (show && show.length > 0) {
    const shouldShow = show.some((bp) => isBreakpoint(bp));
    if (!shouldShow) return null;
  }

  // If hide prop is provided, hide on those breakpoints
  if (hide && hide.length > 0) {
    const shouldHide = hide.some((bp) => isBreakpoint(bp));
    if (shouldHide) return null;
  }

  return <div className={className}>{children}</div>;
};

// Convenience components for common responsive patterns
export const MobileOnly: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <Responsive hide={["md", "lg", "xl", "2xl", "3xl"]} className={className}>
    {children}
  </Responsive>
);

export const TabletUp: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <Responsive show={["md", "lg", "xl", "2xl", "3xl"]} className={className}>
    {children}
  </Responsive>
);

export const DesktopOnly: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <Responsive show={["lg", "xl", "2xl", "3xl"]} className={className}>
    {children}
  </Responsive>
);
