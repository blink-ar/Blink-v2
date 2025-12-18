import { useState, useMemo } from "react";
import { Business, Category } from "../types";
import { categoryFilterService } from "../services/CategoryFilterService";

export const useBusinessFilter = (businesses: Business[], selectedBanks?: string[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");

  const filteredBusinesses = useMemo(() => {
    // Filter out any invalid businesses first
    const validBusinesses = businesses.filter(b => b && b.name);

    // First filter by category using the CategoryFilterService
    let filtered = categoryFilterService.filterBusinessesByCategory(
      validBusinesses,
      selectedCategory
    );

    // Then filter by banks if any are selected
    if (selectedBanks && selectedBanks.length > 0) {
      filtered = filtered.filter((business) => {
        if (!business.benefits || !Array.isArray(business.benefits)) {
          return false;
        }
        return business.benefits.some((benefit) => {
          const bankName = benefit?.bankName?.toLowerCase() || '';

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
      const nameMatch = business.name?.toLowerCase().includes(lowerSearch) || false;
      const descMatch = business.description?.toLowerCase().includes(lowerSearch) || false;
      const locationMatch = business.location?.some(
        loc => loc?.formattedAddress?.toLowerCase().includes(lowerSearch)
      ) || false;
      const categoryMatch = typeof business.category === 'string' &&
        business.category.toLowerCase().includes(lowerSearch);

      return nameMatch || descMatch || locationMatch || categoryMatch;
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
