import React from "react";
import { BankBenefit } from "../types";

interface SimpleFeaturedBenefitProps {
  benefit: BankBenefit;
  businessName?: string;
  onSelect: () => void;
}

const SimpleFeaturedBenefit: React.FC<SimpleFeaturedBenefitProps> = ({
  benefit,
  businessName,
  onSelect,
}) => {
  // Extract discount percentage from benefit text if available
  const getDiscountPercentage = (benefitText: string): string | null => {
    const percentageMatch = benefitText.match(/(\d+)%/);
    return percentageMatch ? percentageMatch[1] : null;
  };

  const discountPercentage = getDiscountPercentage(benefit.benefit);

  const cardStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    minHeight: "200px",
    borderRadius: "16px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    background: "#fff",
    marginBottom: "16px",
    transform: "translateY(0)",
  };

  const backgroundStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(135deg, ${benefit.color || "#007AFF"} 0%, ${
      benefit.color || "#5856D6"
    } 100%)`,
  };

  const gradientStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(0, 0, 0, 0.1) 100%)",
  };

  const contentStyle: React.CSSProperties = {
    position: "relative",
    zIndex: 2,
    padding: "20px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    color: "white",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
  };

  const bankInfoStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };

  const bankIconStyle: React.CSSProperties = {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    background: "rgba(255, 255, 255, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(10px)",
  };

  const bankLogoStyle: React.CSSProperties = {
    width: "24px",
    height: "24px",
    objectFit: "contain",
  };

  const bankDetailsStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  };

  const bankNameStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 600,
    opacity: 0.9,
    margin: 0,
  };

  const cardNameStyle: React.CSSProperties = {
    fontSize: "12px",
    opacity: 0.7,
    margin: 0,
  };

  const discountBadgeStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(10px)",
    borderRadius: "12px",
    padding: "8px 12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "60px",
  };

  const discountPercentageStyle: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 700,
    lineHeight: 1,
    margin: 0,
  };

  const discountTextStyle: React.CSSProperties = {
    fontSize: "10px",
    fontWeight: 600,
    opacity: 0.8,
    letterSpacing: "0.5px",
    margin: 0,
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    marginBottom: "16px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: 700,
    lineHeight: 1.3,
    margin: "0 0 8px 0",
    color: "white",
  };

  const businessStyle: React.CSSProperties = {
    fontSize: "14px",
    opacity: 0.8,
    margin: "0 0 8px 0",
    fontWeight: 500,
  };

  const footerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  };

  const availabilityStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    opacity: 0.8,
    background: "rgba(255, 255, 255, 0.1)",
    padding: "6px 10px",
    borderRadius: "20px",
    backdropFilter: "blur(5px)",
  };

  const ctaStyle: React.CSSProperties = {
    marginLeft: "auto",
    background: "rgba(255, 255, 255, 0.2)",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(10px)",
    transition: "all 0.2s ease",
  };

  return (
    <div
      style={cardStyle}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.1)";
      }}
      aria-label={`Ver detalles del beneficio: ${benefit.benefit}`}
    >
      {/* Background gradient overlay */}
      <div style={backgroundStyle}>
        <div style={gradientStyle}></div>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {/* Header with bank info */}
        <div style={headerStyle}>
          <div style={bankInfoStyle}>
            <div style={bankIconStyle}>
              {benefit.icon && (
                <img
                  src={benefit.icon}
                  alt={`${benefit.bankName} logo`}
                  style={bankLogoStyle}
                />
              )}
            </div>
            <div style={bankDetailsStyle}>
              <span style={bankNameStyle}>{benefit.bankName}</span>
              <span style={cardNameStyle}>{benefit.cardName}</span>
            </div>
          </div>

          {/* Discount badge */}
          {discountPercentage && (
            <div style={discountBadgeStyle}>
              <span style={discountPercentageStyle}>{discountPercentage}%</span>
              <span style={discountTextStyle}>OFF</span>
            </div>
          )}
        </div>

        {/* Main benefit content */}
        <div style={mainStyle}>
          <h3 style={titleStyle}>{benefit.benefit}</h3>

          {businessName && <p style={businessStyle}>en {businessName}</p>}

          {benefit.valor && (
            <p style={{ ...businessStyle, fontStyle: "italic", opacity: 0.7 }}>
              {benefit.valor}
            </p>
          )}
        </div>

        {/* Footer with additional info */}
        <div style={footerStyle}>
          {benefit.cuando && (
            <div style={availabilityStyle}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                style={{ opacity: 0.8 }}
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <polyline
                  points="12,6 12,12 16,14"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <span>{benefit.cuando}</span>
            </div>
          )}

          {benefit.rewardRate && (
            <div style={availabilityStyle}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                style={{ opacity: 0.8 }}
              >
                <polygon
                  points="12,2 15.09,8.26 22,9 17,14 18.18,21 12,17.77 5.82,21 7,14 2,9 8.91,8.26"
                  fill="currentColor"
                />
              </svg>
              <span>{benefit.rewardRate}</span>
            </div>
          )}

          {/* Call to action arrow */}
          <div style={ctaStyle}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              style={{ opacity: 0.9 }}
            >
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleFeaturedBenefit;
