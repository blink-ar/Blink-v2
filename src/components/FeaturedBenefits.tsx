import React, { useState } from "react";
import { RawMongoBenefit } from "../types/mongodb";
import Skeleton from "./ui/Skeleton";

import sardoBanner from "../assets/sardoBanner.jpeg";

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
  const [imageLoaded, setImageLoaded] = useState(false);
  
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
          position: "relative",
          aspectRatio: "1344 / 704", // Maintain exact aspect ratio
        }}
        onClick={() => {
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
        {!imageLoaded && (
          <Skeleton 
            variant="rectangular" 
            width="100%" 
            height="100%" 
            className="rounded-[20px] absolute inset-0"
          />
        )}
        <img
          src={sardoBanner}
          alt="Sardo Banner - Ver beneficios"
          onLoad={() => setImageLoaded(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: imageLoaded ? "block" : "none",
          }}
        />
      </div>
    </div>
  );
};

export default FeaturedBenefits;
