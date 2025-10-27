import React from "react";
import { RawMongoBenefit } from "../types/mongodb";
import SantanderLogo from "./BankLogos/SantanderLogo";

interface ModernFeaturedBenefitProps {
  benefit: RawMongoBenefit;
  onSelect: () => void;
}

const ModernFeaturedBenefit: React.FC<ModernFeaturedBenefitProps> = ({
  benefit,
  onSelect,
}) => {
  // Use the discountPercentage from the API data
  const discountPercentage = benefit.discountPercentage?.toString() || "25";

  // Use merchant name from API
  const businessDisplayName = benefit.merchant.name;

  // Use bank name from API
  const bankName = benefit.bank;

  // Use benefit title from API
  const benefitTitle = benefit.benefitTitle;

  // Description is available as benefit.description if needed later

  // Helper function to get bank colors
  const getBankColor = (bankName: string): string => {
    const bankColors: { [key: string]: string } = {
      Santander: "#EC0000",
      "Banco de Chile": "#003DA5",
      BCI: "#FF6B35",
      "Banco Estado": "#0066CC",
      Scotiabank: "#DA020E",
      Itaú: "#FF6900",
      BBVA: "#004481",
      Falabella: "#7B68EE",
      Ripley: "#E31837",
      Cencosud: "#00A651",
    };
    return bankColors[bankName] || "#EC0000";
  };

  // Helper function to get bank icon letter
  const getBankIconLetter = (bankName: string): string => {
    const bankLetters: { [key: string]: string } = {
      Santander: "S",
      "Banco de Chile": "BC",
      BCI: "BCI",
      "Banco Estado": "BE",
      Scotiabank: "SC",
      Itaú: "IT",
      BBVA: "BB",
      Falabella: "F",
      Ripley: "R",
      Cencosud: "C",
    };
    return bankLetters[bankName] || bankName.charAt(0).toUpperCase();
  };

  const bankColor = getBankColor(bankName);
  const bankIconLetter = getBankIconLetter(bankName);

  // Check if we're on mobile for responsive adjustments
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const cardStyle: React.CSSProperties = {
    width: "100%",
    minHeight: isMobile ? "140px" : "160px",
    maxWidth: "100%",
    borderRadius: "20px",
    transition: "all 0.3s ease",
    boxShadow: "0 6px 24px rgba(0, 212, 170, 0.2)",
    background: "#00D4AA",
    marginBottom: "16px",
    padding: isMobile ? "16px" : "20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
  };

  const leftHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
  };

  const discountIconStyle: React.CSSProperties = {
    width: "48px",
    height: "48px",
    backgroundColor: "#FF4757",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "bold",
    color: "white",
    flexShrink: 0,
  };

  const businessNameStyle: React.CSSProperties = {
    fontSize: isMobile ? "20px" : "24px",
    fontWeight: "700",
    color: "white",
    margin: 0,
    letterSpacing: "-0.3px",
    lineHeight: "1.1",
  };

  const heartIconStyle: React.CSSProperties = {
    width: "28px",
    height: "28px",
    cursor: "pointer",
    opacity: 0.8,
    flexShrink: 0,
  };

  const bankInfoStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  };

  const bankIconStyle: React.CSSProperties = {
    width: "28px",
    height: "28px",
    backgroundColor: bankColor,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold",
    color: "white",
    flexShrink: 0,
  };

  const bankNameStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: "600",
    color: "white",
    margin: 0,
    opacity: 0.95,
  };

  const bottomSectionStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: "auto",
  };

  const discountSectionStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  };

  const discountTextStyle: React.CSSProperties = {
    fontSize: isMobile ? "28px" : "32px",
    fontWeight: "800",
    color: "white",
    margin: 0,
    lineHeight: "0.9",
    letterSpacing: "-0.8px",
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: "500",
    color: "white",
    margin: "6px 0 0 0",
    opacity: 0.9,
    lineHeight: "1.2",
  };

  const ctaButtonStyle: React.CSSProperties = {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    border: "none",
    borderRadius: "20px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "600",
    color: "white",
    cursor: "pointer",
    transition: "all 0.2s ease",
    backdropFilter: "blur(10px)",
    flexShrink: 0,
    height: "fit-content",
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 212, 170, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 6px 24px rgba(0, 212, 170, 0.2)";
      }}
    >
      {/* Header with business name and heart icon */}
      <div style={headerStyle}>
        <div style={leftHeaderStyle}>
          <div style={discountIconStyle}>%</div>
          <h2 style={businessNameStyle}>{businessDisplayName}</h2>
        </div>

        {/* Heart icon */}
        <svg
          style={heartIconStyle}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>

      {/* Bank info */}
      <div style={bankInfoStyle}>
        {bankName === "Santander" ? (
          <SantanderLogo size={28} />
        ) : (
          <div style={bankIconStyle}>{bankIconLetter}</div>
        )}
        <span style={bankNameStyle}>{bankName}</span>
      </div>

      {/* Bottom section with discount and CTA */}
      <div style={bottomSectionStyle}>
        <div style={discountSectionStyle}>
          <div style={discountTextStyle}>{discountPercentage}% OFF</div>
          <p style={descriptionStyle}>{benefitTitle}</p>
        </div>

        <button
          style={ctaButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          aria-label={`Ver detalles del beneficio: ${benefitTitle}`}
          type="button"
        >
          Ver más
        </button>
      </div>
    </div>
  );
};

export default ModernFeaturedBenefit;
