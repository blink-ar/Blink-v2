import React from "react";
import { Business } from "../../types";
import { RawMongoBenefit } from "../../types/mongodb";
import FeaturedBenefits from "../FeaturedBenefits";
import ActiveOffers from "../ActiveOffers";

interface InicioTabProps {
  featuredBenefits: RawMongoBenefit[];
  activeOffers: Business[];
  santanderOffers: Business[];
  bbvaOffers: Business[];
  foodOffers: Business[];
  highValueOffers: Business[];
  biggestDiscountOffers: Business[];
  onBusinessClick: (businessId: string) => void;
  onViewAllBenefits: () => void;
  onBenefitSelect: (benefit: RawMongoBenefit) => void;
  onViewAllOffers: () => void;
  onSelectBankFilter: (banks: string[]) => void;
  onSelectCategoryFilter: (category: string) => void;
  onSwitchTab: (tab: "beneficios") => void;
}

const InicioTab: React.FC<InicioTabProps> = ({
  featuredBenefits,
  activeOffers,
  santanderOffers,
  bbvaOffers,
  foodOffers,
  highValueOffers,
  biggestDiscountOffers,
  onBusinessClick,
  onViewAllBenefits,
  onBenefitSelect,
  onViewAllOffers,
  onSelectBankFilter,
  onSelectCategoryFilter,
  onSwitchTab,
}) => {
  return (
    <div className="stagger-children">
      {/* Featured Benefits */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
        <FeaturedBenefits
          benefits={featuredBenefits}
          onViewAll={onViewAllBenefits}
          onBenefitSelect={onBenefitSelect}
        />
      </div>

      {/* Active Offers */}
      <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
        <ActiveOffers
          businesses={activeOffers}
          onBusinessClick={onBusinessClick}
          onViewAll={onViewAllOffers}
        />
      </div>

      {/* Santander Exclusive Offers */}
      {santanderOffers.length > 0 && (
        <div className="animate-fade-in-up" style={{ animationDelay: "250ms" }}>
          <ActiveOffers
            businesses={santanderOffers}
            onBusinessClick={onBusinessClick}
            onViewAll={() => {
              onSelectBankFilter(["santander"]);
              onSwitchTab("beneficios");
            }}
            title="Exclusivos Santander"
          />
        </div>
      )}

      {/* BBVA Exclusive Offers */}
      {bbvaOffers.length > 0 && (
        <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <ActiveOffers
            businesses={bbvaOffers}
            onBusinessClick={onBusinessClick}
            onViewAll={() => {
              onSelectBankFilter(["bbva"]);
              onSwitchTab("beneficios");
            }}
            title="Exclusivos BBVA"
          />
        </div>
      )}

      {/* Food Offers */}
      {foodOffers.length > 0 && (
        <div className="animate-fade-in-up" style={{ animationDelay: "350ms" }}>
          <ActiveOffers
            businesses={foodOffers}
            onBusinessClick={onBusinessClick}
            onViewAll={() => {
              onSelectCategoryFilter("gastronomia");
              onSwitchTab("beneficios");
            }}
            title="Ofertas de Comida"
          />
        </div>
      )}

      {/* High Value Offers */}
      {highValueOffers.length > 0 && (
        <div className="animate-fade-in-up" style={{ animationDelay: "375ms" }}>
          <ActiveOffers
            businesses={highValueOffers}
            onBusinessClick={onBusinessClick}
            onViewAll={onViewAllOffers}
            title="Descuentos Imperdibles"
          />
        </div>
      )}

      {/* Biggest Discount Offers */}
      {biggestDiscountOffers.length > 0 && (
        <div className="animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <ActiveOffers
            businesses={biggestDiscountOffers}
            onBusinessClick={onBusinessClick}
            onViewAll={onViewAllOffers}
            title="Mayores Descuentos"
          />
        </div>
      )}
    </div>
  );
};

export default InicioTab;
