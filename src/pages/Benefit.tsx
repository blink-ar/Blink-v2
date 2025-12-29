import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Business, BankBenefit, CanonicalLocation } from "../types";
import { SkeletonBenefitPage } from "../components/skeletons";
import StoreHeader from "../components/StoreHeader";
import StoreInformation from "../components/StoreInformation";
import { TabNavigation, TabType } from "../components/TabNavigation";
import { BankBenefitGroup } from "../components/BankBenefitGroup";
import ModernBenefitDetailModal from "../components/ModernBenefitDetailModal";
import {
  SkipToContent,
  LoadingAnnouncement,
  ErrorAnnouncement,
} from "../components/ui";
import { fetchBusinessesPaginated } from "../services/api";

function Benefit() {
  const { id, benefitIndex } = useParams<{
    id: string;
    benefitIndex: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();


  // Check for openDetails query parameter and source tab
  const searchParams = new URLSearchParams(location.search);
  const shouldOpenDetails = searchParams.get("openDetails") === "true";
  const sourceTab = searchParams.get("from") || (location.state as { from?: string })?.from || null;
  // Get scroll restoration data from location state
  const scrollRestoreData = location.state as { scrollY?: number; displayCount?: number } | null;
  const [business, setBusiness] = useState<Business | null>(null);
  const [benefit, setBenefit] = useState<BankBenefit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<CanonicalLocation | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("benefits");

  // Group benefits by bank
  const groupedBenefits = useMemo(() => {
    if (!business) return {};

    return business.benefits.reduce((acc, benefit) => {
      const bank = benefit.bankName;
      if (!acc[bank]) {
        acc[bank] = [];
      }
      acc[bank].push(benefit);
      return acc;
    }, {} as Record<string, BankBenefit[]>);
  }, [business]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetchBusinessesPaginated({
          search: id.replace(/[-\s]+/g, '[-\\s]+'),
          limit: 1
        });

        if (response.success && response.businesses.length > 0) {
          const matchingBusiness = response.businesses[0];

          let selectedBenefit = matchingBusiness.benefits[0];
          if (benefitIndex !== undefined) {
            const idx = parseInt(benefitIndex, 10);
            if (!isNaN(idx) && matchingBusiness.benefits[idx]) {
              selectedBenefit = matchingBusiness.benefits[idx];
            }
          }

          setBusiness(matchingBusiness);
          setBenefit(selectedBenefit);
        } else {
          setError("Comercio no encontrado");
        }
      } catch (err) {
        console.error("Error loading benefit:", err);
        setError("Error al cargar la información");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, benefitIndex]);

  // Auto-open details popup if requested via query parameter
  useEffect(() => {
    if (shouldOpenDetails && business && benefit && !loading) {
      setShowDetailedView(true);

      // Clean up the URL by removing the query parameter
      const newSearchParams = new URLSearchParams(location.search);
      newSearchParams.delete("openDetails");
      const newUrl = `${location.pathname}${newSearchParams.toString() ? "?" + newSearchParams.toString() : ""
        }`;
      window.history.replaceState({}, "", newUrl);
    }
  }, [
    shouldOpenDetails,
    business,
    benefit,
    loading,
    location.search,
    location.pathname,
  ]);

  // Auto-select location when store has only one valid location
  useEffect(() => {
    if (business && !selectedLocation) {
      // Filter valid locations (exclude 0,0 coordinates)
      const validLocations = business.location.filter(
        (loc) => loc.lat !== 0 || loc.lng !== 0
      );

      if (validLocations.length === 1) {
        setSelectedLocation(validLocations[0]);
      }
    }
  }, [business, selectedLocation]);

  if (loading)
    return <SkeletonBenefitPage />;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!business || !benefit) return null;

  const handleBenefitSelect = (selectedBenefit: BankBenefit) => {
    setBenefit(selectedBenefit);
    setShowDetailedView(true);
  };

  const totalBenefits = business.benefits.length;

  return (
    <div className="min-h-screen bg-gray-50 safe-area-inset">
      <SkipToContent targetId="store-content" />
      <LoadingAnnouncement
        isLoading={loading}
        message="Cargando información de la tienda"
      />
      <ErrorAnnouncement error={error} />

      {/* Store Header */}
      <StoreHeader
        business={business}
        onBack={() => {
          // Navigate back to the source tab if we know where we came from
          if (sourceTab === "beneficios") {
            navigate("/", {
              state: {
                activeTab: "beneficios",
                scrollY: scrollRestoreData?.scrollY,
                displayCount: scrollRestoreData?.displayCount
              }
            });
          } else {
            navigate(-1);
          }
        }}
      />

      {/* Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        benefitsCount={totalBenefits}
      />

      <main
        id="store-content"
        role="main"
        aria-label="Información de la tienda y beneficios"
      >
        {activeTab === "benefits" ? (
          /* Benefits Tab Content */
          <div
            role="tabpanel"
            id="benefits-panel"
            aria-labelledby="benefits-tab"
            className="px-4 py-4 space-y-4"
          >
            {Object.entries(groupedBenefits)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([bankName, benefits]) => (
                <BankBenefitGroup
                  key={bankName}
                  bankName={bankName}
                  benefits={benefits}
                  businessId={business.id}
                  defaultExpanded={true}
                  onBenefitSelect={handleBenefitSelect}
                />
              ))}
          </div>
        ) : (
          /* Info Tab Content */
          <div
            role="tabpanel"
            id="info-panel"
            aria-labelledby="info-tab"
            className="px-4 py-4"
          >
            <StoreInformation
              key={selectedLocation?.placeId || "default"}
              business={business}
              selectedLocation={selectedLocation}
              onLocationSelect={setSelectedLocation}
              onCallClick={() => {
                // Handle call action
              }}
            />
          </div>
        )}

        {/* Modern Benefit Detail Modal */}
        <ModernBenefitDetailModal
          benefit={benefit}
          isOpen={showDetailedView}
          onClose={() => setShowDetailedView(false)}
        />
      </main>
    </div>
  );
}

export default Benefit;
