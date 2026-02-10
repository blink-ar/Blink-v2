import React from "react";
import { Business } from "../types";
import BusinessCard from "./BusinessCard";

interface ActiveOffersProps {
  businesses: Business[];
  onBusinessClick: (businessId: string) => void;
  onViewAll: () => void;
  title?: string;
}

const ActiveOffers: React.FC<ActiveOffersProps> = React.memo(({
  businesses,
  onBusinessClick,
  onViewAll,
  title = "Ofertas Activas",
}) => {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <button
          className="text-blue-500 text-sm font-medium hover:text-blue-600 transition-colors"
          onClick={onViewAll}
          aria-label={`Ver todas las ofertas de ${title.toLowerCase()}`}
        >
          Ver más
        </button>
      </div>

      <div
        className="overflow-x-auto [&::-webkit-scrollbar]:hidden scroll-smooth snap-x snap-mandatory ml-4"
        style={{
          scrollbarWidth: "none" /* Firefox */,
          msOverflowStyle: "none" /* Internet Explorer 10+ */,
        }}
      >
        <div className="flex gap-4 pb-2">
          {businesses.slice(0, 5).map((business) => (
            <BusinessCard
              key={business.id}
              business={business}
              onClick={onBusinessClick}
              className="flex-shrink-0 w-72 sm:w-80 snap-start business-card"
            />
          ))}
        </div>
      </div>
    </div>
  );
});

ActiveOffers.displayName = 'ActiveOffers';

export default ActiveOffers;
