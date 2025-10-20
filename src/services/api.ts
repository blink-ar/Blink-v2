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

const BASE_URL = 'https://benefits-backend-v2-public.onrender.com';

class BenefitsAPI {
  async getBenefits(params: Record<string, string> = {}): Promise<Benefit[]> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = `${BASE_URL}/api/benefits${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    console.log('🔍 MongoDB API Request:', {
      url,
      params,
      timestamp: new Date().toISOString()
    });

    const response = await fetch(url);

    if (!response.ok) {
      console.error('❌ MongoDB API Error:', {
        status: response.status,
        statusText: response.statusText,
        url
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: MongoBenefitsResponse = await response.json();

    console.log('📊 MongoDB API Raw Response:', {
      success: data.success,
      benefitsCount: data.benefits?.length || 0,
      pagination: data.pagination,
      filters: data.filters,
      fullResponse: data
    });

    if (data.benefits && data.benefits.length > 0) {
      console.log('🎯 Sample MongoDB Benefit (exact data.benefits[0]):', data.benefits[0]);
    } else {
      console.warn('⚠️ No benefits found in MongoDB response');
    }

    // Transform raw MongoDB benefits to your preferred Benefit structure
    const rawBenefits = data.benefits || [];
    const transformedBenefits = rawBenefits.map(transformRawBenefitToBenefit);

    console.log('🔄 Transformed benefits:', {
      rawCount: rawBenefits.length,
      transformedCount: transformedBenefits.length,
      sampleTransformed: transformedBenefits[0]
    });

    return transformedBenefits;
  }

  async getRawBenefits(params: Record<string, string> = {}): Promise<RawMongoBenefit[]> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = `${BASE_URL}/api/benefits${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    console.log('🔍 MongoDB API Request (Raw):', {
      url,
      params,
      timestamp: new Date().toISOString()
    });

    const response = await fetch(url);

    if (!response.ok) {
      console.error('❌ MongoDB API Error:', {
        status: response.status,
        statusText: response.statusText,
        url
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: MongoBenefitsResponse = await response.json();

    console.log('📊 MongoDB API Raw Response (keeping original format):', {
      success: data.success,
      benefitsCount: data.benefits?.length || 0,
      pagination: data.pagination,
      filters: data.filters
    });

    // Return raw benefits without transformation
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
    console.log('🔍 fetchBenefits: Called with params (no limit applied):', params);

    // Remove any limit restrictions - fetch all available benefits
    const { ...filteredParams } = params;

    // If no offset specified, start from the beginning
    if (!filteredParams.offset) {
      filteredParams.offset = '0';
      console.log('🎯 fetchBenefits: No offset specified, starting from beginning');
    }

    const benefits = await benefitsAPI.getBenefits(filteredParams);
    console.log('✅ fetchBenefits: Success, returned', benefits.length, 'benefits (no limit)');
    return benefits;
  } catch (error) {
    console.error("❌ fetchBenefits: Failed to fetch benefits:", error);
    console.warn("⚠️ fetchBenefits: Falling back to empty array");
    return [];
  }
}

// Function to get ALL benefits using pagination
export async function fetchAllBenefits(params: Record<string, string> = {}): Promise<Benefit[]> {
  try {
    console.log('🔍 fetchAllBenefits: Starting to fetch ALL benefits using pagination...');

    const allBenefits: Benefit[] = [];
    let offset = 0;
    const limit = 100; // Use larger chunks for efficiency
    let hasMore = true;

    while (hasMore) {
      console.log(`📄 fetchAllBenefits: Fetching page at offset ${offset}...`);

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

      console.log(`📊 fetchAllBenefits: Page complete. Total so far: ${allBenefits.length}`);

      // Safety break to prevent infinite loops
      if (offset > 10000) {
        console.warn('⚠️ fetchAllBenefits: Safety limit reached, stopping at 10,000 benefits');
        break;
      }
    }

    console.log(`🎯 fetchAllBenefits: Complete! Total benefits: ${allBenefits.length}`);
    return allBenefits;
  } catch (error) {
    console.error("❌ fetchAllBenefits: Failed to fetch all benefits:", error);
    console.warn("⚠️ fetchAllBenefits: Falling back to regular fetch");
    return fetchBenefits(params);
  }
}

export async function fetchMongoBenefitsWithPagination(params: Record<string, string> = {}): Promise<MongoBenefitsResponse> {
  try {
    return await benefitsAPI.getBenefitsResponse(params);
  } catch (error) {
    console.warn("Failed to fetch MongoDB benefits response:", error);
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
  } catch (error) {
    console.error("Failed to fetch MongoDB benefit by ID:", error);
    return null;
  }
}

export async function fetchMongoNearbyBenefits(lat: number, lng: number, params: Record<string, string> = {}): Promise<Benefit[]> {
  try {
    return await benefitsAPI.getNearbyBenefits(lat, lng, params);
  } catch (error) {
    console.error("Failed to fetch nearby MongoDB benefits:", error);
    return [];
  }
}

export async function fetchMongoCategories(): Promise<string[]> {
  try {
    return await benefitsAPI.getCategories();
  } catch (error) {
    console.error("Failed to fetch MongoDB categories:", error);
    return [];
  }
}

export async function fetchMongoBanks(): Promise<string[]> {
  try {
    return await benefitsAPI.getBanks();
  } catch (error) {
    console.error("Failed to fetch MongoDB banks:", error);
    return [];
  }
}

export async function fetchMongoStats(): Promise<MongoStatsResponse> {
  try {
    return await benefitsAPI.getStats();
  } catch (error) {
    console.error("Failed to fetch MongoDB stats:", error);
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
    console.log('🚀 fetchBusinesses: Starting to fetch from MongoDB API...', options);

    let benefits: Benefit[];

    if (options.fetchAll) {
      console.log('📚 fetchBusinesses: Fetching ALL benefits using pagination...');
      benefits = await fetchAllBenefits(options.filters || {});
    } else {
      const offset = options.offset || 0;
      const limit = options.limit || 50; // Default limit for pagination
      console.log(`📊 fetchBusinesses: Fetching benefits with offset=${offset}, limit=${limit}...`);

      const params: Record<string, string> = {
        offset: offset.toString(),
        limit: limit.toString(),
        ...options.filters || {}
      };

      benefits = await benefitsAPI.getBenefits(params);
    }

    console.log("📊 fetchBusinesses: Benefits Retrieved:", {
      benefitsCount: benefits.length,
      sampleBenefit: benefits[0],
      allBenefitIds: benefits.map(b => b.id),
      merchantNames: benefits.map(b => b.merchant.name),
      banks: [...new Set(benefits.map(b => b.bank))],
      categories: [...new Set(benefits.flatMap(b => b.categories))]
    });

    if (benefits.length === 0) {
      console.warn("⚠️ fetchBusinesses: No benefits found in MongoDB API response");
      return []; // Return empty array instead of mock data
    }

    // Group benefits by merchant name
    console.log('🔄 fetchBusinesses: Starting transformation to Business format...');
    const businessMap = new Map<string, Business>();

    benefits.forEach((benefit, index) => {
      const businessName = benefit.merchant.name;

      console.log(`🏪 Processing benefit ${index + 1}/${benefits.length}:`, {
        businessName,
        raw: benefit,
        bank: benefit.bank,
        benefitTitle: benefit.benefitTitle,
        discountPercentage: benefit.discountPercentage,
        categories: benefit.categories,
        cardTypes: benefit.cardTypes.map(ct => ct.name)
      });

      if (!businessMap.has(businessName)) {
        console.log(`✨ Creating new business: ${businessName}`);

        // Create a new business from the benefit
        const business: Business = {
          id: businessName.toLowerCase().replace(/\s+/g, '-'), // Use merchant name as ID
          name: businessName,
          category: benefit.categories[0] || 'otros',
          description: benefit.description,
          rating: 5,
          location: benefit.locations[0]?.formattedAddress || 'Multiple locations',
          image: 'https://images.pexels.com/photos/4386158/pexels-photo-4386158.jpeg?auto=compress&cs=tinysrgb&w=400',
          benefits: []
        };

        // Create the bank benefit
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

        console.log(`📝 Created business:`, {
          id: business.id,
          name: business.name,
          category: business.category,
          location: business.location,
          benefitsCount: business.benefits.length
        });
      } else {
        console.log(`➕ Adding benefit to existing business: ${businessName}`);
        // Add additional benefit to existing business
        const business = businessMap.get(businessName)!;
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

        console.log(`📈 Business now has ${business.benefits.length} benefits`);
      }
    });

    const businesses = Array.from(businessMap.values());

    console.log('🎯 fetchBusinesses: Transformation complete:', {
      totalBenefits: benefits.length,
      uniqueBusinesses: businesses.length,
      businessNames: businesses.map(b => b.name),
      totalBenefitsInBusinesses: businesses.reduce((sum, b) => sum + b.benefits.length, 0)
    });

    console.log("🎯 Transformed Businesses from MongoDB:", {
      count: businesses.length,
      sample: businesses[0],
    });

    return businesses;
  } catch (error) {
    console.error("❌ Failed to fetch from MongoDB API:", error);
    return []; // Return empty array instead of mock data
  }
}

// Get a specific benefit by ID
export async function fetchBenefitById(id: string) {
  try {
    return await benefitsAPI.getBenefitById(id);
  } catch (error) {
    console.error("Failed to fetch benefit by ID:", error);
    throw error;
  }
}

// Get nearby benefits based on location
export async function fetchNearbyBenefits(lat: number, lng: number, params: Record<string, string> = {}) {
  try {
    return await benefitsAPI.getNearbyBenefits(lat, lng, params);
  } catch (error) {
    console.error("Failed to fetch nearby benefits:", error);
    throw error;
  }
}

// Get available categories
export async function fetchCategories() {
  try {
    return await benefitsAPI.getCategories();
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

// Get available banks
export async function fetchBanks() {
  try {
    return await benefitsAPI.getBanks();
  } catch (error) {
    console.error("Failed to fetch banks:", error);
    return [];
  }
}

// Get statistics
export async function fetchStats() {
  try {
    return await benefitsAPI.getStats();
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return {};
  }
}



// Convenience functions for common use cases
export async function fetchAllBusinesses(): Promise<Business[]> {
  console.log('🌍 fetchAllBusinesses: Fetching ALL businesses...');
  return fetchBusinesses({ fetchAll: true });
}

export async function fetchBusinessesWithLimit(limit: number, offset?: number): Promise<Business[]> {
  console.log(`📊 fetchBusinessesWithLimit: Fetching up to ${limit} businesses${offset ? ` starting from ${offset}` : ''}...`);
  return fetchBusinesses({ limit, offset });
}

export async function fetchBusinessesFrom1000(): Promise<Business[]> {
  console.log('🎯 fetchBusinessesFrom1000: Fetching benefits starting from #1000 (no limit)...');
  return fetchBusinesses({ offset: 1000 });
}

export async function fetchBusinessesFromStart(): Promise<Business[]> {
  console.log('🏁 fetchBusinessesFromStart: Fetching benefits from the beginning (offset 0, no limit)...');
  return fetchBusinesses({ offset: 0 });
}

export async function fetchBusinessesRange(offset: number, limit: number): Promise<Business[]> {
  console.log(`📊 fetchBusinessesRange: Fetching ${limit} benefits starting from #${offset}...`);
  return fetchBusinesses({ offset, limit });
}

export async function fetchBusinessesByCategory(category: string, limit?: number): Promise<Business[]> {
  console.log(`🏷️ fetchBusinessesByCategory: Fetching businesses in category '${category}' (no default limit)...`);
  return fetchBusinesses({
    filters: { category },
    ...(limit && { limit })
  });
}

export async function fetchBusinessesByBank(bank: string, limit?: number): Promise<Business[]> {
  console.log(`🏦 fetchBusinessesByBank: Fetching businesses for bank '${bank}' (no default limit)...`);
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
    console.log('🚀 getBenefits: Starting to fetch benefits...', options);

    if (options.fetchAll) {
      console.log('📚 getBenefits: Fetching ALL benefits using pagination...');
      return await fetchAllBenefits(options.filters || {});
    } else {
      const offset = options.offset || 0;
      console.log(`📊 getBenefits: Fetching benefits starting from offset ${offset} (no limit)...`);

      const params: Record<string, string> = {
        offset: offset.toString(),
        ...options.filters || {}
      };

      // Only add limit if explicitly specified
      if (options.limit) {
        params.limit = options.limit.toString();
      }

      return await fetchBenefits(params);
    }
  } catch (error) {
    console.warn("Failed to fetch benefits:", error);
    return [];
  }
}

/**
 * Get a specific benefit by ID
 */
export async function getBenefitById(id: string): Promise<Benefit | null> {
  try {
    return await benefitsAPI.getBenefitById(id);
  } catch (error) {
    console.error("Failed to fetch benefit by ID:", error);
    return null;
  }
}

/**
 * Get nearby benefits
 */
export async function getNearbyBenefits(lat: number, lng: number, params: Record<string, string> = {}): Promise<Benefit[]> {
  try {
    return await benefitsAPI.getNearbyBenefits(lat, lng, params);
  } catch (error) {
    console.error("Failed to fetch nearby benefits:", error);
    return [];
  }
}

/**
 * Convenience functions for common use cases
 */
export async function getAllBenefits(): Promise<Benefit[]> {
  console.log('🌍 getAllBenefits: Fetching ALL benefits...');
  return getBenefits({ fetchAll: true });
}

export async function getBenefitsWithLimit(limit: number, offset?: number): Promise<Benefit[]> {
  console.log(`📊 getBenefitsWithLimit: Fetching up to ${limit} benefits${offset ? ` starting from ${offset}` : ''}...`);
  return getBenefits({ limit, offset });
}

export async function getBenefitsFrom1000(): Promise<Benefit[]> {
  console.log('🎯 getBenefitsFrom1000: Fetching benefits starting from #1000 (no limit)...');
  return getBenefits({ offset: 1000 });
}

export async function getBenefitsFromStart(): Promise<Benefit[]> {
  console.log('🏁 getBenefitsFromStart: Fetching benefits from the beginning (offset 0, no limit)...');
  return getBenefits({ offset: 0 });
}

export async function getBenefitsRange(offset: number, limit: number): Promise<Benefit[]> {
  console.log(`📊 getBenefitsRange: Fetching ${limit} benefits starting from #${offset}...`);
  return getBenefits({ offset, limit });
}

export async function getBenefitsByCategory(category: string, limit?: number): Promise<Benefit[]> {
  console.log(`🏷️ getBenefitsByCategory: Fetching benefits in category '${category}' (no default limit)...`);
  return getBenefits({
    filters: { category },
    ...(limit && { limit })
  });
}

export async function getBenefitsByBank(bank: string, limit?: number): Promise<Benefit[]> {
  console.log(`🏦 getBenefitsByBank: Fetching benefits for bank '${bank}' (no default limit)...`);
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
    console.log('🚀 getRawBenefits: Starting to fetch raw benefits...', options);

    if (options.fetchAll) {
      console.log('📚 getRawBenefits: Fetching ALL raw benefits using pagination...');
      return await fetchAllRawBenefits(options.filters || {});
    } else {
      const offset = options.offset || 0;
      console.log(`📊 getRawBenefits: Fetching raw benefits starting from offset ${offset}...`);

      const params: Record<string, string> = {
        offset: offset.toString(),
        ...options.filters || {}
      };

      // Only add limit if explicitly specified
      if (options.limit) {
        params.limit = options.limit.toString();
      }

      return await benefitsAPI.getRawBenefits(params);
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
    console.log('🔍 fetchAllRawBenefits: Starting to fetch ALL raw benefits using pagination...');

    const allBenefits: RawMongoBenefit[] = [];
    let offset = 0;
    const limit = 100; // Use larger chunks for efficiency
    let hasMore = true;

    while (hasMore) {
      console.log(`📄 fetchAllRawBenefits: Fetching page at offset ${offset}...`);

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

      console.log(`📊 fetchAllRawBenefits: Page complete. Total so far: ${allBenefits.length}`);

      // Safety break to prevent infinite loops
      if (offset > 10000) {
        console.warn('⚠️ fetchAllRawBenefits: Safety limit reached, stopping at 10,000 benefits');
        break;
      }
    }

    console.log(`🎯 fetchAllRawBenefits: Complete! Total raw benefits: ${allBenefits.length}`);
    return allBenefits;
  } catch (error) {
    console.error("❌ fetchAllRawBenefits: Failed to fetch all raw benefits:", error);
    return [];
  }
}

/**
 * Convenience functions for raw benefits
 */
export async function getAllRawBenefits(): Promise<RawMongoBenefit[]> {
  console.log('🌍 getAllRawBenefits: Fetching ALL raw benefits...');
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

// Export the benefits API instance for direct use if needed
export { benefitsAPI };

// Function to get ALL benefits efficiently using total count
export async function fetchAllBenefitsEfficient(params: Record<string, string> = {}): Promise<Benefit[]> {
  try {
    console.log('🚀 fetchAllBenefitsEfficient: Starting efficient fetch of ALL benefits...');

    // First, get the total count from stats
    const stats = await fetchMongoStats();
    const totalBenefits = stats.stats?.totalBenefits || 0;

    if (totalBenefits === 0) {
      console.log('📊 No benefits found in stats');
      return [];
    }

    console.log(`📊 Total benefits available: ${totalBenefits}`);

    const allBenefits: Benefit[] = [];
    const limit = 200; // Use larger chunks for better performance
    const totalPages = Math.ceil(totalBenefits / limit);

    console.log(`📄 Will fetch ${totalPages} pages with ${limit} benefits each`);

    // Fetch all pages
    for (let page = 0; page < totalPages; page++) {
      const offset = page * limit;
      console.log(`📄 Fetching page ${page + 1}/${totalPages} (offset: ${offset})...`);

      const pageParams = {
        ...params,
        offset: offset.toString(),
        limit: limit.toString()
      };

      try {
        const pageBenefits = await benefitsAPI.getBenefits(pageParams);
        allBenefits.push(...pageBenefits);

        console.log(`✅ Page ${page + 1} complete: ${pageBenefits.length} benefits (Total: ${allBenefits.length})`);

        // If we got fewer benefits than expected, we've reached the end
        if (pageBenefits.length < limit) {
          console.log('🏁 Reached end of data early');
          break;
        }
      } catch (pageError) {
        console.error(`❌ Error fetching page ${page + 1}:`, pageError);
        // Continue with next page instead of failing completely
        continue;
      }
    }

    console.log(`🎯 fetchAllBenefitsEfficient: Complete! Fetched ${allBenefits.length}/${totalBenefits} benefits`);
    return allBenefits;
  } catch (error) {
    console.error("❌ fetchAllBenefitsEfficient: Failed to fetch all benefits:", error);
    console.warn("⚠️ fetchAllBenefitsEfficient: Falling back to regular pagination method");
    return fetchAllBenefits(params);
  }
}

// Function to get ALL businesses (using all benefits)
export async function fetchAllBusinessesComplete(): Promise<Business[]> {
  console.log('🌍 fetchAllBusinessesComplete: Fetching ALL businesses from ALL benefits...');
  return fetchBusinesses({ fetchAll: true });
}