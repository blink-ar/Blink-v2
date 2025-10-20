import React from "react";

interface BBVALogoProps {
  className?: string;
  size?: number;
}

const BBVALogo: React.FC<BBVALogoProps> = ({ className = "", size = 28 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="100" rx="12" fill="#004481" />
      <text
        x="50"
        y="60"
        textAnchor="middle"
        fill="white"
        fontSize="32"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        BBVA
      </text>
    </svg>
  );
};

export default BBVALogo;
