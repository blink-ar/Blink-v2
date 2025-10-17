export interface BankBenefit {
  bankName: string;
  cardName: string;
  benefit: string;
  rewardRate: string;
  color: string;
  icon: string;
  // Extended fields from beneficios array
  tipo?: string;
  cuando?: string;
  valor?: string;
  tope?: string;
  claseDeBeneficio?: string;
  condicion?: string;
  requisitos?: string[];
  usos?: string[];
  textoAplicacion?: string;
  // AI Analysis specific fields
  originalAnalyzedText?: string;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number;
  location: string;
  image: string;
  benefits: BankBenefit[];
  // Enhanced fields for new functionality
  isFavorite?: boolean;
  lastUpdated?: number;
  imageLoaded?: boolean;
  distance?: number; // Distance in kilometers
}

export type Category =
  | 'all'
  | 'gastronomia'
  | 'moda'
  | 'entretenimiento'
  | 'otros'
  | 'deportes'
  | 'regalos'
  | 'viajes'
  | 'automotores'
  | 'belleza'
  | 'jugueterias'
  | 'hogar'
  | 'electro'
  | 'shopping';

export interface Benefit {
  id: string;
  cardName: string;
  name: string;
  shopName: string;
  description: string;
  category: string;
  location: CanonicalLocation[];
  validFrom: string;
  validUntil: string;
  purchaseMethod: string;
  howToRedeem: string;
  limits: string;
}

export interface BenefitsResponse {
  benefits: Omit<Benefit, 'id' | 'cardName'>[];
}

export type CanonicalLocation = {
  // Stable keys and spatial info
  placeId?: string;              // Google place_id if available
  lat: number;
  lng: number;
  geohash?: string;              // or S2 cell id for fast spatial ops
  // Human-readable
  formattedAddress?: string;
  name?: string;                 // e.g., venue/store/building name
  // Structured components
  addressComponents?: {
    streetNumber?: string;
    route?: string;
    neighborhood?: string;
    sublocality?: string;
    locality?: string;           // city
    adminAreaLevel1?: string;    // state/province
    adminAreaLevel2?: string;    // county/department
    postalCode?: string;
    country?: string;            // full name
    countryCode?: string;        // ISO-2
  };
  types?: string[];              // e.g., ['restaurant', 'point_of_interest']
  // Provenance + quality
  source: 'latlng' | 'address' | 'name';
  provider: 'google' | 'mapbox';
  confidence: number;            // 0..1 based on result quality
  raw: unknown;                  // original input from the site
  meta?: Record<string, unknown>;// e.g., viewport/bounds, partial_match flags
  updatedAt: string;
};