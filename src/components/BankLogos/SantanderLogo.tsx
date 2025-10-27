import React from "react";

interface SantanderLogoProps {
  className?: string;
  size?: number;
}

const SantanderLogo: React.FC<SantanderLogoProps> = ({
  className = "",
  size = 28,
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "#ffffff",
        padding: "2px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      <img
        src="https://www.santander.com.ar/api/images/santander_mobile_c606d24cae.png"
        alt="Santander"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))",
        }}
      />
    </div>
  );
};

export default SantanderLogo;
