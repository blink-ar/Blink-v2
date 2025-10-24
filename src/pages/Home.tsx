import { useEffect, useState, useCallback } from "react";
import { Header } from "../components/Header";
import { SearchBar } from "../components/SearchBar";
import FeaturedBenefits from "../components/FeaturedBenefits";
import CategoryGrid from "../components/CategoryGrid";
import ActiveOffers from "../components/ActiveOffers";
import NearbyBusinesses from "../components/NearbyBusinesses";
import BusinessCard from "../components/BusinessCard";
import BottomNavigation, {
  NavigationTab,
} from "../components/BottomNavigation";
import {
  SkipToContent,
  LoadingAnnouncement,
  ErrorAnnouncement,
} from "../components/ui";
import { useBusinessFilter } from "../hooks/useBusinessFilter";

// Categories are now defined inline for the modern UI
import { Business, Category } from "../types";
import { RawMongoBenefit } from "../types/mongodb";
import { fetchAllBusinessesComplete } from "../services/api";
import { getRawBenefits } from "../services/rawBenefitsApi";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  // State for loading all businesses at once
  const [paginatedBusinesses, setPaginatedBusinesses] = useState<Business[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for raw benefits from API
  const [rawBenefits, setRawBenefits] = useState<RawMongoBenefit[]>([]);

  // State for bottom navigation
  const [activeTab, setActiveTab] = useState<NavigationTab>("inicio");

  // Load raw benefits from API
  const loadRawBenefits = useCallback(async () => {
    try {
      console.log("🚀 Loading raw benefits from API...");
      const benefits = await getRawBenefits({ limit: 10 }); // Get first 10 benefits
      setRawBenefits(benefits);
      console.log(`✅ Loaded ${benefits.length} raw benefits!`);
    } catch (err) {
      console.error("❌ Error loading raw benefits:", err);
      // Don't set error state for raw benefits, just log it
    }
  }, []);

  // Load ALL businesses at once
  const loadAllBusinesses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("🚀 Loading ALL businesses from all 1,714 benefits...");

      // Load both businesses and raw benefits
      const [allBusinesses] = await Promise.all([
        fetchAllBusinessesComplete(),
        loadRawBenefits(),
      ]);

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
  }, [loadRawBenefits]);

  // Load all businesses on mount
  useEffect(() => {
    loadAllBusinesses();
  }, [loadAllBusinesses]);

  // Removed unused infinite scroll variables for modern UI

  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredBusinesses,
  } = useBusinessFilter(paginatedBusinesses);

  // Show filtered results when searching or filtering
  const shouldShowFilteredResults =
    searchTerm.trim() !== "" || selectedCategory !== "all";

  // Transform categories for CategoryGrid component
  const categoryGridData = [
    { id: "gastronomia", name: "Comida", icon: "🍽️", color: "#F59E0B" },
    { id: "moda", name: "Ropa", icon: "👕", color: "#8B5CF6" },
    {
      id: "entretenimiento",
      name: "Entretenimiento",
      icon: "🎭",
      color: "#EF4444",
    },
    { id: "otros", name: "Otros", icon: "📦", color: "#6B7280" },
    { id: "deportes", name: "Deportes", icon: "⚽", color: "#059669" },
    { id: "regalos", name: "Regalos", icon: "🎁", color: "#DC2626" },
    { id: "viajes", name: "Viajes", icon: "✈️", color: "#06B6D4" },
    { id: "automotores", name: "Automotores", icon: "🚗", color: "#1F2937" },
    { id: "belleza", name: "Belleza", icon: "💄", color: "#EC4899" },
    { id: "jugueterias", name: "Jugueterías", icon: "🧸", color: "#F97316" },
    { id: "hogar", name: "Hogar", icon: "🏠", color: "#7C3AED" },
    { id: "electro", name: "Electro", icon: "📱", color: "#0891B2" },
    { id: "shopping", name: "Super", icon: "🛒", color: "#10B981" },
  ];

  // Helper to extract business name from benefit text
  // const extractBusinessNameFromBenefit = (benefitText: string): string => {
  //   const commonBusinesses = [
  //     "McDonald's",
  //     "Starbucks",
  //     "KFC",
  //     "Burger King",
  //     "Subway",
  //     "Pizza Hut",
  //     "Falabella",
  //     "Ripley",
  //   ];
  //   for (const business of commonBusinesses) {
  //     if (benefitText.toLowerCase().includes(business.toLowerCase())) {
  //       return business;
  //     }
  //   }
  //   return "Comercio";
  // };

  // Get featured benefits from raw API data
  const getFeaturedBenefits = (): RawMongoBenefit[] => {
    const featured = rawBenefits.slice(0, 1); // Get first benefit as featured
    console.log("🎯 Featured benefits:", featured);
    return featured;
  };

  // Get active offers (businesses with high discounts)
  const getActiveOffers = (): Business[] => {
    return paginatedBusinesses
      .filter((business) => {
        // Filter businesses that have benefits with good rewards
        return business.benefits.some(
          (benefit) =>
            benefit.rewardRate.includes("%") || benefit.rewardRate.includes("x")
        );
      })
      .slice(0, 8); // Limit to 8 for horizontal scroll
  };

  // Get nearby businesses (simulate with distance)
  const getNearbyBusinesses = (): Business[] => {
    return paginatedBusinesses
      .map((business) => ({
        ...business,
        distance: Math.random() * 5 + 0.1, // Random distance between 0.1 and 5.1 km
      }))
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, 6); // Show top 6 nearest
  };

  const handleCategorySelect = (category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  }) => {
    setSelectedCategory(category.id as Category);
  };

  const handleBusinessClick = (businessId: string) => {
    navigate(`/benefit/${businessId}/0`);
  };

  const handleViewAllBenefits = () => {
    navigate("/benefits");
  };

  const handleBenefitSelect = (benefit: RawMongoBenefit) => {
    // Get the ID in the correct format
    const benefitId =
      typeof benefit._id === "string" ? benefit._id : benefit._id.$oid;

    // Navigate to the dedicated single benefit page
    console.log("Selected benefit:", {
      id: benefitId,
      rawId: benefit._id,
      merchant: benefit.merchant.name,
      bank: benefit.bank,
      title: benefit.benefitTitle,
      discount: benefit.discountPercentage,
    });
    console.log("🔗 Navigating to:", `/single-benefit/${benefitId}`);
    navigate(`/single-benefit/${benefitId}`);
  };

  const handleViewAllOffers = () => {
    // Navigate to filtered view or show all businesses
    setSelectedCategory("all");
  };

  const handleViewMap = () => {
    setActiveTab("mapa");
    // In a real app, this would navigate to map view
  };

  const handleTabChange = (tab: NavigationTab) => {
    setActiveTab(tab);
    // Handle navigation based on tab
    switch (tab) {
      case "inicio":
        // Already on home
        break;
      case "mapa":
        // Navigate to map view
        break;
      case "favoritos":
        // Navigate to favorites
        break;
      case "tarjetas":
        // Navigate to cards
        break;
      case "perfil":
        // Navigate to profile
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 safe-area-inset">
      <SkipToContent targetId="main-content" />
      <Header />
      <LoadingAnnouncement
        isLoading={isLoading}
        message="Cargando ofertas y descuentos"
      />
      <ErrorAnnouncement error={error} />
      <main
        id="main-content"
        className="container"
        role="main"
        aria-label="Contenido principal"
      >
        {/* Search Bar */}
        <div className="px-4 sm:px-6 md:px-8 py-4 bg-white">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar descuentos, tiendas..."
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-8 px-4 sm:px-6 md:px-8">
            <div className="text-red-400 text-5xl mb-4">⚠️</div>
            <h3 className="text-lg md:text-xl font-medium text-red-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-red-600 text-sm md:text-base">{error}</p>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && !error && (
          <div className="animate-fade-in-up">
            {shouldShowFilteredResults ? (
              /* Filtered Results View */
              <div className="px-4 sm:px-6 md:px-8 py-6">
                <div className="mb-4 md:mb-6">
                  <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">
                    {searchTerm
                      ? `Resultados para "${searchTerm}"`
                      : `Categoría: ${
                          categoryGridData.find(
                            (cat) => cat.id === selectedCategory
                          )?.name || "Todos"
                        }`}
                  </h2>
                  <p className="text-sm md:text-base text-gray-600">
                    {filteredBusinesses.length}{" "}
                    {filteredBusinesses.length === 1
                      ? "resultado encontrado"
                      : "resultados encontrados"}
                  </p>
                </div>

                {/* Filtered Business Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 stagger-children">
                  {filteredBusinesses.map((business, index) => (
                    <BusinessCard
                      key={business.id}
                      business={business}
                      onClick={handleBusinessClick}
                      className="card-hover business-card micro-lift"
                      style={{ animationDelay: `${index * 50}ms` }}
                    />
                  ))}
                </div>

                {filteredBusinesses.length === 0 && (
                  <div className="text-center py-12 md:py-16">
                    <div className="text-gray-400 text-5xl md:text-6xl mb-4">
                      🔍
                    </div>
                    <h3 className="text-lg md:text-xl font-medium text-gray-900 mb-2">
                      No se encontraron resultados
                    </h3>
                    <p className="text-gray-600 text-sm md:text-base max-w-md mx-auto">
                      Intenta con otros términos de búsqueda o selecciona una
                      categoría diferente
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Default Home View */
              <div className="stagger-children">
                {/* Featured Benefits */}
                <div
                  className="animate-fade-in-up"
                  style={{ animationDelay: "0ms" }}
                >
                  <FeaturedBenefits
                    benefits={getFeaturedBenefits()}
                    onViewAll={handleViewAllBenefits}
                    onBenefitSelect={handleBenefitSelect}
                  />
                </div>

                {/* Categories Grid */}
                <div
                  className="animate-fade-in-up"
                  style={{ animationDelay: "100ms" }}
                >
                  <CategoryGrid
                    categories={categoryGridData}
                    onCategorySelect={handleCategorySelect}
                    selectedCategory={selectedCategory}
                  />
                </div>

                {/* Active Offers */}
                <div
                  className="animate-fade-in-up"
                  style={{ animationDelay: "200ms" }}
                >
                  <ActiveOffers
                    businesses={getActiveOffers()}
                    onBusinessClick={handleBusinessClick}
                    onViewAll={handleViewAllOffers}
                  />
                </div>

                {/* Nearby Businesses */}
                <div
                  className="animate-fade-in-up"
                  style={{ animationDelay: "300ms" }}
                >
                  <NearbyBusinesses
                    businesses={getNearbyBusinesses()}
                    onBusinessClick={handleBusinessClick}
                    onViewMap={handleViewMap}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col justify-center items-center py-12 md:py-16 animate-fade-in-scale">
            <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-b-2 border-primary-600 mb-4"></div>
            <div className="text-sm text-gray-600 animate-pulse">
              Cargando ofertas...
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

export default Home;
