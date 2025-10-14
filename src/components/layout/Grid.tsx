import React from "react";

interface GridProps {
  children: React.ReactNode;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const gapSizes = {
  xs: "gap-2",
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
  xl: "gap-12",
};

const getGridClasses = (cols: GridProps["cols"]) => {
  const classes = ["grid"];

  if (cols?.xs) classes.push(`grid-cols-${cols.xs}`);
  if (cols?.sm) classes.push(`sm:grid-cols-${cols.sm}`);
  if (cols?.md) classes.push(`md:grid-cols-${cols.md}`);
  if (cols?.lg) classes.push(`lg:grid-cols-${cols.lg}`);
  if (cols?.xl) classes.push(`xl:grid-cols-${cols.xl}`);

  return classes.join(" ");
};

export const Grid: React.FC<GridProps> = ({
  children,
  cols = { xs: 1, sm: 1, md: 2, lg: 3, xl: 3 },
  gap = "md",
  className = "",
}) => {
  const gridClasses = getGridClasses(cols);
  const gapClass = gapSizes[gap];

  return (
    <div className={`${gridClasses} ${gapClass} ${className}`}>{children}</div>
  );
};
