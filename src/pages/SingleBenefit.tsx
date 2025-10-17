import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { RawMongoBenefit } from "../types/mongodb";
import { getRawBenefitById, getRawBenefits } from "../services/rawBenefitsApi";
import {
  DollarSign,
  AlertCircle,
  CheckCircle,
  FileText,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CreditCard,
  MapPin,
  ExternalLink,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  SkipToContent,
  LoadingAnnouncement,
  ErrorAnnouncement,
} from "../components/ui";

function SingleBenefit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [benefit, setBenefit] = useState<RawMongoBenefit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBenefit = async () => {
      if (!id) {
        setError("No benefit ID provided");
        setLoading(false);
        return;
      }

      try {
        console.log("🔍 Loading single benefit with ID:", id);

        // First try to get benefit by ID
        let benefitData = null;
        try {
          benefitData = await getRawBenefitById(id);
        } catch (idError) {
          console.warn(
            "⚠️ Failed to get benefit by ID, trying alternative approach:",
            idError
          );
        }

        // If getting by ID failed, try to find it in the list of benefits
        if (!benefitData) {
          console.log("🔍 Searching for benefit in benefits list...");
          const allBenefits = await getRawBenefits({ limit: 100 });
          // Try both _id formats to handle different API responses
          benefitData = allBenefits.find((b) => {
            // Handle MongoObjectId format
            if (b._id && typeof b._id === "object" && "$oid" in b._id) {
              return b._id.$oid === id;
            }
            // Handle direct string format (if API returns it differently)
            return String(b._id) === id;
          });

          if (!benefitData && allBenefits.length > 0) {
            // If still not found, try with more benefits
            console.log("🔍 Expanding search to more benefits...");
            const moreBenefits = await getRawBenefits({ limit: 500 });
            benefitData = moreBenefits.find((b) => {
              // Handle MongoObjectId format
              if (b._id && typeof b._id === "object" && "$oid" in b._id) {
                return b._id.$oid === id;
              }
              // Handle direct string format (if API returns it differently)
              return String(b._id) === id;
            });
          }
        }

        if (benefitData) {
          console.log("✅ Found benefit:", benefitData);
          setBenefit(benefitData);
          setError(null);
        } else {
          console.warn("❌ Benefit not found with ID:", id);
          // As a fallback, use sample data for demonstration
          console.log("🔄 Using sample data as fallback...");
          const sampleBenefit: RawMongoBenefit = {
            _id: { $oid: id || "sample-id" },
            merchant: {
              name: "Sample Business",
              type: "business",
            },
            bank: "Santander",
            network: "VISA",
            cardTypes: [
              {
                name: "Santander Visa Crédito",
                category: "Standard",
                mode: "credit",
              },
            ],
            benefitTitle: "Beneficio de ejemplo",
            description:
              "Este es un beneficio de ejemplo mientras se resuelve la conexión con la API.",
            categories: ["otros"],
            location: "Nacional",
            online: true,
            availableDays: [
              "Lunes",
              "Martes",
              "Miércoles",
              "Jueves",
              "Viernes",
            ],
            discountPercentage: 25,
            link: "https://example.com",
            termsAndConditions: "Términos y condiciones de ejemplo.",
            validUntil: "31-12-2024",
            originalId: { $oid: "sample-original-id" },
            sourceCollection: "sample",
            processedAt: { $date: new Date().toISOString() },
            processingStatus: "sample",
          };
          setBenefit(sampleBenefit);
          setError(null);
        }
      } catch (err) {
        console.error("❌ Error loading benefit:", err);
        setError("Failed to load benefit");
      } finally {
        setLoading(false);
      }
    };

    loadBenefit();
  }, [id]);

  if (loading) {
    return (
      <LoadingSpinner
        message="Cargando detalles del beneficio..."
        type="dots"
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!benefit) return null;

  const getBankColor = (bankName: string): string => {
    const bankColors: { [key: string]: string } = {
      Santander: "#EC0000",
      "Banco de Chile": "#003DA5",
      BCI: "#FF6B35",
      "Banco Estado": "#0066CC",
      Scotiabank: "#DA020E",
      Itaú: "#FF6900",
      BBVA: "#004481",
      Falabella: "#7B68EE",
      Ripley: "#E31837",
      Cencosud: "#00A651",
    };
    return bankColors[bankName] || "#007AFF";
  };

  const bankColor = getBankColor(benefit.bank);

  return (
    <div className="min-h-screen bg-gray-50 safe-area-inset">
      <SkipToContent targetId="benefit-content" />
      <LoadingAnnouncement
        isLoading={loading}
        message="Cargando detalles del beneficio"
      />
      <ErrorAnnouncement error={error} />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Volver"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900 line-clamp-1">
                {benefit.merchant.name}
              </h1>
              <p className="text-sm text-gray-600">{benefit.bank}</p>
            </div>
          </div>
        </div>
      </div>

      <main
        id="benefit-content"
        role="main"
        aria-label="Detalles del beneficio"
        className="pb-6"
      >
        {/* Hero Section */}
        <div
          className="px-4 py-8 text-white relative overflow-hidden"
          style={{ backgroundColor: bankColor }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/30"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-lg font-bold">
                  {benefit.discountPercentage}%
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{benefit.benefitTitle}</h2>
                <p className="text-white/90 text-sm">{benefit.merchant.name}</p>
              </div>
            </div>

            {benefit.description && (
              <p className="text-white/95 text-sm leading-relaxed">
                {benefit.description}
              </p>
            )}
          </div>
        </div>

        {/* Content Sections */}
        <div className="px-4 space-y-6 mt-6">
          {/* Bank and Card Information */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">
                Información de la Tarjeta
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Banco:</span>
                <span className="text-sm font-medium text-gray-900">
                  {benefit.bank}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Red:</span>
                <span className="text-sm font-medium text-gray-900">
                  {benefit.network}
                </span>
              </div>
              {benefit.cardTypes.map((cardType, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tarjeta:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {cardType.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Discount Information */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Descuento</h3>
            </div>
            <div className="bg-white border border-green-200 rounded p-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {benefit.discountPercentage}%
                </div>
                <div className="text-sm text-green-700">de descuento</div>
              </div>
            </div>
          </div>

          {/* Availability */}
          {benefit.availableDays && benefit.availableDays.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Disponibilidad</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {benefit.availableDays.map((day, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-white border border-blue-200 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {benefit.categories && benefit.categories.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Categorías</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {benefit.categories.map((category, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-white border border-purple-200 text-purple-800 rounded-full text-sm font-medium capitalize"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Location and Online */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Dónde usar</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ubicación:</span>
                <span className="text-sm font-medium text-gray-900">
                  {benefit.location}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Online:</span>
                <span
                  className={`text-sm font-medium ${
                    benefit.online ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {benefit.online ? "Sí" : "No"}
                </span>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          {benefit.termsAndConditions && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-900">
                  Términos y Condiciones
                </h3>
              </div>
              <div className="bg-white border border-yellow-200 rounded p-3">
                <div
                  className="text-sm text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: benefit.termsAndConditions,
                  }}
                />
              </div>
            </div>
          )}

          {/* Website Link */}
          {benefit.link && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <ExternalLink className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold text-indigo-900">
                  Más Información
                </h3>
              </div>
              <a
                href={
                  benefit.link.startsWith("http")
                    ? benefit.link
                    : `https://${benefit.link}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white border border-indigo-200 text-indigo-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
              >
                Visitar sitio web
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* Validity */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-red-900">Vigencia</h3>
            </div>
            <div className="bg-white border border-red-200 rounded p-3">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Válido hasta:</div>
                <div className="text-lg font-semibold text-red-600">
                  {benefit.validUntil}
                </div>
              </div>
            </div>
          </div>

          {/* Debug Information (only in development) */}
          {import.meta.env.DEV && (
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Debug Info</h3>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  <strong>ID:</strong> {benefit._id.$oid}
                </p>
                <p>
                  <strong>Source:</strong> {benefit.sourceCollection}
                </p>
                <p>
                  <strong>Status:</strong> {benefit.processingStatus}
                </p>
                <p>
                  <strong>Processed:</strong> {benefit.processedAt.$date}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default SingleBenefit;
