import React from "react";

interface StackProps {
  children: React.ReactNode;
  direction?: "vertical" | "horizontal";
  spacing?: "xs" | "sm" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
  className?: string;
}

const spacingMap = {
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

const alignMap = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const justifyMap = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

export const Stack: React.FC<StackProps> = ({
  children,
  direction = "vertical",
  spacing = "md",
  align = "stretch",
  justify = "start",
  wrap = false,
  className = "",
}) => {
  const flexDirection = direction === "vertical" ? "flex-col" : "flex-row";
  const flexWrap = wrap ? "flex-wrap" : "flex-nowrap";
  const spacingClass = spacingMap[spacing];
  const alignClass = alignMap[align];
  const justifyClass = justifyMap[justify];

  return (
    <div
      className={`flex ${flexDirection} ${flexWrap} ${spacingClass} ${alignClass} ${justifyClass} ${className}`}
    >
      {children}
    </div>
  );
};
