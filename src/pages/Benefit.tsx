import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Business, BankBenefit } from "../types";
import { RawBenefit } from "../types/benefit";
import { getRawBenefitById, getRawBenefits } from "../services/rawBenefitsApi";
import { fetchBusinesses } from "../services/api";
import {
  ArrowLeft,
  DollarSign,
  AlertCircle,
  CheckCircle,
  FileText,
  AlertTriangle,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  formatValue,
  processArrayField,
  processTextField,
  hasValidContent,
  formatBenefitType,
  formatUsageType,
} from "../utils/benefitFormatters";
import { Logger } from "../services/base/Logger";
import { DaysOfWeek } from "../components/ui/DaysOfWeek";

const logger = Logger.getInstance().createServiceLogger("BenefitPage");

// Component prop interfaces
interface BenefitDetailsProps {
  benefit: BankBenefit;
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
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded border border-purple-100">
                    <span className="text-sm font-medium text-purple-800">
                      Descuento:
                    </span>
                    <span className="text-sm text-purple-700 font-bold">
                      {formattedValue}%
                    </span>
                  </div>
                )}
                {processedLimit && (
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded border border-orange-100">
                    <span className="text-sm font-medium text-orange-800">
                      Tope de reintegro:
                    </span>
                    <span className="text-sm text-orange-700 font-bold">
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
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <h4 className="font-semibold text-yellow-900">Condiciones</h4>
              </div>
              <div className="bg-white border-l-4 border-yellow-400 px-4 py-3 rounded">
                <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
                  {processedCondition}
                </p>
              </div>
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
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Detailed Information
              </h3>

              <div className="space-y-6">
                {/* Key Financial Information - Most Important */}
                <div className="grid gap-4">
                  {/* Days of Week Availability */}
                  <DaysOfWeek
                    benefit={benefit}
                    className="bg-teal-50 border border-teal-200 rounded-lg p-4"
                  />
                  <LimitsSection value={benefit.valor} limit={benefit.tope} />
                </div>

                {/* Usage and Application Information */}
                <div className="space-y-4">
                  <ConditionsSection condition={benefit.condicion || ""} />
                  <UsageSection usageTypes={benefit.usos || []} />
                </div>

                {/* Requirements and Application Details */}
                <div className="space-y-4">
                  <RequirementsSection
                    requirements={benefit.requisitos || []}
                  />
                  <ApplicationTextSection
                    applicationText={benefit.textoAplicacion || ""}
                  />

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
  const [rawBenefit, setRawBenefit] = useState<RawBenefit | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [benefit, setBenefit] = useState<BankBenefit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        console.log(
          "🔍 Loading benefit with ID:",
          id,
          "and index:",
          benefitIndex
        );

        // Try to get raw benefit by ID first (if id is a MongoDB ObjectId)
        if (id && id.length === 24) {
          // MongoDB ObjectId length
          console.log("🔍 Trying to fetch raw benefit by ID:", id);
          const rawBenefitData = await getRawBenefitById(id);
          if (rawBenefitData) {
            console.log("✅ Found raw benefit:", rawBenefitData);
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
            };

            // Create a business object for the UI
            const convertedBusiness: Business = {
              id: rawBenefitData._id.$oid,
              name: rawBenefitData.merchant.name,
              category: rawBenefitData.categories[0] || "otros",
              description: rawBenefitData.description,
              rating: 5,
              location: rawBenefitData.location,
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

        // Fallback: try to find business by merchant name
        console.log("🔍 Searching for business by merchant name...");
        const businesses = await fetchBusinesses();
        console.log("📊 Got", businesses.length, "businesses");

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
            console.log("✅ Found business and benefit:", {
              businessName: matchingBusiness.name,
              benefitIndex: idx,
              benefit: selectedBenefit,
            });

            setBusiness(matchingBusiness);
            setBenefit(selectedBenefit);
            setError(null);
            return;
          }
        }

        // Last resort: try to find by MongoDB ObjectId in raw benefits
        console.log("🔍 Last resort: searching in all raw benefits...");
        const allRawBenefits = await getRawBenefits({
          limit: "1000",
          offset: "0",
        });
        console.log("📊 Got", allRawBenefits.length, "raw benefits");

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
            console.log("✅ Found matching benefit:", benefitToShow);
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
            };

            const convertedBusiness: Business = {
              id: benefitToShow._id.$oid,
              name: benefitToShow.merchant.name,
              category: benefitToShow.categories[0] || "otros",
              description: benefitToShow.description,
              rating: 5,
              location: benefitToShow.location,
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
        console.warn(
          "❌ No benefit found for ID:",
          id,
          "and index:",
          benefitIndex
        );
        setBusiness(null);
        setBenefit(null);
        setError("Benefit not found");
      } catch (err) {
        console.error("❌ Error loading benefit:", err);
        setError("Failed to load benefit");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, benefitIndex]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!business || !benefit) return null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <button
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="font-medium">Back</span>
      </button>
      <h2 className="text-2xl font-bold mb-4">
        {business.name} - {benefit.cardName}
      </h2>
      <img
        src={business.image}
        alt={business.name}
        className="w-full h-48 object-cover rounded-xl mb-4"
      />
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Main Benefit Information */}
        <SafeBenefitSection
          sectionName="Main Benefit Information"
          fallback={
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm">
                    Unable to display main benefit information
                  </span>
                </div>
              </div>
            </div>
          }
        >
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h3 className="text-xl font-semibold mb-3 text-gray-900">
              {(() => {
                try {
                  const bankName =
                    typeof benefit.bankName === "string"
                      ? benefit.bankName
                      : "Unknown Bank";
                  const cardName =
                    typeof benefit.cardName === "string"
                      ? benefit.cardName
                      : "Unknown Card";
                  return `${bankName} ${cardName}`;
                } catch (error) {
                  logger.error(
                    "Error displaying bank/card name",
                    error as Error,
                    { benefit }
                  );
                  return "Benefit Information";
                }
              })()}
            </h3>
            <p className="text-gray-700 mb-4 leading-relaxed">
              {(() => {
                try {
                  const benefitText =
                    typeof benefit.benefit === "string"
                      ? benefit.benefit
                      : "Benefit description not available";
                  return benefitText || "Benefit description not available";
                } catch (error) {
                  logger.error(
                    "Error displaying benefit description",
                    error as Error,
                    { benefit }
                  );
                  return "Benefit description not available";
                }
              })()}
            </p>
            <div className="flex items-center gap-3 mb-4">
              {(() => {
                try {
                  const rewardRate =
                    typeof benefit.rewardRate === "string"
                      ? benefit.rewardRate
                      : "Rate not available";
                  const tipo =
                    typeof benefit.tipo === "string" ? benefit.tipo : null;
                  const claseDeBeneficio =
                    typeof benefit.claseDeBeneficio === "string"
                      ? benefit.claseDeBeneficio
                      : null;

                  return (
                    <>
                      <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        {rewardRate || "Rate not available"}
                      </div>
                      {/* Benefit Type and Class badges */}
                      {tipo && (
                        <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {formatBenefitType(tipo)}
                        </span>
                      )}
                      {claseDeBeneficio && (
                        <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          {formatBenefitType(claseDeBeneficio)}
                        </span>
                      )}
                    </>
                  );
                } catch (error) {
                  logger.error(
                    "Error displaying benefit badges",
                    error as Error,
                    { benefit }
                  );
                  return (
                    <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm">
                      Benefit details unavailable
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </SafeBenefitSection>

        {/* Business Description */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">
            About {business.name}
          </h4>
          <p className="text-gray-600 leading-relaxed">
            {business.description}
          </p>
        </div>

        {/* Benefit Details Section */}
        <BenefitDetailsSection benefit={benefit} />

        {/* Raw MongoDB Data Section */}
        {rawBenefit && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              📊 Raw MongoDB Data
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>
                <strong>ID:</strong> {rawBenefit._id.$oid}
              </p>
              <p>
                <strong>Source:</strong> {rawBenefit.sourceCollection}
              </p>
              <p>
                <strong>Status:</strong> {rawBenefit.processingStatus}
              </p>
              <p>
                <strong>Valid Until:</strong> {rawBenefit.validUntil}
              </p>
              {rawBenefit.link && (
                <p>
                  <strong>Website:</strong>{" "}
                  <a
                    href={
                      rawBenefit.link.startsWith("http")
                        ? rawBenefit.link
                        : `https://${rawBenefit.link}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {rawBenefit.link}
                  </a>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Benefit;
