import React from "react";

interface MastercardLogoProps {
  className?: string;
  size?: number;
}

const MastercardLogo: React.FC<MastercardLogoProps> = ({
  className = "",
  size = 28,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="100" rx="12" fill="white" />
      <circle cx="35" cy="50" r="20" fill="#eb001b" />
      <circle cx="65" cy="50" r="20" fill="#ff5f00" />
      <path
        d="M50 30 A20 20 0 0 1 50 70 A20 20 0 0 1 50 30"
        fill="#ff5f00"
        opacity="0.8"
      />
    </svg>
  );
};

export default MastercardLogo;
