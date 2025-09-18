import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { SearchBar } from "../components/SearchBar";
import { CategoryDropdown } from "../components/CategoryDropdown";
import { Container, Stack, ResponsiveBusinessGrid } from "../components/layout";
import { PullToRefresh } from "../components/ui";
import { useBusinessFilter } from "../hooks/useBusinessFilter";
import { categories as rawCategories } from "../data/mockData";
import { Business, Category } from "../types";
import { fetchBusinesses } from "../services/api";
import { useNavigate } from "react-router-dom";

function Home() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadBusinesses = async () => {
    try {
      setIsLoading(true);
      const data = await fetchBusinesses();
      setBusinesses(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load businesses:", err);
      const error =
        err instanceof Error
          ? err.message
          : "Failed to load businesses. Please try again later.";
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, []);

  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredBusinesses,
  } = useBusinessFilter(businesses);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <PullToRefresh onRefresh={loadBusinesses} className="min-h-screen">
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

              {/* Business Grid */}
              <ResponsiveBusinessGrid
                businesses={filteredBusinesses}
                onBenefitClick={(businessId, benefitIndex) =>
                  navigate(`/benefit/${businessId}/${benefitIndex}`)
                }
                isLoading={isLoading}
                variant="default"
              />
            </Stack>
          </Container>
        </main>
      </PullToRefresh>
    </div>
  );
}

export default Home;
