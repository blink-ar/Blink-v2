import React from "react";
import { RawMongoBenefit } from "../types/mongodb";
import ModernFeaturedBenefit from "./ModernFeaturedBenefit";

interface FeaturedBenefitsProps {
  benefits: RawMongoBenefit[];
  onViewAll: () => void;
  onBenefitSelect?: (benefit: RawMongoBenefit) => void;
  expirationDate?: string;
}

const FeaturedBenefits: React.FC<FeaturedBenefitsProps> = ({
  benefits,
  onBenefitSelect,
}) => {
  // Get only the first benefit to feature
  const featuredBenefits = benefits.slice(0, 1);

  const handleBenefitSelect = (benefit: RawMongoBenefit) => {
    if (onBenefitSelect) {
      onBenefitSelect(benefit);
    }
  };

  return (
    <div
      className="featured-benefits"
      style={{
        padding: "20px 16px",
        background: "#fff",
      }}
    >
      {/* Section Header */}
      {/* <div
        className="featured-benefits__header-section"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div
          className="featured-benefits__header-content"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            className="featured-benefits__icon"
            style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #007AFF 0%, #5856D6 100%)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div>
            <h2
              className="featured-benefits__title"
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#1a1a1a",
                margin: 0,
              }}
            >
              Beneficios destacados
            </h2>
            <p
              className="featured-benefits__subtitle"
              style={{
                fontSize: "14px",
                color: "#666",
                margin: "4px 0 0 0",
              }}
            >
              {benefitCount}{" "}
              {benefitCount === 1
                ? "beneficio disponible"
                : "beneficios disponibles"}
            </p>
          </div>
        </div>
        <button
          className="featured-benefits__view-all"
          onClick={onViewAll}
          aria-label="Ver todos los beneficios destacados"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "none",
            border: "none",
            color: "#007AFF",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            padding: "8px 12px",
            borderRadius: "8px",
            transition: "all 0.2s ease",
          }}
        >
          Ver todos
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 18L15 12L9 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div> */}

      {/* Featured Benefit Cards - Commented out */}
      {/* <div
        className="featured-benefits__cards"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "100%",
        }}
      >
        {featuredBenefits.length > 0 ? (
          featuredBenefits.map((benefit, index) => (
            <div
              key={`${benefit.bank}-${benefit.merchant.name}-${index}`}
              className="featured-benefits__card-wrapper"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ModernFeaturedBenefit
                benefit={benefit}
                onSelect={() => handleBenefitSelect(benefit)}
              />
            </div>
          ))
        ) : (
          <div className="featured-benefits__empty">
            <div className="featured-benefits__empty-icon">🎁</div>
            <h3 className="featured-benefits__empty-title">
              No hay beneficios destacados
            </h3>
            <p className="featured-benefits__empty-text">
              Los beneficios aparecerán aquí cuando estén disponibles
            </p>
          </div>
        )}
      </div> */}

      {/* Sardo Banner - Clickable with same functionality as "Ver más" */}
      <div
        className="featured-benefits__sardo-banner"
        style={{
          width: "100%",
          borderRadius: "20px",
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.3s ease",
          boxShadow: "0 6px 24px rgba(0, 0, 0, 0.1)",
        }}
        onClick={() => {
          // Use the same functionality as "Ver más" button
          if (featuredBenefits.length > 0) {
            handleBenefitSelect(featuredBenefits[0]);
          }
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(0, 0, 0, 0.1)";
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (featuredBenefits.length > 0) {
              handleBenefitSelect(featuredBenefits[0]);
            }
          }
        }}
        aria-label="Ver beneficios destacados"
      >
        <img
          src="/assets/sardoBanner.jpeg"
          alt="Sardo Banner - Ver beneficios"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
        />
      </div>
    </div>
  );
};

export default FeaturedBenefits;
