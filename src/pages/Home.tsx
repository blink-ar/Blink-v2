import { useEffect, useState, useMemo, useRef, lazy, Suspense } from "react";
import { Header } from "../components/Header";
import { SearchBar } from "../components/SearchBar";
import { FilterMenu } from "../components/FilterMenu";
import BottomNavigation, {
  NavigationTab,
} from "../components/BottomNavigation";
import {
  SkipToContent,
  LoadingAnnouncement,
  ErrorAnnouncement,
} from "../components/ui";
import { useBenefitsData } from "../hooks/useBenefitsData";
import { useEnrichedBusinesses } from "../hooks/useEnrichedBusinesses";
import { CacheNotification } from "../components/CacheNotification";
import {
  SkeletonFeaturedBanner,
  SkeletonActiveOffers,
} from "../components/skeletons";

// Lazy load tab components for better performance
const InicioTab = lazy(() => import("../components/tabs/InicioTab"));
const BeneficiosTab = lazy(() => import("../components/tabs/BeneficiosTab"));

// Categories are now defined inline for the modern UI
import { Business, Category } from "../types";
import { RawMongoBenefit } from "../types/mongodb";
import { useNavigate, useLocation } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();



  // State for bottom navigation - check if we're returning from a benefit page with an active tab
  const locationState = location.state as {
    activeTab?: NavigationTab;
    scrollY?: number;
  } | null;
  const initialTab = locationState?.activeTab || "inicio";
  const [activeTab, setActiveTab] = useState<NavigationTab>(initialTab);

  // Scroll restoration state
  const restoredScrollY = locationState?.scrollY;
  const hasRestoredScroll = useRef(false);

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);

  // New filter states
  const [minDiscount, setMinDiscount] = useState<number | undefined>(undefined);
  const [maxDistance, setMaxDistance] = useState<number | undefined>(undefined);
  const [availableDay, setAvailableDay] = useState<string | undefined>(undefined);
  const [selectedNetwork, setSelectedNetwork] = useState<string | undefined>(undefined);
  const [cardMode, setCardMode] = useState<'credit' | 'debit' | undefined>(undefined);
  const [hasInstallments, setHasInstallments] = useState<boolean | undefined>(undefined);

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Use the cached benefits data hook with server-side pagination and filtering
  const {
    businesses: paginatedBusinesses,
    featuredBenefits: rawBenefits,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    totalBusinesses,
  } = useBenefitsData({
    search: debouncedSearchTerm.trim() || undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    bank: selectedBanks.length > 0 ? selectedBanks.join(',') : undefined,
    minDiscount,
    maxDistance,
    availableDay,
    network: selectedNetwork,
    cardMode,
    hasInstallments,
  });

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

  // State for online filter
  const [onlineOnly, setOnlineOnly] = useState(false);

  // State for filter dropdown
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilterDropdown]);

  // Enrich businesses with online information and apply client-side only filters (like onlineOnly)
  // Note: Distance calculation, proximity sorting, search, category, and bank filters are now handled by the backend
  const enrichedBusinesses = useEnrichedBusinesses(paginatedBusinesses, {
    onlineOnly,
    minDiscount,
    maxDistance,
    availableDay,
    network: selectedNetwork,
    cardMode,
    hasInstallments,
  });

  // Since search, category, and bank filters are now server-side, we only need client-side online filter
  const filteredBusinesses = enrichedBusinesses;

  // Calculate active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (onlineOnly) count++;
    if (minDiscount !== undefined) count++;
    if (maxDistance !== undefined) count++;
    if (availableDay !== undefined) count++;
    if (selectedNetwork !== undefined) count++;
    if (cardMode !== undefined) count++;
    if (hasInstallments !== undefined) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Show filtered results when searching, filtering, or when "beneficios" tab is active
  const shouldShowFilteredResults =
    searchTerm.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedBanks.length > 0 ||
    onlineOnly ||
    minDiscount !== undefined ||
    maxDistance !== undefined ||
    availableDay !== undefined ||
    selectedNetwork !== undefined ||
    cardMode !== undefined ||
    hasInstallments !== undefined ||
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

  // Memoized active offers (businesses with high discounts) - using enriched businesses for smart sorting
  const activeOffers = useMemo(
    () =>
      enrichedBusinesses
        .filter((business) =>
          business.benefits.some(
            (benefit) =>
              benefit.rewardRate.includes("%") ||
              benefit.rewardRate.includes("x")
          )
        )
        .slice(0, 8),
    [enrichedBusinesses]
  );

  // Memoized Santander exclusive offers - using enriched businesses for smart sorting
  const santanderOffers = useMemo(
    () =>
      enrichedBusinesses
        .filter((business) =>
          business.benefits?.length > 0 &&
          business.benefits.every((benefit) =>
            benefit?.bankName?.toLowerCase().includes("santander")
          )
        )
        .slice(0, 8),
    [enrichedBusinesses]
  );

  // Memoized BBVA exclusive offers - using enriched businesses for smart sorting
  const bbvaOffers = useMemo(
    () =>
      enrichedBusinesses
        .filter((business) =>
          business.benefits?.length > 0 &&
          business.benefits.every((benefit) =>
            benefit?.bankName?.toLowerCase().includes("bbva")
          )
        )
        .slice(0, 8),
    [enrichedBusinesses]
  );

  // Memoized food category offers - using enriched businesses for smart sorting
  const foodOffers = useMemo(
    () =>
      enrichedBusinesses
        .filter(
          (business) => business.category?.toLowerCase() === "gastronomia"
        )
        .slice(0, 8),
    [enrichedBusinesses]
  );

  // Memoized high-value offers (benefits with high percentages) - using enriched businesses for smart sorting
  const highValueOffers = useMemo(
    () =>
      enrichedBusinesses
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
    [enrichedBusinesses]
  );

  // Memoized biggest discount offers (sorted by highest percentage) - using enriched businesses for smart sorting
  const biggestDiscountOffers = useMemo(
    () =>
      enrichedBusinesses
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
    [enrichedBusinesses]
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

  const handleBusinessClick = (businessId: string) => {
    // Save current scroll position before navigating
    const scrollY = window.scrollY;
    navigate(`/benefit/${businessId}/0?from=${activeTab}`, {
      state: { scrollY }
    });
  };

  const handleViewAllBenefits = () => {
    // Switch to beneficios tab to show all benefits
    setActiveTab("beneficios");
  };

  const handleBenefitSelect = (benefit: RawMongoBenefit) => {
    // Find the business that matches this benefit's merchant
    const matchingBusiness = paginatedBusinesses.find(
      (business: Business) =>
        business.name
          ?.toLowerCase()
          .includes(benefit.merchant?.name?.toLowerCase() || '') ||
        benefit.merchant?.name
          ?.toLowerCase()
          .includes(business.name?.toLowerCase() || '')
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
        state: { scrollY }
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
        paginatedBusinesses.map((b: Business) => b.name)
      );

      if (paginatedBusinesses.length > 0) {
        // Navigate to the first business as a fallback
        console.log(
          "🔗 Fallback: Navigating to first business:",
          `/benefit/${paginatedBusinesses[0].id}/0?from=${activeTab}`
        );
        const scrollY = window.scrollY;
        navigate(`/benefit/${paginatedBusinesses[0].id}/0?from=${activeTab}`, {
          state: { scrollY }
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

    // Update history state so reload restores the correct tab
    navigate(".", {
      replace: true,
      state: {
        activeTab: tab,
        scrollY: 0
      }
    });

    // Handle navigation based on tab
    switch (tab) {
      case "inicio":
        // Clear any filters when going back to home view
        setSearchTerm("");
        setSelectedCategory("all");
        setSelectedBanks([]);
        setOnlineOnly(false);
        setMinDiscount(undefined);
        setMaxDistance(undefined);
        setAvailableDay(undefined);
        setSelectedNetwork(undefined);
        setCardMode(undefined);
        setHasInstallments(undefined);
        break;
      case "beneficios":
        // Clear search but keep category and bank filters available for beneficios view
        setSearchTerm("");
        // Don't clear category, bank, or online filters - let user filter within beneficios view
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
        <div className="sticky top-0 z-20 bg-white">
          <div className="px-4 sm:px-6 md:px-8 py-4">
            <div className="relative" ref={filterDropdownRef}>
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar descuentos, tiendas..."
                onFilterClick={() => setShowFilterDropdown(!showFilterDropdown)}
                activeFilterCount={activeFilterCount}
                isFilterOpen={showFilterDropdown}
                showFilter={activeTab !== "inicio"}
              />

              {/* Filter Dropdown */}
              {showFilterDropdown && (
                <FilterMenu
                  onlineOnly={onlineOnly}
                  onOnlineChange={setOnlineOnly}
                  maxDistance={maxDistance}
                  onMaxDistanceChange={setMaxDistance}
                  minDiscount={minDiscount}
                  onMinDiscountChange={setMinDiscount}
                  availableDay={availableDay}
                  onAvailableDayChange={setAvailableDay}
                  cardMode={cardMode}
                  onCardModeChange={setCardMode}
                  network={selectedNetwork}
                  onNetworkChange={setSelectedNetwork}
                  hasInstallments={hasInstallments}
                  onHasInstallmentsChange={setHasInstallments}
                  onClose={() => setShowFilterDropdown(false)}
                />
              )}
            </div>
          </div>
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

        {/* Main Content - Lazy Loaded Tabs */}
        {!isLoading && !error && (
          <Suspense fallback={
            <div className="animate-fade-in-up">
              <SkeletonFeaturedBanner />
              <SkeletonActiveOffers cardCount={3} />
              <SkeletonActiveOffers cardCount={3} />
            </div>
          }>
            <div className="animate-fade-in-up">
              {shouldShowFilteredResults ? (
                <BeneficiosTab
                  filteredBusinesses={filteredBusinesses}
                  categoryGridData={categoryGridData}
                  bankGridData={bankGridData}
                  selectedCategory={selectedCategory}
                  selectedBanks={selectedBanks}
                  onCategorySelect={handleCategorySelect}
                  onBankSelect={handleBankSelect}
                  onBusinessClick={handleBusinessClick}
                  onLoadMore={loadMore}
                  hasMore={hasMore}
                  isLoadingMore={isLoadingMore}
                  totalCount={totalBusinesses}
                />
              ) : (
                <InicioTab
                  featuredBenefits={featuredBenefits}
                  activeOffers={activeOffers}
                  santanderOffers={santanderOffers}
                  bbvaOffers={bbvaOffers}
                  foodOffers={foodOffers}
                  highValueOffers={highValueOffers}
                  biggestDiscountOffers={biggestDiscountOffers}
                  onBusinessClick={handleBusinessClick}
                  onViewAllBenefits={handleViewAllBenefits}
                  onBenefitSelect={handleBenefitSelect}
                  onViewAllOffers={handleViewAllOffers}
                  onSelectBankFilter={setSelectedBanks}
                  onSelectCategoryFilter={(category) => setSelectedCategory(category as Category)}
                  onSwitchTab={(tab) => setActiveTab(tab)}
                />
              )}
            </div>
          </Suspense>
        )}

        {/* Loading State - Skeleton Loaders */}
        {isLoading && (
          <div className="animate-fade-in-up">
            <SkeletonFeaturedBanner />
            <SkeletonActiveOffers cardCount={3} />
            <SkeletonActiveOffers cardCount={3} />
            <SkeletonActiveOffers cardCount={3} />
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
