import { useState, useMemo } from "react";
import { Business, Category } from "../types";
import { categoryFilterService } from "../services/CategoryFilterService";

export const useBusinessFilter = (businesses: Business[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");

  const filteredBusinesses = useMemo(() => {
    // First filter by category using the CategoryFilterService
    const categoryFiltered = categoryFilterService.filterBusinessesByCategory(
      businesses,
      selectedCategory
    );

    // Then filter by search term
    if (!searchTerm.trim()) {
      return categoryFiltered;
    }

    const lowerSearch = searchTerm.toLowerCase();
    return categoryFiltered.filter((business) => {
      return (
        business.name.toLowerCase().includes(lowerSearch) ||
        business.description.toLowerCase().includes(lowerSearch) ||
        business.location.toLowerCase().includes(lowerSearch) ||
        (typeof business.category === 'string' &&
          business.category.toLowerCase().includes(lowerSearch))
      );
    });
  }, [businesses, searchTerm, selectedCategory]);

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredBusinesses,
  };
};
