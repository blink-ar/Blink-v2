import { useState, useMemo } from "react";
import { Business, Category } from "../types";
import { categoryFilterService } from "../services/CategoryFilterService";

export const useBusinessFilter = (businesses: Business[], selectedBanks?: string[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");

  const filteredBusinesses = useMemo(() => {
    // First filter by category using the CategoryFilterService
    let filtered = categoryFilterService.filterBusinessesByCategory(
      businesses,
      selectedCategory
    );

    // Then filter by banks if any are selected
    if (selectedBanks && selectedBanks.length > 0) {
      filtered = filtered.filter((business) => {
        return business.benefits.some((benefit) => {
          const bankName = benefit.bankName.toLowerCase();

          return selectedBanks.some(selectedBank => {
            const selectedBankLower = selectedBank.toLowerCase();

            // Handle different bank name formats
            if (selectedBankLower === "banco-de-chile") {
              return bankName.includes("banco de chile");
            }
            if (selectedBankLower === "banco-estado") {
              return bankName.includes("banco estado");
            }

            return bankName.includes(selectedBankLower);
          });
        });
      });
    }

    // Finally filter by search term
    if (!searchTerm.trim()) {
      return filtered;
    }

    const lowerSearch = searchTerm.toLowerCase();
    return filtered.filter((business) => {
      return (
        business.name.toLowerCase().includes(lowerSearch) ||
        business.description.toLowerCase().includes(lowerSearch) ||
        business.location.some(loc => loc.formattedAddress?.toLowerCase().includes(lowerSearch)) ||
        (typeof business.category === 'string' &&
          business.category.toLowerCase().includes(lowerSearch))
      );
    });
  }, [businesses, searchTerm, selectedCategory, selectedBanks]);

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredBusinesses,
  };
};
