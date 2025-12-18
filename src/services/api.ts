// Removed mockBusinesses import - using only real MongoDB data
import { Business, BankBenefit } from "../types";
import {
  Benefit,
  RawMongoBenefit,
  MongoBenefitsResponse,
  MongoCategoriesResponse,
  MongoBanksResponse,
  MongoStatsResponse,
  transformRawBenefitToBenefit
} from '../types/mongodb';

declare global {
  // Extend the globalThis type to include allCategories
  let allCategories: Set<string> | undefined;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://benefits-backend-v2-public.onrender.com';

// Response type for the new /api/businesses endpoint
export interface BusinessesApiResponse {
  success: boolean;
  businesses: Business[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  filters: {
    category?: string;
    bank?: string;
    search?: string;
  };
}

/**
 * Fetch businesses from the new /api/businesses endpoint
 * This endpoint returns pre-grouped businesses with proper pagination
 */
export async function fetchBusinessesPaginated(options: {
  limit?: number;
  offset?: number;
  category?: string;
  bank?: string;
  search?: string;
  lat?: number;
  lng?: number;
} = {}): Promise<BusinessesApiResponse> {
  const { limit = 20, offset = 0, category, bank, search, lat, lng } = options;

  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());
  if (category) params.append('category', category);
  if (bank) params.append('bank', bank);
  if (search) params.append('search', search);
  if (lat !== undefined && lng !== undefined) {
    params.append('lat', lat.toString());
    params.append('lng', lng.toString());
  }

  const url = `${BASE_URL}/api/businesses?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (data.success && Array.isArray(data.businesses)) {
      console.log(`[API] fetchBusinessesPaginated successful: returned ${data.businesses.length} items (limit: ${limit}, offset: ${offset})`);
    } else {
      console.log(`[API] fetchBusinessesPaginated result: ${data.success ? 'success' : 'failed'}, businesses array: ${Array.isArray(data.businesses)}`);
    }

    // Transform API data to match Business interface (mapping locations -> location)
    if (data.success && Array.isArray(data.businesses)) {
      data.businesses = data.businesses.map((b: any) => {
        // Create a new object with location property
        const rawLocations = b.location || b.locations || [];

        // Deduplicate locations by formattedAddress
        const uniqueLocations: any[] = [];
        const seenAddresses = new Set();

        if (Array.isArray(rawLocations)) {
          for (const loc of rawLocations) {
            // Create a unique key for the location (prefer formattedAddress, fallback to lat/lng)
            const key = loc.formattedAddress || `${loc.lat},${loc.lng}`;

            if (!seenAddresses.has(key)) {
              seenAddresses.add(key);
              uniqueLocations.push(loc);
            }
          }
        }

        const business = {
          ...b,
          // Ensure location property exists and is deduplicated
          location: uniqueLocations
        };

        // Explicitly remove locations property if it exists
        if ('locations' in business) {
          delete business.locations;
        }

        return business;
      });
    }

    return data;
  } catch (error) {
    console.error('[API] fetchBusinessesPaginated failed:', error);
    return {
      success: false,
      businesses: [],
      pagination: { total: 0, limit, offset, hasMore: false },
      filters: {}
    };
  }
}

class BenefitsAPI {
  async getBenefits(params: Record<string, string> = {}): Promise<Benefit[]> {
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

    const data: MongoBenefitsResponse = await response.json();
    const rawBenefits = data.benefits || [];
    return rawBenefits.map(transformRawBenefitToBenefit);
  }

  async getRawBenefits(params: Record<string, string> = {}): Promise<RawMongoBenefit[]> {
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

    const data: MongoBenefitsResponse = await response.json();
    return data.benefits || [];
  }

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

  async getBenefitById(id: string): Promise<Benefit | null> {
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

    if (!rawBenefit) return null;

    // Transform to your preferred Benefit structure
    return transformRawBenefitToBenefit(rawBenefit);
  }

  async getNearbyBenefits(lat: number, lng: number, params: Record<string, string> = {}): Promise<Benefit[]> {
    const queryParams = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      ...params
    });

    const response = await fetch(`${BASE_URL}/api/benefits/nearby?${queryParams.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: MongoBenefitsResponse = await response.json();

    // Transform raw MongoDB benefits to your preferred Benefit structure
    const rawBenefits = data.benefits || [];
    return rawBenefits.map(transformRawBenefitToBenefit);
  }

  async getCategories(): Promise<string[]> {
    const response = await fetch(`${BASE_URL}/api/categories`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: MongoCategoriesResponse = await response.json();
    return data.categories || [];
  }

  async getBanks(): Promise<string[]> {
    const response = await fetch(`${BASE_URL}/api/banks`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: MongoBanksResponse = await response.json();
    return data.banks || [];
  }

  async getStats(): Promise<MongoStatsResponse> {
    const response = await fetch(`${BASE_URL}/api/stats`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
}

const benefitsAPI = new BenefitsAPI();

// New MongoDB-native functions
export async function fetchBenefits(params: Record<string, string> = {}): Promise<Benefit[]> {
  try {
    const filteredParams = { ...params };
    if (!filteredParams.offset) {
      filteredParams.offset = '0';
    }
    return await benefitsAPI.getBenefits(filteredParams);
  } catch (error) {
    console.error('[API] fetchBenefits failed:', error);
    return [];
  }
}

// Function to get ALL benefits using pagination
export async function fetchAllBenefits(params: Record<string, string> = {}): Promise<Benefit[]> {
  try {
    const allBenefits: Benefit[] = [];
    let offset = 0;
    const limit = 500; // Increased from 100 to reduce number of API calls
    let hasMore = true;

    while (hasMore) {
      const pageParams = {
        ...params,
        offset: offset.toString(),
        limit: limit.toString()
      };

      const pageBenefits = await benefitsAPI.getBenefits(pageParams);

      if (pageBenefits.length === 0 || pageBenefits.length < limit) {
        hasMore = false;
      }

      allBenefits.push(...pageBenefits);
      offset += pageBenefits.length;

      // Safety break to prevent infinite loops
      if (offset > 10000) {
        break;
      }
    }

    return allBenefits;
  } catch {
    return fetchBenefits(params);
  }
}

export async function fetchMongoBenefitsWithPagination(params: Record<string, string> = {}): Promise<MongoBenefitsResponse> {
  try {
    return await benefitsAPI.getBenefitsResponse(params);
  } catch {
    return {
      success: false,
      benefits: [],
      pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
      filters: {}
    };
  }
}

export async function fetchMongoBenefitById(id: string): Promise<Benefit | null> {
  try {
    return await benefitsAPI.getBenefitById(id);
  } catch {
    return null;
  }
}

export async function fetchMongoNearbyBenefits(lat: number, lng: number, params: Record<string, string> = {}): Promise<Benefit[]> {
  try {
    return await benefitsAPI.getNearbyBenefits(lat, lng, params);
  } catch {
    return [];
  }
}

export async function fetchMongoCategories(): Promise<string[]> {
  try {
    return await benefitsAPI.getCategories();
  } catch {
    return [];
  }
}

export async function fetchMongoBanks(): Promise<string[]> {
  try {
    return await benefitsAPI.getBanks();
  } catch {
    return [];
  }
}

export async function fetchMongoStats(): Promise<MongoStatsResponse> {
  try {
    return await benefitsAPI.getStats();
  } catch {
    return {
      success: false,
      stats: {
        totalBenefits: 0,
        totalMerchants: 0,
        totalBanks: 0,
        totalCategories: 0
      }
    };
  }
}

// Legacy function - converts your new Benefit type to old Business format for backward compatibility
export async function fetchBusinesses(options: {
  limit?: number;
  offset?: number;
  fetchAll?: boolean;
  filters?: Record<string, string>
} = {}): Promise<Business[]> {
  try {
    let benefits: Benefit[];

    if (options.fetchAll) {
      benefits = await fetchAllBenefits(options.filters || {});
    } else {
      const offset = options.offset || 0;
      const limit = options.limit || 50;

      const params: Record<string, string> = {
        offset: offset.toString(),
        limit: limit.toString(),
        ...options.filters || {}
      };

      benefits = await benefitsAPI.getBenefits(params);
    }

    if (benefits.length === 0) {
      return [];
    }

    // Group benefits by merchant name
    const businessMap = new Map<string, Business>();

    benefits.forEach((benefit) => {
      const businessName = benefit.merchant.name;

      if (!businessMap.has(businessName)) {
        const business: Business = {
          id: businessName.toLowerCase().replace(/\s+/g, '-'),
          name: businessName,
          category: benefit.categories[0] || 'otros',
          description: benefit.description,
          rating: 5,
          location: [...benefit.locations],
          image: 'https://images.pexels.com/photos/4386158/pexels-photo-4386158.jpeg?auto=compress&cs=tinysrgb&w=400',
          benefits: []
        };

        const bankBenefit: BankBenefit = {
          bankName: benefit.bank,
          cardName: benefit.cardTypes[0]?.name || 'Credit Card',
          benefit: benefit.benefitTitle,
          rewardRate: `${benefit.discountPercentage || 0}%`,
          color: 'bg-blue-500',
          icon: 'CreditCard',
          tipo: 'descuento',
          cuando: benefit.availableDays.join(', '),
          valor: `${benefit.discountPercentage || 0}%`,
          condicion: benefit.termsAndConditions || undefined,
          requisitos: [benefit.cardTypes[0]?.name || 'Tarjeta de crédito'],
          usos: benefit.online ? ['online', 'presencial'] : ['presencial'],
          textoAplicacion: benefit.link || undefined
        };

        business.benefits.push(bankBenefit);
        businessMap.set(businessName, business);
      } else {
        const business = businessMap.get(businessName)!;

        // Merge locations from this benefit into business locations
        const existingAddresses = new Set(business.location.map(loc => loc.formattedAddress));
        const newLocations = benefit.locations.filter(loc =>
          loc.formattedAddress && !existingAddresses.has(loc.formattedAddress)
        );
        business.location.push(...newLocations);

        const bankBenefit: BankBenefit = {
          bankName: benefit.bank,
          cardName: benefit.cardTypes[0]?.name || 'Credit Card',
          benefit: benefit.benefitTitle,
          rewardRate: `${benefit.discountPercentage || 0}%`,
          color: 'bg-blue-500',
          icon: 'CreditCard',
          tipo: 'descuento',
          cuando: benefit.availableDays.join(', '),
          valor: `${benefit.discountPercentage || 0}%`,
          condicion: benefit.termsAndConditions || undefined,
          requisitos: [benefit.cardTypes[0]?.name || 'Tarjeta de crédito'],
          usos: benefit.online ? ['online', 'presencial'] : ['presencial'],
          textoAplicacion: benefit.link || undefined
        };
        business.benefits.push(bankBenefit);
      }
    });

    return Array.from(businessMap.values());
  } catch (error) {
    console.error('[API] fetchBusinesses failed:', error);
    return [];
  }
}

// Get a specific benefit by ID
export async function fetchBenefitById(id: string) {
  return await benefitsAPI.getBenefitById(id);
}

// Get nearby benefits based on location
export async function fetchNearbyBenefits(lat: number, lng: number, params: Record<string, string> = {}) {
  return await benefitsAPI.getNearbyBenefits(lat, lng, params);
}

// Get available categories
export async function fetchCategories() {
  try {
    return await benefitsAPI.getCategories();
  } catch {
    return [];
  }
}

// Get available banks
export async function fetchBanks() {
  try {
    return await benefitsAPI.getBanks();
  } catch {
    return [];
  }
}

// Get statistics
export async function fetchStats() {
  try {
    return await benefitsAPI.getStats();
  } catch {
    return {};
  }
}



// Convenience functions for common use cases
export async function fetchAllBusinesses(): Promise<Business[]> {
  return fetchBusinesses({ fetchAll: true });
}

export async function fetchBusinessesWithLimit(limit: number, offset?: number): Promise<Business[]> {
  return fetchBusinesses({ limit, offset });
}

export async function fetchBusinessesFrom1000(): Promise<Business[]> {
  return fetchBusinesses({ offset: 1000 });
}

export async function fetchBusinessesFromStart(): Promise<Business[]> {
  return fetchBusinesses({ offset: 0 });
}

export async function fetchBusinessesRange(offset: number, limit: number): Promise<Business[]> {
  return fetchBusinesses({ offset, limit });
}

export async function fetchBusinessesByCategory(category: string, limit?: number): Promise<Business[]> {
  return fetchBusinesses({
    filters: { category },
    ...(limit && { limit })
  });
}

export async function fetchBusinessesByBank(bank: string, limit?: number): Promise<Business[]> {
  return fetchBusinesses({
    filters: { bank },
    ...(limit && { limit })
  });
}

// ===== NEW MAIN API FUNCTIONS (using your preferred Benefit type) =====

/**
 * Main function to get benefits in your preferred format
 * This is the recommended function to use going forward
 */
export async function getBenefits(options: {
  limit?: number;
  offset?: number;
  fetchAll?: boolean;
  filters?: Record<string, string>;
} = {}): Promise<Benefit[]> {
  try {
    if (options.fetchAll) {
      return await fetchAllBenefits(options.filters || {});
    } else {
      const offset = options.offset || 0;
      const params: Record<string, string> = {
        offset: offset.toString(),
        ...options.filters || {}
      };

      if (options.limit) {
        params.limit = options.limit.toString();
      }

      return await fetchBenefits(params);
    }
  } catch {
    return [];
  }
}

/**
 * Get a specific benefit by ID
 */
export async function getBenefitById(id: string): Promise<Benefit | null> {
  try {
    return await benefitsAPI.getBenefitById(id);
  } catch {
    return null;
  }
}

/**
 * Get nearby benefits
 */
export async function getNearbyBenefits(lat: number, lng: number, params: Record<string, string> = {}): Promise<Benefit[]> {
  try {
    return await benefitsAPI.getNearbyBenefits(lat, lng, params);
  } catch {
    return [];
  }
}

/**
 * Convenience functions for common use cases
 */
export async function getAllBenefits(): Promise<Benefit[]> {
  return getBenefits({ fetchAll: true });
}

export async function getBenefitsWithLimit(limit: number, offset?: number): Promise<Benefit[]> {
  return getBenefits({ limit, offset });
}

export async function getBenefitsFrom1000(): Promise<Benefit[]> {
  return getBenefits({ offset: 1000 });
}

export async function getBenefitsFromStart(): Promise<Benefit[]> {
  return getBenefits({ offset: 0 });
}

export async function getBenefitsRange(offset: number, limit: number): Promise<Benefit[]> {
  return getBenefits({ offset, limit });
}

export async function getBenefitsByCategory(category: string, limit?: number): Promise<Benefit[]> {
  return getBenefits({
    filters: { category },
    ...(limit && { limit })
  });
}

export async function getBenefitsByBank(bank: string, limit?: number): Promise<Benefit[]> {
  return getBenefits({
    filters: { bank },
    ...(limit && { limit })
  });
}

// ===== RAW BENEFITS FUNCTIONS (keeping exact API format) =====

/**
 * Get raw benefits in the exact format as data.benefits from the API
 * No transformation applied - returns MongoDB format directly
 */
export async function getRawBenefits(options: {
  limit?: number;
  offset?: number;
  fetchAll?: boolean;
  filters?: Record<string, string>;
} = {}): Promise<RawMongoBenefit[]> {
  try {
    if (options.fetchAll) {
      return await fetchAllRawBenefits(options.filters || {});
    } else {
      const offset = options.offset || 0;
      const params: Record<string, string> = {
        offset: offset.toString(),
        ...options.filters || {}
      };

      if (options.limit) {
        params.limit = options.limit.toString();
      }

      return await benefitsAPI.getRawBenefits(params);
    }
  } catch {
    return [];
  }
}

/**
 * Get ALL raw benefits using pagination
 */
export async function fetchAllRawBenefits(params: Record<string, string> = {}): Promise<RawMongoBenefit[]> {
  try {
    const allBenefits: RawMongoBenefit[] = [];
    let offset = 0;
    const limit = 500; // Increased from 100 to reduce number of API calls
    let hasMore = true;

    while (hasMore) {
      const pageParams = {
        ...params,
        offset: offset.toString(),
        limit: limit.toString()
      };

      const pageBenefits = await benefitsAPI.getRawBenefits(pageParams);

      if (pageBenefits.length === 0 || pageBenefits.length < limit) {
        hasMore = false;
      }

      allBenefits.push(...pageBenefits);
      offset += pageBenefits.length;

      if (offset > 10000) {
        break;
      }
    }

    return allBenefits;
  } catch {
    return [];
  }
}

/**
 * Convenience functions for raw benefits
 */
export async function getAllRawBenefits(): Promise<RawMongoBenefit[]> {
  return getRawBenefits({ fetchAll: true });
}

export async function getRawBenefitsWithLimit(limit: number, offset?: number): Promise<RawMongoBenefit[]> {
  return getRawBenefits({ limit, offset });
}

export async function getRawBenefitsByCategory(category: string, limit?: number): Promise<RawMongoBenefit[]> {
  return getRawBenefits({
    filters: { category },
    ...(limit && { limit })
  });
}

export async function getRawBenefitsByBank(bank: string, limit?: number): Promise<RawMongoBenefit[]> {
  return getRawBenefits({
    filters: { bank },
    ...(limit && { limit })
  });
}

// Export the benefits API instance for direct use if needed
export { benefitsAPI };

// Function to get ALL benefits efficiently using total count
export async function fetchAllBenefitsEfficient(params: Record<string, string> = {}): Promise<Benefit[]> {
  try {
    const stats = await fetchMongoStats();
    const totalBenefits = stats.stats?.totalBenefits || 0;

    if (totalBenefits === 0) {
      return [];
    }

    const allBenefits: Benefit[] = [];
    const limit = 200;
    const totalPages = Math.ceil(totalBenefits / limit);

    for (let page = 0; page < totalPages; page++) {
      const offset = page * limit;
      const pageParams = {
        ...params,
        offset: offset.toString(),
        limit: limit.toString()
      };

      try {
        const pageBenefits = await benefitsAPI.getBenefits(pageParams);
        allBenefits.push(...pageBenefits);

        if (pageBenefits.length < limit) {
          break;
        }
      } catch {
        continue;
      }
    }

    return allBenefits;
  } catch {
    return fetchAllBenefits(params);
  }
}

// Function to get ALL businesses (using all benefits)
export async function fetchAllBusinessesComplete(): Promise<Business[]> {
  return fetchBusinesses({ fetchAll: true });
}