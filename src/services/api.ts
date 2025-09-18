import { mockBusinesses } from "../data/mockData";
import { Business, BankBenefit } from "../types";

declare global {
  // Extend the globalThis type to include allCategories
  var allCategories: Set<string> | undefined;
}

const API_BASE_URL =
  "https://benefits-fetcher-5na20bs0n-andresimachs-projects.vercel.app";

interface BenefitResponse {
  _id: { $oid: string };
  id: string;
  beneficios: Array<{
    tipo?: string;
    cuando?: string;
    valor?: string;
    cuota?: { $numberInt: string };
    tope?: string;
    claseDeBeneficio?: string;
    casuistica?: { descripcion: string };
    condicion?: string;
    requisitos?: string[];
    usos?: string[];
    textoAplicacion?: string;
  }>;
  cabecera: string;
  destacado: boolean;
  details: {
    beneficio: {
      titulo: string;
      rubros: { id: number; nombre: string }[];
      subtitulo: string;
      imagen: string;
      vigencia: string;
      subcabecera: string;
      cabecera: string;
    };
  };
}

interface AllBenefits {
  [key: string]: BenefitResponse[];
}

export async function fetchBusinesses(): Promise<Business[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/benefits`);
    if (!response.ok) {
      throw new Error("Failed to fetch business benefits");
    }
    const data: AllBenefits = await response.json();

    console.log("📊 Raw API Response:", {
      banks: Object.keys(data),
      sampleBenefit: Object.values(data)[0]?.[25],
    });

    // Transform the object of benefits into an array of businesses grouped by titulo
    const businessMap = new Map<string, Business>();

    // Iterate through each bank's benefits
    Object.entries(data).forEach(([bankKey, benefits]) => {
      benefits.forEach((benefit) => {
        const titulo = benefit.details.beneficio.titulo;
        const category = benefit.details.beneficio.rubros;
        const description = benefit.cabecera || "No description available";
        const bankName = bankKey.replace(/_GO$/, "").replace(/_/g, " ");

        if (!businessMap.has(titulo)) {
          businessMap.set(titulo, {
            id: titulo,
            name: titulo,
            category: category[0]?.nombre || "otros",
            description: description,
            rating: 5,
            location: "Multiple locations",
            image:
              benefit.details.beneficio.imagen ||
              "https://images.pexels.com/photos/4386158/pexels-photo-4386158.jpeg?auto=compress&cs=tinysrgb&w=400",
            benefits: [],
          });
        }

        // Add this bank's benefit to the business
        const business = businessMap.get(titulo)!;
        const firstBenefit = benefit.beneficios[0];
        const rewardRate = firstBenefit?.valor || "N/A";
        const benefitDescription =
          firstBenefit?.casuistica?.descripcion ||
          benefit.details.beneficio.subtitulo ||
          "";

        // Extract all fields from beneficios array, handling missing or empty values
        const bankBenefit: BankBenefit = {
          bankName: bankName,
          cardName: "Credit Card",
          benefit: benefitDescription,
          rewardRate: rewardRate,
          color: "bg-blue-500",
          icon: "CreditCard",
          // Extract all new fields from the first beneficio, with fallbacks
          tipo: firstBenefit?.tipo || undefined,
          cuando: firstBenefit?.cuando || undefined,
          valor: firstBenefit?.valor || undefined,
          tope: firstBenefit?.tope || undefined,
          claseDeBeneficio: firstBenefit?.claseDeBeneficio || undefined,
          condicion: firstBenefit?.condicion || undefined,
          requisitos: firstBenefit?.requisitos && firstBenefit.requisitos.length > 0
            ? firstBenefit.requisitos.filter(req => req && req.trim() !== '')
            : undefined,
          usos: firstBenefit?.usos && firstBenefit.usos.length > 0
            ? firstBenefit.usos.filter(uso => uso && uso.trim() !== '')
            : undefined,
          textoAplicacion: firstBenefit?.textoAplicacion || undefined,
        };

        business.benefits.push(bankBenefit);
      });
    });

    const businesses = Array.from(businessMap.values());

    console.log("🎯 Transformed Businesses:", {
      count: businesses.length,
      sample: businesses[0],
    });

    if (businesses.length === 0) {
      console.warn(
        "No businesses found in API response, falling back to mock data"
      );
      return mockBusinesses;
    }

    return businesses;
  } catch (error) {
    console.warn("Failed to fetch from API, falling back to mock data:", error);
    return mockBusinesses;
  }
}
