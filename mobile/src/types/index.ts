export interface BankBenefit {
  bankName: string;
  cardName: string;
  benefit: string;
  rewardRate: string;
  color: string;
  icon: string;
  tipo?: string;
  cuando?: string;
  valor?: string;
  tope?: string;
  claseDeBeneficio?: string;
  condicion?: string;
  requisitos?: string[];
  usos?: string[];
  textoAplicacion?: string;
  originalAnalyzedText?: string;
  description?: string;
  installments?: number | null;
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
  lastUpdated?: number;
  imageLoaded?: boolean;
  distance?: number;
  distanceText?: string;
  isNearby?: boolean;
  hasOnline?: boolean;
  priorityScore?: number;
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
