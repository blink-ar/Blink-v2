import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Header } from "../components/Header";
import { SearchBar } from "../components/SearchBar";
import FeaturedBenefits from "../components/FeaturedBenefits";
import CategoryGrid from "../components/CategoryGrid";
import BankGrid from "../components/BankGrid";
import ActiveOffers from "../components/ActiveOffers";
// import NearbyBusinesses from "../components/NearbyBusinesses";
import InfiniteScrollGrid from "../components/InfiniteScrollGrid";
import BottomNavigation, {
  NavigationTab,
} from "../components/BottomNavigation";
import {
  SkipToContent,
  LoadingAnnouncement,
  ErrorAnnouncement,
} from "../components/ui";
import { useBusinessFilter } from "../hooks/useBusinessFilter";
import { useBenefitsData } from "../hooks/useBenefitsData";
import { CacheNotification } from "../components/CacheNotification";

// Categories are now defined inline for the modern UI
import { Business, Category } from "../types";
import { RawMongoBenefit } from "../types/mongodb";
import { useNavigate, useLocation } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  // Use the cached benefits data hook
  const {
    businesses: paginatedBusinesses,
    featuredBenefits: rawBenefits,
    isLoading,
    error,
  } = useBenefitsData();

  // State for bottom navigation - check if we're returning from a benefit page with an active tab
  const locationState = location.state as {
    activeTab?: NavigationTab;
    scrollY?: number;
    displayCount?: number;
  } | null;
  const initialTab = locationState?.activeTab || "inicio";
  const [activeTab, setActiveTab] = useState<NavigationTab>(initialTab);

  // Scroll restoration state
  const restoredScrollY = locationState?.scrollY;
  const restoredDisplayCount = locationState?.displayCount;
  const [currentDisplayCount, setCurrentDisplayCount] = useState(restoredDisplayCount || 20);
  const hasRestoredScroll = useRef(false);

  // Restore scroll position after component mounts and content is loaded
  useEffect(() => {
    if (restoredScrollY !== undefined && !hasRestoredScroll.current && !isLoading) {
      // Small delay to ensure content is rendered
      const timeoutId = setTimeout(() => {
        window.scrollTo(0, restoredScrollY);
        hasRestoredScroll.current = true;
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [restoredScrollY, isLoading]);

  // State for cache notifications
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "warning" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  // Removed unused infinite scroll variables for modern UI

  // State for bank filter (multiple selection)
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);

  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredBusinesses,
  } = useBusinessFilter(paginatedBusinesses, selectedBanks);

  // Show filtered results when searching, filtering, or when "beneficios" tab is active
  const shouldShowFilteredResults =
    searchTerm.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedBanks.length > 0 ||
    activeTab === "beneficios";

  // Auto-switch to beneficios tab when user starts typing
  useEffect(() => {
    if (searchTerm.trim() !== "" && activeTab !== "beneficios") {
      setActiveTab("beneficios");
    }
  }, [searchTerm, activeTab]);

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
    { id: "deportes", name: "Deportes", icon: "⚽", color: "#059669" },
    { id: "regalos", name: "Regalos", icon: "🎁", color: "#DC2626" },
    { id: "viajes", name: "Viajes", icon: "✈️", color: "#06B6D4" },
    { id: "automotores", name: "Automotores", icon: "🚗", color: "#1F2937" },
    { id: "belleza", name: "Belleza", icon: "💄", color: "#EC4899" },
    { id: "jugueterias", name: "Jugueterías", icon: "🧸", color: "#F97316" },
    { id: "hogar", name: "Hogar", icon: "🏠", color: "#7C3AED" },
    { id: "electro", name: "Electro", icon: "📱", color: "#0891B2" },
    { id: "shopping", name: "Super", icon: "🛒", color: "#10B981" },
    { id: "otros", name: "Otros", icon: "📦", color: "#6B7280" },
  ];

  // Transform banks for BankGrid component
  const bankGridData = [
    { id: "santander", name: "Santander", icon: "🏦", color: "#EC0000" },
    { id: "bbva", name: "BBVA", icon: "🏦", color: "#004481" },
    {
      id: "banco-de-chile",
      name: "Banco de Chile",
      icon: "🏦",
      color: "#003DA5",
    },
    { id: "bci", name: "BCI", icon: "🏦", color: "#FF6B35" },
    { id: "banco-estado", name: "Banco Estado", icon: "🏦", color: "#0066CC" },
    { id: "scotiabank", name: "Scotiabank", icon: "🏦", color: "#DA020E" },
    { id: "itau", name: "Itaú", icon: "🏦", color: "#FF6900" },
    { id: "falabella", name: "Falabella", icon: "🏦", color: "#7B68EE" },
    { id: "ripley", name: "Ripley", icon: "🏦", color: "#E31837" },
    { id: "cencosud", name: "Cencosud", icon: "🏦", color: "#00A651" },
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

  // Memoized featured benefits - prevents re-computation on every render
  const featuredBenefits = useMemo(
    () => rawBenefits.slice(0, 1),
    [rawBenefits]
  );

  // Memoized active offers (businesses with high discounts)
  const activeOffers = useMemo(
    () =>
      paginatedBusinesses
        .filter((business) =>
          business.benefits.some(
            (benefit) =>
              benefit.rewardRate.includes("%") ||
              benefit.rewardRate.includes("x")
          )
        )
        .slice(0, 8),
    [paginatedBusinesses]
  );

  // Memoized Santander exclusive offers
  const santanderOffers = useMemo(
    () =>
      paginatedBusinesses
        .filter((business) =>
          business.benefits.some((benefit) =>
            benefit.bankName.toLowerCase().includes("santander")
          )
        )
        .slice(0, 8),
    [paginatedBusinesses]
  );

  // Memoized BBVA exclusive offers
  const bbvaOffers = useMemo(
    () =>
      paginatedBusinesses
        .filter((business) =>
          business.benefits.some((benefit) =>
            benefit.bankName.toLowerCase().includes("bbva")
          )
        )
        .slice(0, 8),
    [paginatedBusinesses]
  );

  // Memoized food category offers
  const foodOffers = useMemo(
    () =>
      paginatedBusinesses
        .filter(
          (business) => business.category.toLowerCase() === "gastronomia"
        )
        .slice(0, 8),
    [paginatedBusinesses]
  );

  // Memoized high-value offers (benefits with high percentages)
  const highValueOffers = useMemo(
    () =>
      paginatedBusinesses
        .filter((business) =>
          business.benefits.some((benefit) => {
            const percentageMatch = benefit.rewardRate.match(/(\d+)%/);
            if (percentageMatch) {
              const percentage = parseInt(percentageMatch[1]);
              return percentage >= 20; // 20% or higher discount
            }
            return false;
          })
        )
        .slice(0, 8),
    [paginatedBusinesses]
  );

  // Memoized biggest discount offers (sorted by highest percentage)
  const biggestDiscountOffers = useMemo(
    () =>
      paginatedBusinesses
        .map((business) => {
          let maxDiscount = 0;
          business.benefits.forEach((benefit) => {
            const percentageMatch = benefit.rewardRate.match(/(\d+)%/);
            if (percentageMatch) {
              const percentage = parseInt(percentageMatch[1]);
              maxDiscount = Math.max(maxDiscount, percentage);
            }
          });
          return { ...business, maxDiscount };
        })
        .filter((business) => business.maxDiscount > 0)
        .sort((a, b) => b.maxDiscount - a.maxDiscount)
        .slice(0, 8),
    [paginatedBusinesses]
  );

  // Get nearby businesses (simulate with distance)
  // const getNearbyBusinesses = (): Business[] => {
  //   return paginatedBusinesses
  //     .map((business) => ({
  //       ...business,
  //       distance: Math.random() * 5 + 0.1, // Random distance between 0.1 and 5.1 km
  //     }))
  //     .sort((a, b) => (a.distance || 0) - (b.distance || 0))
  //     .slice(0, 6); // Show top 6 nearest
  // };

  const handleCategorySelect = (category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  }) => {
    // If clicking on the already selected category, clear the filter
    if (selectedCategory === category.id) {
      setSelectedCategory("all");
    } else {
      setSelectedCategory(category.id as Category);
    }
  };

  const handleBankSelect = (bank: {
    id: string;
    name: string;
    icon: string;
    color: string;
  }) => {
    setSelectedBanks((prev) => {
      // If bank is already selected, remove it
      if (prev.includes(bank.id)) {
        return prev.filter((id) => id !== bank.id);
      }
      // Otherwise, add it to the selection
      return [...prev, bank.id];
    });
  };

  // Callback to track display count changes from InfiniteScrollGrid
  const handleDisplayCountChange = useCallback((count: number) => {
    setCurrentDisplayCount(count);
  }, []);

  const handleBusinessClick = (businessId: string) => {
    // Save current scroll position and display count before navigating
    const scrollY = window.scrollY;
    // Pass the current tab, scroll position, and display count so we can restore them
    navigate(`/benefit/${businessId}/0?from=${activeTab}`, {
      state: { scrollY, displayCount: currentDisplayCount }
    });
  };

  const handleViewAllBenefits = () => {
    // Switch to beneficios tab to show all benefits
    setActiveTab("beneficios");
  };

  const handleBenefitSelect = (benefit: RawMongoBenefit) => {
    // Find the business that matches this benefit's merchant
    const matchingBusiness = paginatedBusinesses.find(
      (business) =>
        business.name
          .toLowerCase()
          .includes(benefit.merchant.name.toLowerCase()) ||
        benefit.merchant.name
          .toLowerCase()
          .includes(business.name.toLowerCase())
    );

    if (matchingBusiness) {
      // Navigate to the business page
      console.log("Selected benefit:", {
        merchant: benefit.merchant.name,
        bank: benefit.bank,
        title: benefit.benefitTitle,
        discount: benefit.discountPercentage,
        matchingBusiness: matchingBusiness.name,
        businessId: matchingBusiness.id,
      });
      console.log(
        "🔗 Navigating to business page with popup:",
        `/benefit/${matchingBusiness.id}/0?openDetails=true&from=${activeTab}`
      );
      const scrollY = window.scrollY;
      navigate(`/benefit/${matchingBusiness.id}/0?openDetails=true&from=${activeTab}`, {
        state: { scrollY, displayCount: currentDisplayCount }
      });
    } else {
      // Fallback: if no matching business found, navigate to the first available business
      // or switch to the benefits tab to show all benefits
      console.log(
        "No matching business found for merchant:",
        benefit.merchant.name
      );
      console.log(
        "Available businesses:",
        paginatedBusinesses.map((b) => b.name)
      );

      if (paginatedBusinesses.length > 0) {
        // Navigate to the first business as a fallback
        console.log(
          "🔗 Fallback: Navigating to first business:",
          `/benefit/${paginatedBusinesses[0].id}/0?from=${activeTab}`
        );
        const scrollY = window.scrollY;
        navigate(`/benefit/${paginatedBusinesses[0].id}/0?from=${activeTab}`, {
          state: { scrollY, displayCount: currentDisplayCount }
        });
      } else {
        // If no businesses available, switch to benefits tab
        console.log("🔗 Fallback: Switching to benefits tab");
        setActiveTab("beneficios");
      }
    }
  };

  const handleViewAllOffers = () => {
    // Navigate to filtered view or show all businesses
    setSelectedCategory("all");
  };

  // const handleViewMap = () => {
  //   // In a real app, this would navigate to map view
  //   // For now, we'll keep the user on the current tab
  // };

  const handleTabChange = (tab: NavigationTab) => {
    setActiveTab(tab);
    // Handle navigation based on tab
    switch (tab) {
      case "inicio":
        // Clear any filters when going back to home view
        setSearchTerm("");
        setSelectedCategory("all");
        setSelectedBanks([]);
        break;
      case "beneficios":
        // Clear search but keep category and bank filters available for beneficios view
        setSearchTerm("");
        // Don't clear category or bank filters - let user filter within beneficios view
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
        <div className="sticky top-0 z-10 px-4 sm:px-6 md:px-8 py-4 bg-white">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar descuentos, tiendas..."
          />
        </div>

        {/* Categories Grid - Sticky - Only visible in Beneficios tab */}
        {activeTab === "beneficios" && (
          <div className="sticky top-[72px] z-10">
            <CategoryGrid
              categories={categoryGridData}
              onCategorySelect={handleCategorySelect}
              selectedCategory={selectedCategory}
            />
          </div>
        )}

        {/* Banks Grid - Sticky - Only visible in Beneficios tab */}
        {activeTab === "beneficios" && (
          <div className="sticky top-[128px] z-10">
            <BankGrid
              banks={bankGridData}
              onBankSelect={handleBankSelect}
              selectedBanks={selectedBanks}
            />
          </div>
        )}

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
              /* Filtered Results View with Infinite Scroll */
              <div className="px-4 sm:px-6 md:px-8 py-6">
                <InfiniteScrollGrid
                  businesses={filteredBusinesses}
                  onBusinessClick={handleBusinessClick}
                  initialLoadCount={20}
                  loadMoreCount={20}
                  restoredDisplayCount={activeTab === "beneficios" ? restoredDisplayCount : undefined}
                  onDisplayCountChange={handleDisplayCountChange}
                />
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
                    benefits={featuredBenefits}
                    onViewAll={handleViewAllBenefits}
                    onBenefitSelect={handleBenefitSelect}
                  />
                </div>

                {/* Active Offers */}
                <div
                  className="animate-fade-in-up"
                  style={{ animationDelay: "200ms" }}
                >
                  <ActiveOffers
                    businesses={activeOffers}
                    onBusinessClick={handleBusinessClick}
                    onViewAll={handleViewAllOffers}
                  />
                </div>

                {/* Santander Exclusive Offers */}
                {santanderOffers.length > 0 && (
                  <div
                    className="animate-fade-in-up"
                    style={{ animationDelay: "250ms" }}
                  >
                    <ActiveOffers
                      businesses={santanderOffers}
                      onBusinessClick={handleBusinessClick}
                      onViewAll={() => {
                        setSelectedBanks(["santander"]);
                        setActiveTab("beneficios");
                      }}
                      title="Exclusivos Santander"
                    />
                  </div>
                )}

                {/* BBVA Exclusive Offers */}
                {bbvaOffers.length > 0 && (
                  <div
                    className="animate-fade-in-up"
                    style={{ animationDelay: "300ms" }}
                  >
                    <ActiveOffers
                      businesses={bbvaOffers}
                      onBusinessClick={handleBusinessClick}
                      onViewAll={() => {
                        setSelectedBanks(["bbva"]);
                        setActiveTab("beneficios");
                      }}
                      title="Exclusivos BBVA"
                    />
                  </div>
                )}

                {/* Food Offers */}
                {foodOffers.length > 0 && (
                  <div
                    className="animate-fade-in-up"
                    style={{ animationDelay: "350ms" }}
                  >
                    <ActiveOffers
                      businesses={foodOffers}
                      onBusinessClick={handleBusinessClick}
                      onViewAll={() => {
                        setSelectedCategory("gastronomia");
                        setActiveTab("beneficios");
                      }}
                      title="Ofertas de Comida"
                    />
                  </div>
                )}

                {/* High Value Offers */}
                {highValueOffers.length > 0 && (
                  <div
                    className="animate-fade-in-up"
                    style={{ animationDelay: "375ms" }}
                  >
                    <ActiveOffers
                      businesses={highValueOffers}
                      onBusinessClick={handleBusinessClick}
                      onViewAll={handleViewAllOffers}
                      title="Descuentos Imperdibles"
                    />
                  </div>
                )}

                {/* Biggest Discount Offers */}
                {biggestDiscountOffers.length > 0 && (
                  <div
                    className="animate-fade-in-up"
                    style={{ animationDelay: "400ms" }}
                  >
                    <ActiveOffers
                      businesses={biggestDiscountOffers}
                      onBusinessClick={handleBusinessClick}
                      onViewAll={handleViewAllOffers}
                      title="Mayores Descuentos"
                    />
                  </div>
                )}

                {/* Nearby Businesses
                <div
                  className="animate-fade-in-up"
                  style={{ animationDelay: "450ms" }}
                >
                  <NearbyBusinesses
                    businesses={getNearbyBusinesses()}
                    onBusinessClick={handleBusinessClick}
                    onViewMap={handleViewMap}
                  />
                </div> */}
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

      {/* Cache Notification */}
      <CacheNotification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ ...notification, show: false })}
      />
    </div>
  );
}

export default Home;
