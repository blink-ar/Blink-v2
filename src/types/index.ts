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
  description?: string;
  installments?: number | null;
  validUntil?: string | null;
  id?: string;
  // Subscription reference (ID from bank_subscriptions collection)
  subscription?: string | null;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number;
  location: CanonicalLocation[];
  image: string;
  benefits: BankBenefit[];
  // Enhanced fields for new functionality
  lastUpdated?: number;
  imageLoaded?: boolean;
  distance?: number; // Distance in kilometers
  distanceText?: string; // Formatted distance (e.g., "1.2km", "350m")
  isNearby?: boolean; // Within 50km
  hasOnline?: boolean; // Has online benefits
  priorityScore?: number; // 3 = nearby+online, 2 = nearby OR online, 1 = neither
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
  placeId?: string;
  lat: number;
  lng: number;
  geohash?: string;
  formattedAddress?: string;
  name?: string;
  addressComponents?: {
    streetNumber?: string;
    route?: string;
    neighborhood?: string;
    sublocality?: string;
    locality?: string;
    adminAreaLevel1?: string;
    adminAreaLevel2?: string;
    postalCode?: string;
    country?: string;
    countryCode?: string;
  };
  types?: string[];
  source: 'latlng' | 'address' | 'name';
  provider: 'google';
  confidence: number;
  raw: string | Record<string, unknown>;
  meta?: string | Record<string, unknown> | null;
  updatedAt: string;
  // Enhanced place details from Google Places API
  placeDetails?: {
    phoneNumber?: string;
    website?: string;
    openingHours?: {
      monday?: string;
      tuesday?: string;
      wednesday?: string;
      thursday?: string;
      friday?: string;
      saturday?: string;
      sunday?: string;
      isOpen?: boolean;
      currentStatus?: string;
    };
    rating?: number;
    priceLevel?: number;
    businessStatus?: string;
    photos?: string[];
  };
};