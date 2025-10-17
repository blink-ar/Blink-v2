/**
 * Raw Benefits API Service
 * 
 * This service provides access to benefits data in the exact format as returned
 * by the MongoDB API (data.benefits) without any transformation.
 * 
 * Use this when you want to work with the original API structure.
 */

import { RawMongoBenefit, MongoBenefitsResponse } from '../types/mongodb';

const BASE_URL = 'https://benefits-backend-v2-public.onrender.com';

class RawBenefitsAPI {
    /**
     * Get raw benefits in exact API format
     */
    async getBenefits(params: Record<string, string> = {}): Promise<RawMongoBenefit[]> {
        const queryParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value);
            }
        });

        const url = `${BASE_URL}/api/benefits${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

        console.log('🔍 Raw Benefits API Request:', {
            url,
            params,
            timestamp: new Date().toISOString()
        });

        const response = await fetch(url);

        if (!response.ok) {
            console.error('❌ Raw Benefits API Error:', {
                status: response.status,
                statusText: response.statusText,
                url
            });
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: MongoBenefitsResponse = await response.json();

        console.log('📊 Raw Benefits API Response:', {
            success: data.success,
            benefitsCount: data.benefits?.length || 0,
            pagination: data.pagination,
            filters: data.filters
        });

        if (data.benefits && data.benefits.length > 0) {
            console.log('🎯 Sample Raw Benefit (exact data.benefits[0]):', data.benefits[0]);
        }

        // Return benefits in exact API format - no transformation
        return data.benefits || [];
    }

    /**
     * Get full response including pagination info
     */
    async getBenefitsResponse(params: Record<string, string> = {}): Promise<MongoBenefitsResponse> {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value);
            }
        });

        const url = `${BASE_URL}/api/benefits${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Get a specific benefit by ID in raw format
     */
    async getBenefitById(id: string): Promise<RawMongoBenefit | null> {
        const response = await fetch(`${BASE_URL}/api/benefits/${id}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Handle structured response - extract benefit object if wrapped
        let rawBenefit = data;
        if (data && typeof data === 'object' && data.benefit) {
            rawBenefit = data.benefit;
        }

        return rawBenefit || null;
    }
}

const rawBenefitsAPI = new RawBenefitsAPI();

// ===== MAIN FUNCTIONS =====

/**
 * Get raw benefits in exact API format (data.benefits structure)
 */
export async function getRawBenefits(options: {
    limit?: number;
    offset?: number;
    fetchAll?: boolean;
    filters?: Record<string, string>;
} = {}): Promise<RawMongoBenefit[]> {
    try {
        console.log('🚀 getRawBenefits: Fetching benefits in exact API format...', options);

        if (options.fetchAll) {
            console.log('📚 getRawBenefits: Fetching ALL benefits using pagination...');
            return await fetchAllRawBenefits(options.filters || {});
        } else {
            const offset = options.offset || 0;
            console.log(`📊 getRawBenefits: Fetching benefits starting from offset ${offset}...`);

            const params: Record<string, string> = {
                offset: offset.toString(),
                ...options.filters || {}
            };

            // Only add limit if explicitly specified
            if (options.limit) {
                params.limit = options.limit.toString();
            }

            return await rawBenefitsAPI.getBenefits(params);
        }
    } catch (error) {
        console.warn("Failed to fetch raw benefits:", error);
        return [];
    }
}

/**
 * Get ALL raw benefits using pagination
 */
export async function fetchAllRawBenefits(params: Record<string, string> = {}): Promise<RawMongoBenefit[]> {
    try {
        console.log('🔍 fetchAllRawBenefits: Starting to fetch ALL benefits in raw format...');

        const allBenefits: RawMongoBenefit[] = [];
        let offset = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
            console.log(`📄 fetchAllRawBenefits: Fetching page at offset ${offset}...`);

            const pageParams = {
                ...params,
                offset: offset.toString(),
                limit: limit.toString()
            };

            const pageBenefits = await rawBenefitsAPI.getBenefits(pageParams);

            if (pageBenefits.length === 0 || pageBenefits.length < limit) {
                hasMore = false;
            }

            allBenefits.push(...pageBenefits);
            offset += pageBenefits.length;

            console.log(`📊 fetchAllRawBenefits: Page complete. Total so far: ${allBenefits.length}`);

            // Safety break
            if (offset > 10000) {
                console.warn('⚠️ fetchAllRawBenefits: Safety limit reached');
                break;
            }
        }

        console.log(`🎯 fetchAllRawBenefits: Complete! Total raw benefits: ${allBenefits.length}`);
        return allBenefits;
    } catch (error) {
        console.error("❌ fetchAllRawBenefits: Failed:", error);
        return [];
    }
}

/**
 * Get raw benefits response with pagination info
 */
export async function getRawBenefitsResponse(params: Record<string, string> = {}): Promise<MongoBenefitsResponse> {
    try {
        return await rawBenefitsAPI.getBenefitsResponse(params);
    } catch (error) {
        console.warn("Failed to fetch raw benefits response:", error);
        return {
            success: false,
            benefits: [],
            pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
            filters: {}
        };
    }
}

/**
 * Get a specific raw benefit by ID
 */
export async function getRawBenefitById(id: string): Promise<RawMongoBenefit | null> {
    try {
        return await rawBenefitsAPI.getBenefitById(id);
    } catch (error) {
        console.error("Failed to fetch raw benefit by ID:", error);
        return null;
    }
}

// ===== CONVENIENCE FUNCTIONS =====

export async function getAllRawBenefits(): Promise<RawMongoBenefit[]> {
    console.log('🌍 getAllRawBenefits: Fetching ALL benefits in raw format...');
    return getRawBenefits({ fetchAll: true });
}

export async function getRawBenefitsWithLimit(limit: number, offset?: number): Promise<RawMongoBenefit[]> {
    console.log(`📊 getRawBenefitsWithLimit: Fetching up to ${limit} raw benefits${offset ? ` starting from ${offset}` : ''}...`);
    return getRawBenefits({ limit, offset });
}

export async function getRawBenefitsByCategory(category: string, limit?: number): Promise<RawMongoBenefit[]> {
    console.log(`🏷️ getRawBenefitsByCategory: Fetching raw benefits in category '${category}'...`);
    return getRawBenefits({
        filters: { category },
        ...(limit && { limit })
    });
}

export async function getRawBenefitsByBank(bank: string, limit?: number): Promise<RawMongoBenefit[]> {
    console.log(`🏦 getRawBenefitsByBank: Fetching raw benefits for bank '${bank}'...`);
    return getRawBenefits({
        filters: { bank },
        ...(limit && { limit })
    });
}

export async function getRawBenefitsFromStart(): Promise<RawMongoBenefit[]> {
    console.log('🏁 getRawBenefitsFromStart: Fetching raw benefits from the beginning...');
    return getRawBenefits({ offset: 0 });
}

export async function getRawBenefitsRange(offset: number, limit: number): Promise<RawMongoBenefit[]> {
    console.log(`📊 getRawBenefitsRange: Fetching ${limit} raw benefits starting from #${offset}...`);
    return getRawBenefits({ offset, limit });
}

// Export the API instance for direct use if needed
export { rawBenefitsAPI };