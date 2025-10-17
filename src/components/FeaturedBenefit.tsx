import React from "react";
import { BankBenefit } from "../types";

interface FeaturedBenefitProps {
  benefit: BankBenefit;
  businessName?: string;
  onSelect: () => void;
  className?: string;
}

const FeaturedBenefit: React.FC<FeaturedBenefitProps> = ({
  benefit,
  businessName,
  onSelect,
  className = "",
}) => {
  // Extract discount percentage from benefit text if available
  const getDiscountPercentage = (benefitText: string): string | null => {
    const percentageMatch = benefitText.match(/(\d+)%/);
    return percentageMatch ? percentageMatch[1] : null;
  };

  const discountPercentage = getDiscountPercentage(benefit.benefit);

  return (
    <div
      className={`featured-benefit-card ${className}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      style={{
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
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-label={`Ver detalles del beneficio: ${benefit.benefit}`}
    >
      {/* Background gradient overlay */}
      <div
        className="featured-benefit-card__background"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${
            benefit.color || "#007AFF"
          } 0%, ${benefit.color || "#5856D6"} 100%)`,
        }}
      >
        <div
          className="featured-benefit-card__gradient"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(0, 0, 0, 0.1) 100%)",
          }}
        ></div>
      </div>

      {/* Content */}
      <div
        className="featured-benefit-card__content"
        style={{
          position: "relative",
          zIndex: 2,
          padding: "20px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          color: "white",
        }}
      >
        {/* Header with bank info */}
        <div
          className="featured-benefit-card__header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "16px",
          }}
        >
          <div
            className="featured-benefit-card__bank-info"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              className="featured-benefit-card__bank-icon"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(10px)",
              }}
            >
              {benefit.icon && (
                <img
                  src={benefit.icon}
                  alt={`${benefit.bankName} logo`}
                  className="featured-benefit-card__bank-logo"
                />
              )}
            </div>
            <div className="featured-benefit-card__bank-details">
              <span className="featured-benefit-card__bank-name">
                {benefit.bankName}
              </span>
              <span className="featured-benefit-card__card-name">
                {benefit.cardName}
              </span>
            </div>
          </div>

          {/* Discount badge */}
          {discountPercentage && (
            <div className="featured-benefit-card__discount-badge">
              <span className="featured-benefit-card__discount-percentage">
                {discountPercentage}%
              </span>
              <span className="featured-benefit-card__discount-text">OFF</span>
            </div>
          )}
        </div>

        {/* Main benefit content */}
        <div className="featured-benefit-card__main">
          <h3 className="featured-benefit-card__title">{benefit.benefit}</h3>

          {businessName && (
            <p className="featured-benefit-card__business">en {businessName}</p>
          )}

          {benefit.valor && (
            <p className="featured-benefit-card__value">{benefit.valor}</p>
          )}
        </div>

        {/* Footer with additional info */}
        <div className="featured-benefit-card__footer">
          {benefit.cuando && (
            <div className="featured-benefit-card__availability">
              <svg
                className="featured-benefit-card__icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
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
            <div className="featured-benefit-card__reward-rate">
              <svg
                className="featured-benefit-card__icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
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
          <div className="featured-benefit-card__cta">
            <svg
              className="featured-benefit-card__arrow"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
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

export default FeaturedBenefit;
