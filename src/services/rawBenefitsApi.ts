import { RawBenefit, BenefitsApiResponse } from '../types/benefit';

const BASE_URL = 'http://localhost:3002';

/**
 * Simple API service that returns your MongoDB data exactly as-is
 * No transformation, no changes, just raw data
 */
class RawBenefitsApi {
    async getBenefits(params: Record<string, string> = {}): Promise<RawBenefit[]> {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value);
            }
        });

        const url = `${BASE_URL}/api/benefits${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

        console.log('🔍 Raw API Request:', { url, params });

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: BenefitsApiResponse = await response.json();

        console.log('📊 Raw API Response:', {
            success: data.success,
            benefitsCount: data.benefits?.length || 0,
            sampleBenefit: data.benefits?.[0]
        });

        // Return your raw benefits exactly as they are
        return data.benefits || [];
    }

    async getBenefitById(id: string): Promise<RawBenefit | null> {
        const response = await fetch(`${BASE_URL}/api/benefits/${id}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.benefit || data;
    }

    async getNearbyBenefits(lat: number, lng: number, params: Record<string, string> = {}): Promise<RawBenefit[]> {
        const queryParams = new URLSearchParams({
            lat: lat.toString(),
            lng: lng.toString(),
            ...params
        });

        const response = await fetch(`${BASE_URL}/api/benefits/nearby?${queryParams.toString()}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: BenefitsApiResponse = await response.json();
        return data.benefits || [];
    }

    async getCategories(): Promise<string[]> {
        const response = await fetch(`${BASE_URL}/api/categories`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.categories || [];
    }

    async getBanks(): Promise<string[]> {
        const response = await fetch(`${BASE_URL}/api/banks`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.banks || [];
    }
}

export const rawBenefitsApi = new RawBenefitsApi();

// Simple functions that return your raw data
export async function getRawBenefits(params: Record<string, string> = {}): Promise<RawBenefit[]> {
    try {
        return await rawBenefitsApi.getBenefits(params);
    } catch (error) {
        console.error('❌ Failed to fetch raw benefits:', error);
        return [];
    }
}

export async function getRawBenefitById(id: string): Promise<RawBenefit | null> {
    try {
        return await rawBenefitsApi.getBenefitById(id);
    } catch (error) {
        console.error('❌ Failed to fetch raw benefit by ID:', error);
        return null;
    }
}

export async function getRawNearbyBenefits(lat: number, lng: number, params: Record<string, string> = {}): Promise<RawBenefit[]> {
    try {
        return await rawBenefitsApi.getNearbyBenefits(lat, lng, params);
    } catch (error) {
        console.error('❌ Failed to fetch nearby raw benefits:', error);
        return [];
    }
}

export async function getRawCategories(): Promise<string[]> {
    try {
        return await rawBenefitsApi.getCategories();
    } catch (error) {
        console.error('❌ Failed to fetch categories:', error);
        return [];
    }
}

export async function getRawBanks(): Promise<string[]> {
    try {
        return await rawBenefitsApi.getBanks();
    } catch (error) {
        console.error('❌ Failed to fetch banks:', error);
        return [];
    }
}