import React from "react";

interface NacionLogoProps {
  className?: string;
  size?: number;
}

const NacionLogo: React.FC<NacionLogoProps> = ({
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
      <rect width="100" height="100" rx="12" fill="#0066cc" />
      <g transform="translate(15, 20)">
        <rect x="0" y="0" width="70" height="8" fill="white" />
        <rect x="0" y="12" width="70" height="8" fill="white" />
        <rect x="0" y="24" width="70" height="8" fill="white" />
        <rect x="0" y="36" width="70" height="8" fill="white" />
        <rect x="0" y="48" width="70" height="8" fill="white" />
        <text
          x="35"
          y="35"
          textAnchor="middle"
          fill="#0066cc"
          fontSize="12"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          BNA
        </text>
      </g>
    </svg>
  );
};

export default NacionLogo;
