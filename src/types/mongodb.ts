/**
 * Your preferred Benefit types
 */

export interface Benefit {
    id: string;
    merchant: Merchant; // The business/store where you can use the benefit
    eligibilities: BenefitEligibility[];
    network: string; // Payment network (e.g., "VISA", "Mastercard")
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

export interface BenefitEligibility {
    bank: string;
    bankDisplayName: string;
    cardTypes: string[];
    cardResolutionStatus: "resolved" | "partial" | "unresolved" | "not_required";
    subscription?: string | null;
    subscriptionResolutionStatus: "resolved" | "unresolved" | "not_required";
}

export interface CardType {
    name: string;
    category: string;
    mode: "credit" | "debit";
}

export interface Merchant {
    name: string; // The business/store name where the benefit can be used (e.g., "Onfit", "McDonald's", "Nike")
    type: "business" | "event" | "brand" | "other";
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
};

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

/**
 * Raw MongoDB response structure (for internal API use)
 */
export interface MongoObjectId {
    $oid: string;
}

export interface MongoDate {
    $date: string;
}

/**
 * Bank Subscription from bank_subscriptions collection
 */
export interface BankSubscription {
    id: string;
    bank: string;
    name: string;
    icon: string | null;
}

export interface RawBankSubscription {
    _id: MongoObjectId;
    bank: string;
    name: string;
    icon: string | null;
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
    subscription?: MongoObjectId | null; // Reference to bank_subscriptions collection
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

// Helper functions
export const extractId = (mongoId: MongoObjectId): string => mongoId.$oid;
export const formatMongoDate = (mongoDate: MongoDate): Date => new Date(mongoDate.$date);

// Safe date formatter that handles various date formats
export const safeFormatDate = (dateValue: unknown): string => {
    try {
        if (!dateValue) {
            return new Date().toISOString();
        }

        // Handle MongoDB date format
        if (typeof dateValue === 'object' && dateValue !== null && '$date' in dateValue) {
            return new Date((dateValue as MongoDate).$date).toISOString();
        }

        // Handle string dates
        if (typeof dateValue === 'string') {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                return date.toISOString();
            }
        }

        // Handle number timestamps
        if (typeof dateValue === 'number') {
            return new Date(dateValue).toISOString();
        }

        // Fallback to current date
        console.warn('Could not parse date value:', dateValue, 'using current date');
        return new Date().toISOString();
    } catch (error) {
        console.warn('Error parsing date:', error, 'using current date');
        return new Date().toISOString();
    }
};

// Transform raw MongoDB benefit to your preferred Benefit structure
export const transformRawBenefitToBenefit = (rawBenefit: RawMongoBenefit): Benefit => {
    try {
        console.log('🔄 Transforming raw benefit:', {
            id: rawBenefit._id,
            merchant: rawBenefit.merchant?.name,
            processedAt: rawBenefit.processedAt,
            processedAtType: typeof rawBenefit.processedAt
        });

        // Transform locations array from raw benefit
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

        const transformedBenefit: Benefit = {
            id: extractId(rawBenefit._id),
            merchant: {
                name: rawBenefit.merchant?.name || 'Unknown Merchant',
                type: (rawBenefit.merchant?.type as Merchant['type']) || 'business'
            },
            eligibilities: Array.isArray(rawBenefit.eligibilities) ? rawBenefit.eligibilities : [],
            network: rawBenefit.network || 'Unknown Network',
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
            sourceMeta: {
                type: 'json',
                payload: JSON.stringify(rawBenefit),
                addedAt: safeFormatDate(rawBenefit.processedAt),
                lastRefreshedAt: new Date().toISOString()
            }
        };

        console.log('✅ Successfully transformed benefit:', transformedBenefit.id);
        return transformedBenefit;

    } catch (error) {
        console.error('❌ Error transforming benefit:', error, 'Raw data:', rawBenefit);

        // Return a fallback benefit to prevent the entire process from failing
        return {
            id: rawBenefit._id?.$oid || `fallback-${Date.now()}`,
            merchant: {
                name: rawBenefit.merchant?.name || 'Unknown Merchant',
                type: 'business'
            },
            eligibilities: [],
            network: rawBenefit.network || 'Unknown Network',
            benefitTitle: rawBenefit.benefitTitle || 'Benefit Available',
            description: rawBenefit.description || 'No description available',
            validUntil: null,
            discountPercentage: null,
            categories: ['otros'],
            termsAndConditions: null,
            locations: [{
                lat: 0,
                lng: 0,
                formattedAddress: 'Unknown location',
                source: 'address' as const,
                provider: 'google' as const,
                confidence: 0,
                raw: 'Unknown location',
                updatedAt: new Date().toISOString()
            }],
            online: false,
            link: null,
            availableDays: [],
            sourceMeta: {
                type: 'json',
                payload: JSON.stringify(rawBenefit),
                addedAt: new Date().toISOString(),
                lastRefreshedAt: new Date().toISOString()
            }
        };
    }
};
