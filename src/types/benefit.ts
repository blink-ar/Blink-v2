/**
 * Raw benefit type - exactly as it comes from your MongoDB API
 * No transformation, no changes, just your data as-is
 */
export interface RawBenefit {
    _id: { $oid: string };
    merchant: {
        name: string;
        type: string;
    };
    bank: string;
    network: string;
    cardTypes: Array<{
        name: string;
        category: string;
        mode: string;
    }>;
    benefitTitle: string;
    description: string;
    categories: string[];
    locations: Array<{
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
    }>;
    online: boolean;
    availableDays: string[];
    discountPercentage: number;
    installments?: number | null;
    otherDiscounts?: string;
    link: string;
    termsAndConditions: string;
    validUntil: string;
    originalId: { $oid: string };
    sourceCollection: string;
    processedAt: { $date: string };
    processingStatus: string;
}

export interface BenefitsApiResponse {
    success: boolean;
    benefits: RawBenefit[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
    filters: Record<string, unknown>;
}