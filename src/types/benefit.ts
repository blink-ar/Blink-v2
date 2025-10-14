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
    location: string;
    online: boolean;
    availableDays: string[];
    discountPercentage: number;
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