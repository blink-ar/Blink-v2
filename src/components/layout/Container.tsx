import React from "react";

interface ContainerProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

const containerSizes = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-full",
};

export const Container: React.FC<ContainerProps> = ({
  children,
  size = "lg",
  className = "",
}) => {
  return (
    <div
      className={`mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20 ${containerSizes[size]} ${className}`}
    >
      {children}
    </div>
  );
};
