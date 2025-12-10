import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Business, BankBenefit, CanonicalLocation } from "../types";
import { RawMongoBenefit } from "../types/mongodb";
import { getRawBenefitById } from "../services/rawBenefitsApi";
import { useBusinessesData } from "../hooks/useBenefitsData";
import { getBenefitsDataService } from "../services/BenefitsDataService";
import { DollarSign, CheckCircle, FileText, AlertTriangle } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import StoreHeader from "../components/StoreHeader";
import BenefitsFilter from "../components/BenefitsFilter";
import ModernBenefitCard from "../components/ModernBenefitCard";
import StoreInformation from "../components/StoreInformation";
import { TabNavigation, TabType } from "../components/TabNavigation";
import { StatsBar } from "../components/StatsBar";
import { BankBenefitGroup } from "../components/BankBenefitGroup";
import ModernBenefitDetailModal from "../components/ModernBenefitDetailModal";
import {
  formatValue,
  processArrayField,
  processTextField,
  hasValidContent,
  formatUsageType,
} from "../utils/benefitFormatters";
import { Logger } from "../services/base/Logger";
import { DaysOfWeek } from "../components/ui/DaysOfWeek";
import {
  SkipToContent,
  LoadingAnnouncement,
  ErrorAnnouncement,
} from "../components/ui";

const logger = Logger.getInstance().createServiceLogger("BenefitPage");

// Component prop interfaces
interface BenefitDetailsProps {
  benefit: BankBenefit;
  rawBenefit?: RawMongoBenefit | null;
}

// Error boundary wrapper for benefit sections
interface SafeBenefitSectionProps {
  children: React.ReactNode;
  sectionName: string;
  fallback?: React.ReactNode;
}

const SafeBenefitSection: React.FC<SafeBenefitSectionProps> = ({
  children,
  sectionName,
  fallback = null,
}) => {
  try {
    return <>{children}</>;
  } catch (error) {
    logger.error(`Error rendering ${sectionName} section`, error as Error);

    if (fallback) {
      return <>{fallback}</>;
    }

    // Return a minimal error indicator that doesn't break the layout
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">
            Unable to display {sectionName.toLowerCase()} information
          </span>
        </div>
      </div>
    );
  }
};

interface RequirementsSectionProps {
  requirements: string[];
}

interface LimitsSectionProps {
  value?: string;
  limit?: string;
}

interface ConditionsSectionProps {
  condition: string;
}

interface UsageSectionProps {
  usageTypes: string[];
}

interface ApplicationTextSectionProps {
  applicationText: string;
}

// Individual benefit detail components
const RequirementsSection: React.FC<RequirementsSectionProps> = ({
  requirements,
}) => {
  return (
    <SafeBenefitSection sectionName="Requirements">
      {(() => {
        try {
          const processedRequirements = processArrayField(requirements);

          if (processedRequirements.length === 0) return null;

          return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Requisitos</h4>
              </div>
              <ul className="space-y-3">
                {processedRequirements.map((requirement, index) => {
                  try {
                    return (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-blue-600 text-xs font-bold">
                            {index + 1}
                          </span>
                        </div>
                        <span className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
                          {processTextField(requirement)}
                        </span>
                      </li>
                    );
                  } catch (error) {
                    logger.error(
                      `Error rendering requirement item ${index}`,
                      error as Error,
                      { requirement }
                    );
                    return (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-gray-600 text-xs font-bold">
                            {index + 1}
                          </span>
                        </div>
                        <span className="text-gray-500 text-sm italic">
                          Unable to display this requirement
                        </span>
                      </li>
                    );
                  }
                })}
              </ul>
            </div>
          );
        } catch (error) {
          logger.error("Error processing requirements data", error as Error, {
            requirements,
          });
          return null;
        }
      })()}
    </SafeBenefitSection>
  );
};

const LimitsSection: React.FC<LimitsSectionProps> = ({ value, limit }) => {
  return (
    <SafeBenefitSection sectionName="Limits">
      {(() => {
        try {
          const processedValue = processTextField(value);
          const processedLimit = processTextField(limit);

          if (
            !hasValidContent(processedValue) &&
            !hasValidContent(processedLimit)
          )
            return null;

          const formattedValue = processedValue
            ? formatValue(processedValue)
            : null;

          return (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <h4 className="font-semibold text-purple-900">
                  Descuentos y Limites
                </h4>
              </div>
              <div className="space-y-2">
                {formattedValue && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white px-3 py-2 rounded border border-purple-100 gap-1">
                    <span className="text-sm font-medium text-purple-800">
                      Descuento:
                    </span>
                    <span className="text-sm text-purple-700 font-bold">
                      {formattedValue}
                    </span>
                  </div>
                )}
                {processedLimit && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white px-3 py-2 rounded border border-orange-100 gap-1">
                    <span className="text-sm font-medium text-orange-800">
                      Tope de reintegro:
                    </span>
                    <span className="text-sm text-orange-700 font-bold break-words">
                      ${processedLimit}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        } catch (error) {
          logger.error("Error processing limits data", error as Error, {
            value,
            limit,
          });
          return null;
        }
      })()}
    </SafeBenefitSection>
  );
};

const ConditionsSection: React.FC<ConditionsSectionProps> = ({ condition }) => {
  return (
    <SafeBenefitSection sectionName="Conditions">
      {(() => {
        try {
          const processedCondition = processTextField(condition);

          if (!hasValidContent(processedCondition)) return null;

          return (
            <div className="border-t border-gray-100 pt-3">
              <h5 className="text-sm font-medium text-gray-600 mb-2">
                Condiciones
              </h5>
              <p className="text-gray-600 text-xs leading-relaxed">
                {processedCondition}
              </p>
            </div>
          );
        } catch (error) {
          logger.error("Error processing conditions data", error as Error, {
            condition,
          });
          return null;
        }
      })()}
    </SafeBenefitSection>
  );
};

const UsageSection: React.FC<UsageSectionProps> = ({ usageTypes }) => {
  return (
    <SafeBenefitSection sectionName="Usage">
      {(() => {
        try {
          const processedUsageTypes = processArrayField(usageTypes);

          if (processedUsageTypes.length === 0) return null;

          return (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-indigo-600" />
                <h4 className="font-semibold text-indigo-900">Donde?</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {processedUsageTypes.map((usage, index) => {
                  try {
                    const formattedUsage = formatUsageType(usage);
                    return (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-2 bg-white border border-indigo-200 text-indigo-800 rounded-lg text-sm font-medium"
                      >
                        {formattedUsage}
                      </span>
                    );
                  } catch (error) {
                    logger.error(
                      `Error formatting usage type ${index}`,
                      error as Error,
                      { usage }
                    );
                    return (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-2 bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium"
                      >
                        Invalid usage type
                      </span>
                    );
                  }
                })}
              </div>
            </div>
          );
        } catch (error) {
          logger.error("Error processing usage types data", error as Error, {
            usageTypes,
          });
          return null;
        }
      })()}
    </SafeBenefitSection>
  );
};

const ApplicationTextSection: React.FC<ApplicationTextSectionProps> = ({
  applicationText,
}) => {
  return (
    <SafeBenefitSection sectionName="Application Text">
      {(() => {
        try {
          const processedText = processTextField(applicationText);

          if (!hasValidContent(processedText)) return null;

          return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-gray-600" />
                <h4 className="font-semibold text-gray-800">How to Apply</h4>
              </div>
              <div className="bg-white border border-gray-200 rounded px-4 py-3">
                <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
                  {processedText}
                </p>
              </div>
            </div>
          );
        } catch (error) {
          logger.error(
            "Error processing application text data",
            error as Error,
            { applicationText }
          );
          return null;
        }
      })()}
    </SafeBenefitSection>
  );
};

// Main benefit details section component
const BenefitDetailsSection: React.FC<BenefitDetailsProps> = ({ benefit }) => {
  return (
    <SafeBenefitSection
      sectionName="Benefit Details"
      fallback={
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Detailed Information
          </h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm">
                Unable to load detailed benefit information
              </span>
            </div>
          </div>
        </div>
      }
    >
      {(() => {
        try {
          const hasDetails =
            hasValidContent(benefit.cuando) ||
            hasValidContent(benefit.valor) ||
            hasValidContent(benefit.tope) ||
            hasValidContent(benefit.condicion) ||
            hasValidContent(benefit.requisitos) ||
            hasValidContent(benefit.usos) ||
            hasValidContent(benefit.textoAplicacion);

          if (!hasDetails) return null;

          return (
            <div className=" border-gray-200 pt-4 sm:pt-6">
              <div className="space-y-4 sm:space-y-6">
                {/* Key Financial Information - Most Important */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Beneficio
                    </h4>
                    <p className="text-gray-700 text-sm sm:text-base break-words">
                      {benefit.benefit}
                    </p>
                    {/* Display raw benefit description if available */}
                    {benefit?.description && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <h5 className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                          Descripción detallada:
                        </h5>
                        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed break-words">
                          {benefit.description}
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Days of Week Availability */}
                  <DaysOfWeek
                    benefit={benefit}
                    className="bg-teal-50 border border-teal-200 rounded-lg p-4"
                  />
                  <LimitsSection value={benefit.valor} limit={benefit.tope} />
                </div>

                {/* Usage and Application Information */}
                <div className="space-y-3 sm:space-y-4">
                  <UsageSection usageTypes={benefit.usos || []} />
                </div>

                {/* Requirements and Application Details */}
                <div className="space-y-3 sm:space-y-4">
                  <RequirementsSection
                    requirements={benefit.requisitos || []}
                  />
                  <ApplicationTextSection
                    applicationText={benefit.textoAplicacion || ""}
                  />
                  <ConditionsSection condition={benefit.condicion || ""} />

                  {/* Original Text Section for AI Analyzed Benefits */}
                </div>
              </div>
            </div>
          );
        } catch (error) {
          logger.error("Error processing benefit details", error as Error, {
            benefit,
          });
          return null;
        }
      })()}
    </SafeBenefitSection>
  );
};

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

  // Check for openDetails query parameter
  const searchParams = new URLSearchParams(location.search);
  const shouldOpenDetails = searchParams.get("openDetails") === "true";
  const [rawBenefit, setRawBenefit] = useState<RawMongoBenefit | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [benefit, setBenefit] = useState<BankBenefit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "active" | "upcoming" | "expired"
  >("all");
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<CanonicalLocation | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('benefits');

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
    return (
      <LoadingSpinner
        message="Cargando información de la tienda..."
        type="dots"
      />
    );
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!business || !benefit) return null;

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
    // In a real app, this would update the favorite status in the backend
  };

  const handleFilterToggle = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const handleFilterSelect = (
    filter: "all" | "active" | "upcoming" | "expired"
  ) => {
    setSelectedFilter(filter);
  };

  const handleBenefitSelect = (selectedBenefit: BankBenefit) => {
    setBenefit(selectedBenefit);
    setShowDetailedView(true);
  };

  // Calculate counts for the filter
  const totalBenefits = business.benefits.length;
  const activeOffers = business.benefits.filter((b) => b.rewardRate).length; // Mock logic

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
        onBack={() => navigate(-1)}
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
        {activeTab === 'benefits' ? (
          /* Benefits Tab Content */
          <div
            role="tabpanel"
            id="benefits-panel"
            aria-labelledby="benefits-tab"
            className="px-6 py-4 space-y-4"
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
            className="px-6 py-4"
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
