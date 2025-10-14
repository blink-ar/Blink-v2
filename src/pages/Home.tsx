import { useEffect, useState, useCallback } from "react";
import { Header } from "../components/Header";
import { SearchBar } from "../components/SearchBar";
import { CategoryDropdown } from "../components/CategoryDropdown";
import { Container, Stack, ResponsiveBusinessGrid } from "../components/layout";
import { PullToRefresh } from "../components/ui";
import { useBusinessFilter } from "../hooks/useBusinessFilter";

import { categories as rawCategories } from "../data/mockData";
import { Business, Category } from "../types";
import { fetchAllBusinessesComplete } from "../services/api";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  // State for loading all businesses at once
  const [paginatedBusinesses, setPaginatedBusinesses] = useState<Business[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load ALL businesses at once
  const loadAllBusinesses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("🚀 Loading ALL businesses from all 1,714 benefits...");

      const allBusinesses = await fetchAllBusinessesComplete();
      setPaginatedBusinesses(allBusinesses);

      console.log(
        `✅ Loaded ${allBusinesses.length} businesses from all benefits!`
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load all businesses";
      setError(errorMessage);
      console.error("❌ Error loading all businesses:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load all businesses on mount
  useEffect(() => {
    loadAllBusinesses();
  }, [loadAllBusinesses]);

  // For compatibility with infinite scroll components (not used when loading all at once)
  const isLoadingMore = false;
  const hasMore = false;
  const setLoadingRef = () => {};

  const handleRefresh = async () => {
    // Refresh all businesses data
    await loadAllBusinesses();
  };

  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredBusinesses,
  } = useBusinessFilter(paginatedBusinesses);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
        <main className="py-6 sm:py-8">
          <Container size="md">
            <Stack spacing="lg">
              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 max-w-md">
                  <SearchBar value={searchTerm} onChange={setSearchTerm} />
                </div>
                <div className="flex justify-center sm:justify-end">
                  <CategoryDropdown
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    options={
                      rawCategories as { value: Category; label: string }[]
                    }
                  />
                </div>
              </div>

              {/* Error State */}
              {error && (
                <div className="text-center py-8">
                  <div className="text-red-400 text-5xl mb-4">⚠️</div>
                  <h3 className="text-lg font-medium text-red-900 mb-2">
                    Something went wrong
                  </h3>
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {/* Business Grid with Infinite Scroll */}
              <ResponsiveBusinessGrid
                businesses={filteredBusinesses}
                onBenefitClick={(businessId, benefitIndex) =>
                  navigate(`/benefit/${businessId}/${benefitIndex}`)
                }
                isLoading={isLoading}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
                variant="default"
                setLoadingRef={setLoadingRef}
              />
            </Stack>
          </Container>
        </main>
      </PullToRefresh>
    </div>
  );
}

export default Home;
