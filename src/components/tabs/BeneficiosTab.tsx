import React from "react";
import { Business, Category } from "../../types";
import CategoryGrid from "../CategoryGrid";
import BankGrid from "../BankGrid";
import InfiniteScrollGrid from "../InfiniteScrollGrid";

interface BeneficiosTabProps {
  filteredBusinesses: Business[];
  categoryGridData: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
  }>;
  bankGridData: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
  }>;
  selectedCategory: Category | "all";
  selectedBanks: string[];
  restoredDisplayCount?: number;
  onCategorySelect: (category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  }) => void;
  onBankSelect: (bank: {
    id: string;
    name: string;
    icon: string;
    color: string;
  }) => void;
  onBusinessClick: (businessId: string) => void;
  onDisplayCountChange: (count: number) => void;
}

const BeneficiosTab: React.FC<BeneficiosTabProps> = ({
  filteredBusinesses,
  categoryGridData,
  bankGridData,
  selectedCategory,
  selectedBanks,
  restoredDisplayCount,
  onCategorySelect,
  onBankSelect,
  onBusinessClick,
  onDisplayCountChange,
}) => {
  return (
    <>
      {/* Categories Grid - Sticky */}
      <div className="sticky top-[72px] z-10">
        <CategoryGrid
          categories={categoryGridData}
          onCategorySelect={onCategorySelect}
          selectedCategory={selectedCategory}
        />
      </div>

      {/* Banks Grid - Sticky */}
      <div className="sticky top-[128px] z-10">
        <BankGrid
          banks={bankGridData}
          onBankSelect={onBankSelect}
          selectedBanks={selectedBanks}
        />
      </div>

      {/* Filtered Business Grid with Infinite Scroll */}
      <div className="px-4 sm:px-6 md:px-8 py-6">
        <InfiniteScrollGrid
          businesses={filteredBusinesses}
          onBusinessClick={onBusinessClick}
          initialLoadCount={20}
          loadMoreCount={20}
          restoredDisplayCount={restoredDisplayCount}
          onDisplayCountChange={onDisplayCountChange}
        />
      </div>
    </>
  );
};

export default BeneficiosTab;
