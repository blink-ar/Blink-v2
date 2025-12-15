import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Business, BankBenefit, CanonicalLocation } from "../types";
import { RawMongoBenefit } from "../types/mongodb";
import { getRawBenefitById } from "../services/rawBenefitsApi";
import { useBusinessesData } from "../hooks/useBenefitsData";
import { getBenefitsDataService } from "../services/BenefitsDataService";
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

function Benefit() {
  const { id, benefitIndex } = useParams<{
    id: string;
    benefitIndex: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Use cached businesses data
  const {
    businesses,
    isLoading: businessesLoading,
    error: businessesError,
  } = useBusinessesData();

  // Check for openDetails query parameter and source tab
  const searchParams = new URLSearchParams(location.search);
  const shouldOpenDetails = searchParams.get("openDetails") === "true";
  const sourceTab = searchParams.get("from") || (location.state as { from?: string })?.from || null;
  // Get scroll restoration data from location state
  const scrollRestoreData = location.state as { scrollY?: number; displayCount?: number } | null;
  const [rawBenefit, setRawBenefit] = useState<RawMongoBenefit | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [benefit, setBenefit] = useState<BankBenefit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
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
      try {
        // Wait for businesses to load if they haven't yet
        if (businessesLoading) {
          return;
        }

        if (businessesError) {
          setError(businessesError);
          setLoading(false);
          return;
        }

        // Try to get raw benefit by ID first (if id is a MongoDB ObjectId)
        if (id && id.length === 24) {
          // MongoDB ObjectId length

          const rawBenefitData = await getRawBenefitById(id);
          if (rawBenefitData) {
            setRawBenefit(rawBenefitData);

            // Convert raw benefit to the format expected by the UI
            const convertedBenefit: BankBenefit = {
              bankName: rawBenefitData.bank,
              cardName: rawBenefitData.cardTypes[0]?.name || "Credit Card",
              benefit: rawBenefitData.benefitTitle,
              rewardRate: `${rawBenefitData.discountPercentage}%`,
              color: "bg-blue-500",
              icon: "CreditCard",
              tipo: "descuento",
              cuando: rawBenefitData.availableDays.join(", "),
              valor: `${rawBenefitData.discountPercentage}%`,
              condicion: rawBenefitData.termsAndConditions,
              requisitos: [
                rawBenefitData.cardTypes[0]?.name || "Tarjeta de crédito",
              ],
              usos: rawBenefitData.online
                ? ["online", "presencial"]
                : ["presencial"],
              textoAplicacion: rawBenefitData.link,
              description:
                rawBenefitData.description ||
                rawBenefitData.benefitTitle ||
                "No description available",
              installments: rawBenefitData.installments || null,
            };

            // Create a business object for the UI
            const convertedBusiness: Business = {
              id: rawBenefitData._id.$oid,
              name: rawBenefitData.merchant.name,
              category: rawBenefitData.categories[0] || "otros",
              description: `Business offering ${rawBenefitData.benefitTitle}`,
              rating: 5,
              location: rawBenefitData.locations?.map(
                (loc: RawMongoBenefit["locations"][0]) => ({
                  placeId: loc.placeId,
                  lat: loc.lat || 0,
                  lng: loc.lng || 0,
                  formattedAddress:
                    loc.formattedAddress || "Address not available",
                  name: loc.name,
                  addressComponents: loc.addressComponents,
                  types: loc.types,
                  source:
                    loc.source === "latlng" ||
                    loc.source === "address" ||
                    loc.source === "name"
                      ? loc.source
                      : ("address" as const),
                  provider: "google" as const,
                  confidence: loc.confidence || 0.5,
                  raw: loc.raw || "",
                  meta: loc.meta || null,
                  updatedAt: loc.updatedAt || new Date().toISOString(),
                })
              ) || [
                {
                  lat: 0,
                  lng: 0,
                  formattedAddress: "Location not available",
                  source: "address" as const,
                  provider: "google" as const,
                  confidence: 0.5,
                  raw: "Location not available",
                  updatedAt: new Date().toISOString(),
                },
              ],
              image:
                "https://images.pexels.com/photos/4386158/pexels-photo-4386158.jpeg?auto=compress&cs=tinysrgb&w=400",
              benefits: [convertedBenefit],
            };

            setBusiness(convertedBusiness);
            setBenefit(convertedBenefit);
            setError(null);
            return;
          }
        }

        // Use cached businesses data instead of fetching again

        // Find business by ID (which is now merchant-name-based)
        const matchingBusiness = businesses.find(
          (business: Business) =>
            business.id === id ||
            business.name.toLowerCase().replace(/\s+/g, "-") === id
        );

        if (matchingBusiness && benefitIndex !== undefined) {
          const idx = parseInt(benefitIndex, 10);
          const selectedBenefit = matchingBusiness.benefits[idx];

          if (selectedBenefit) {
            // Try to get description from cached raw benefits if missing
            if (!selectedBenefit.description) {
              try {
                const rawBenefitsForDescription =
                  await getBenefitsDataService().getRawBenefits({
                    limit: 1000,
                    offset: 0,
                  });

                // Try to find matching raw benefit by merchant name and benefit title
                const matchingRawBenefit = rawBenefitsForDescription.find(
                  (rawBenefit) =>
                    rawBenefit.merchant.name.toLowerCase() ===
                      matchingBusiness.name.toLowerCase() &&
                    rawBenefit.benefitTitle.toLowerCase() ===
                      selectedBenefit.benefit.toLowerCase()
                );

                if (matchingRawBenefit?.description) {
                  selectedBenefit.description = matchingRawBenefit.description;
                }
              } catch {
                // Silent fail for description fetch
              }
            }

            setBusiness(matchingBusiness);
            setBenefit(selectedBenefit);
            setError(null);
            return;
          }
        }

        // Last resort: try to find by MongoDB ObjectId in cached raw benefits
        const allRawBenefits = await getBenefitsDataService().getRawBenefits({
          limit: 1000,
          offset: 0,
        });

        // Try to find by MongoDB ObjectId
        const matchingBenefits = allRawBenefits.filter(
          (b) => b._id.$oid === id
        );

        if (matchingBenefits.length > 0) {
          const benefitToShow =
            benefitIndex !== undefined
              ? matchingBenefits[parseInt(benefitIndex, 10)] ||
                matchingBenefits[0]
              : matchingBenefits[0];

          if (benefitToShow) {
            setRawBenefit(benefitToShow);

            // Convert to UI format (same as above)
            const convertedBenefit: BankBenefit = {
              bankName: benefitToShow.bank,
              cardName: benefitToShow.cardTypes[0]?.name || "Credit Card",
              benefit: benefitToShow.benefitTitle,
              rewardRate: `${benefitToShow.discountPercentage}%`,
              color: "bg-blue-500",
              icon: "CreditCard",
              tipo: "descuento",
              cuando: benefitToShow.availableDays.join(", "),
              valor: `${benefitToShow.discountPercentage}%`,
              condicion: benefitToShow.termsAndConditions,
              requisitos: [
                benefitToShow.cardTypes[0]?.name || "Tarjeta de crédito",
              ],
              usos: benefitToShow.online
                ? ["online", "presencial"]
                : ["presencial"],
              textoAplicacion: benefitToShow.link,
              description:
                benefitToShow.description ||
                benefitToShow.benefitTitle ||
                "No description available",
              installments: benefitToShow.installments || null,
            };

            const convertedBusiness: Business = {
              id: benefitToShow._id.$oid,
              name: benefitToShow.merchant.name,
              category: benefitToShow.categories[0] || "otros",
              description: `Business offering ${benefitToShow.benefitTitle}`,
              rating: 5,
              location: benefitToShow.locations?.map(
                (loc: RawMongoBenefit["locations"][0]) => ({
                  placeId: loc.placeId,
                  lat: loc.lat || 0,
                  lng: loc.lng || 0,
                  formattedAddress:
                    loc.formattedAddress || "Address not available",
                  name: loc.name,
                  addressComponents: loc.addressComponents,
                  types: loc.types,
                  source:
                    loc.source === "latlng" ||
                    loc.source === "address" ||
                    loc.source === "name"
                      ? loc.source
                      : ("address" as const),
                  provider: "google" as const,
                  confidence: loc.confidence || 0.5,
                  raw: loc.raw || "",
                  meta: loc.meta || null,
                  updatedAt: loc.updatedAt || new Date().toISOString(),
                })
              ) || [
                {
                  lat: 0,
                  lng: 0,
                  formattedAddress: "Location not available",
                  source: "address" as const,
                  provider: "google" as const,
                  confidence: 0.5,
                  raw: "Location not available",
                  updatedAt: new Date().toISOString(),
                },
              ],
              image:
                "https://images.pexels.com/photos/4386158/pexels-photo-4386158.jpeg?auto=compress&cs=tinysrgb&w=400",
              benefits: [convertedBenefit],
            };

            setBusiness(convertedBusiness);
            setBenefit(convertedBenefit);
            setError(null);
            return;
          }
        }

        // If nothing found
        setBusiness(null);
        setBenefit(null);
        setError("Benefit not found");
      } catch {
        setError("Failed to load benefit");
      } finally {
        setLoading(false);
      }
    };

    // Only load when businesses data is ready
    if (!businessesLoading) {
      load();
    }
  }, [id, benefitIndex, businesses, businessesLoading, businessesError]);

  // Auto-open details popup if requested via query parameter
  useEffect(() => {
    if (shouldOpenDetails && business && benefit && !loading) {
      setShowDetailedView(true);

      // Clean up the URL by removing the query parameter
      const newSearchParams = new URLSearchParams(location.search);
      newSearchParams.delete("openDetails");
      const newUrl = `${location.pathname}${
        newSearchParams.toString() ? "?" + newSearchParams.toString() : ""
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

  if (loading)
    return <SkeletonBenefitPage />;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!business || !benefit) return null;

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
  };

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
        onFavoriteToggle={handleFavoriteToggle}
        isFavorite={isFavorite}
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
          rawBenefit={rawBenefit}
          isOpen={showDetailedView}
          onClose={() => setShowDetailedView(false)}
        />
      </main>
    </div>
  );
}

export default Benefit;
