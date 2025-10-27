import React from "react";

interface GaliciaLogoProps {
  className?: string;
  size?: number;
}

const GaliciaLogo: React.FC<GaliciaLogoProps> = ({
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
      <rect width="100" height="100" rx="12" fill="#f39200" />
      <g transform="translate(25, 25)">
        <path
          d="M25 0 C38.8 0 50 11.2 50 25 C50 38.8 38.8 50 25 50 C11.2 50 0 38.8 0 25 C0 11.2 11.2 0 25 0 Z"
          fill="white"
        />
        <text
          x="25"
          y="32"
          textAnchor="middle"
          fill="#f39200"
          fontSize="18"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          G
        </text>
      </g>
    </svg>
  );
};

export default GaliciaLogo;
