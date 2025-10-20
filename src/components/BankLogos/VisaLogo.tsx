import React from "react";

interface VisaLogoProps {
  className?: string;
  size?: number;
}

const VisaLogo: React.FC<VisaLogoProps> = ({ className = "", size = 28 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="100" rx="12" fill="#1a1f71" />
      <text
        x="50"
        y="60"
        textAnchor="middle"
        fill="white"
        fontSize="24"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        VISA
      </text>
    </svg>
  );
};

export default VisaLogo;
