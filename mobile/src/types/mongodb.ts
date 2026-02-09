import type { CanonicalLocation } from './index';

export interface Benefit {
  id: string;
  merchant: Merchant;
  bank: string;
  network: string;
  cardTypes: CardType[];
  benefitTitle: string;
  description: string;
  validUntil: string | null;
  discountPercentage: number | null;
  installments?: number | null;
  categories: Category[];
  termsAndConditions: string | null;
  locations: CanonicalLocation[];
  online: boolean;
  link: string | null;
  availableDays: string[];
  sourceMeta?: {
    type: 'json' | 'text';
    payload: string;
    addedAt: string;
    lastRefreshedAt?: string;
  };
}

export interface CardType {
  name: string;
  category: string;
  mode: 'credit' | 'debit';
}

export interface Merchant {
  name: string;
  type: 'business' | 'event' | 'brand' | 'other';
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

export interface MongoObjectId {
  $oid: string;
}

export interface MongoDate {
  $date: string;
}

export interface RawMongoBenefit {
  _id: MongoObjectId;
  merchant: {
    name: string;
    type: string;
  };
  bank: string;
  network: string;
  cardTypes: {
    name: string;
    category: string;
    mode: string;
  }[];
  benefitTitle: string;
  description: string;
  categories: string[];
  locations: {
    lat: number;
    lng: number;
    formattedAddress: string;
    source: string;
    provider: string;
    confidence: number;
    raw: string;
    updatedAt: string;
    name: string;
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
    placeId?: string;
    types?: string[];
    meta?: string;
  }[];
  online: boolean;
  availableDays: string[];
  discountPercentage: number;
  installments?: number | null;
  link: string;
  termsAndConditions: string;
  validUntil: string;
  originalId: MongoObjectId;
  sourceCollection: string;
  processedAt: MongoDate;
  processingStatus: string;
}

export interface MongoBenefitsResponse {
  success: boolean;
  benefits: RawMongoBenefit[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  filters: Record<string, unknown>;
}

export interface MongoCategoriesResponse {
  success: boolean;
  categories: string[];
}

export interface MongoBanksResponse {
  success: boolean;
  banks: string[];
}

export interface MongoStatsResponse {
  success: boolean;
  stats: {
    totalBenefits: number;
    totalMerchants: number;
    totalBanks: number;
    totalCategories: number;
    [key: string]: unknown;
  };
}

export const extractId = (mongoId: MongoObjectId): string => mongoId.$oid;

export const transformRawBenefitToBenefit = (rawBenefit: RawMongoBenefit): Benefit => {
  const transformedLocations: CanonicalLocation[] = rawBenefit.locations?.map(loc => ({
    placeId: loc.placeId,
    lat: loc.lat || 0,
    lng: loc.lng || 0,
    formattedAddress: loc.formattedAddress || 'Address not available',
    name: loc.name,
    addressComponents: loc.addressComponents,
    types: loc.types,
    source: (loc.source === 'latlng' || loc.source === 'address' || loc.source === 'name')
      ? loc.source as CanonicalLocation['source'] : 'address',
    provider: 'google' as const,
    confidence: loc.confidence || 0.5,
    raw: loc.raw || '',
    meta: loc.meta || null,
    updatedAt: loc.updatedAt || new Date().toISOString()
  })) || [{
    lat: 0,
    lng: 0,
    formattedAddress: 'Location not available',
    source: 'address' as const,
    provider: 'google' as const,
    confidence: 0.5,
    raw: 'Location not available',
    updatedAt: new Date().toISOString()
  }];

  return {
    id: extractId(rawBenefit._id),
    merchant: {
      name: rawBenefit.merchant?.name || 'Unknown Merchant',
      type: (rawBenefit.merchant?.type as Merchant['type']) || 'business'
    },
    bank: rawBenefit.bank || 'Unknown Bank',
    network: rawBenefit.network || 'Unknown Network',
    cardTypes: (rawBenefit.cardTypes || []).map(ct => ({
      name: ct?.name || 'Unknown Card',
      category: ct?.category || 'Standard',
      mode: (ct?.mode === 'credit' || ct?.mode === 'debit') ? ct.mode : 'credit'
    })),
    benefitTitle: rawBenefit.benefitTitle || 'Benefit Available',
    description: rawBenefit.description || 'No description available',
    validUntil: rawBenefit.validUntil || null,
    discountPercentage: rawBenefit.discountPercentage || null,
    installments: rawBenefit.installments || null,
    categories: (rawBenefit.categories || []).filter(cat =>
      ['gastronomia', 'moda', 'entretenimiento', 'otros', 'deportes', 'regalos',
        'viajes', 'automotores', 'belleza', 'jugueterias', 'hogar', 'electro', 'shopping'].includes(cat)
    ) as Category[],
    termsAndConditions: rawBenefit.termsAndConditions || null,
    locations: transformedLocations,
    online: rawBenefit.online || false,
    link: rawBenefit.link || null,
    availableDays: rawBenefit.availableDays || [],
  };
};
