import { Business, BankBenefit } from '../types';
import {
  Benefit,
  RawMongoBenefit,
  MongoBenefitsResponse,
  MongoCategoriesResponse,
  MongoBanksResponse,
  MongoStatsResponse,
  transformRawBenefitToBenefit,
} from '../types/mongodb';
import type { CanonicalLocation } from '../types';
import { API_BASE_URL } from '../constants';

const COLLECTION = 'confirmed-benefits';

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
  params.append('collection', COLLECTION);
  if (category) params.append('category', category);
  if (bank) params.append('bank', bank);
  if (search) params.append('search', search);
  if (lat !== undefined && lng !== undefined) {
    params.append('lat', lat.toString());
    params.append('lng', lng.toString());
  }

  const url = `${API_BASE_URL}/api/businesses?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (data.success && Array.isArray(data.businesses)) {
      data.businesses = data.businesses.map((b: any) => {
        const rawLocations = b.location || b.locations || [];
        const uniqueLocations: any[] = [];
        const seenAddresses = new Set();

        if (Array.isArray(rawLocations)) {
          for (const loc of rawLocations) {
            const key = loc.formattedAddress || `${loc.lat},${loc.lng}`;
            if (!seenAddresses.has(key)) {
              seenAddresses.add(key);
              uniqueLocations.push(loc);
            }
          }
        }

        const business = { ...b, location: uniqueLocations };
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
      filters: {},
    };
  }
}

class BenefitsAPI {
  async getBenefits(params: Record<string, string> = {}): Promise<Benefit[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('collection', COLLECTION);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = `${API_BASE_URL}/api/benefits?${queryParams.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data: MongoBenefitsResponse = await response.json();
    return (data.benefits || []).map(transformRawBenefitToBenefit);
  }

  async getRawBenefits(params: Record<string, string> = {}): Promise<RawMongoBenefit[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('collection', COLLECTION);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = `${API_BASE_URL}/api/benefits?${queryParams.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data: MongoBenefitsResponse = await response.json();
    return data.benefits || [];
  }

  async getBenefitsResponse(params: Record<string, string> = {}): Promise<MongoBenefitsResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('collection', COLLECTION);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const url = `${API_BASE_URL}/api/benefits?${queryParams.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }

  async getBenefitById(id: string): Promise<Benefit | null> {
    const response = await fetch(`${API_BASE_URL}/api/benefits/${id}?collection=${COLLECTION}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    let rawBenefit = data;
    if (data && typeof data === 'object' && data.benefit) {
      rawBenefit = data.benefit;
    }
    if (!rawBenefit) return null;
    return transformRawBenefitToBenefit(rawBenefit);
  }

  async getNearbyBenefits(lat: number, lng: number, params: Record<string, string> = {}): Promise<Benefit[]> {
    const queryParams = new URLSearchParams({ lat: lat.toString(), lng: lng.toString(), collection: COLLECTION, ...params });
    const response = await fetch(`${API_BASE_URL}/api/benefits/nearby?${queryParams.toString()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data: MongoBenefitsResponse = await response.json();
    return (data.benefits || []).map(transformRawBenefitToBenefit);
  }

  async getCategories(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/categories?collection=${COLLECTION}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data: MongoCategoriesResponse = await response.json();
    return data.categories || [];
  }

  async getBanks(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/banks?collection=${COLLECTION}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data: MongoBanksResponse = await response.json();
    return data.banks || [];
  }

  async getStats(): Promise<MongoStatsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/stats?collection=${COLLECTION}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }
}

export const benefitsAPI = new BenefitsAPI();

export async function fetchBenefits(params: Record<string, string> = {}): Promise<Benefit[]> {
  try {
    const filteredParams = { ...params };
    if (!filteredParams.offset) filteredParams.offset = '0';
    return await benefitsAPI.getBenefits(filteredParams);
  } catch {
    return [];
  }
}

export async function fetchMongoBenefitsWithPagination(params: Record<string, string> = {}): Promise<MongoBenefitsResponse> {
  try {
    return await benefitsAPI.getBenefitsResponse(params);
  } catch {
    return { success: false, benefits: [], pagination: { total: 0, limit: 50, offset: 0, hasMore: false }, filters: {} };
  }
}

export async function fetchMongoBenefitById(id: string): Promise<Benefit | null> {
  try {
    return await benefitsAPI.getBenefitById(id);
  } catch {
    return null;
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
    return { success: false, stats: { totalBenefits: 0, totalMerchants: 0, totalBanks: 0, totalCategories: 0 } };
  }
}

export async function fetchBusinesses(options: {
  limit?: number;
  offset?: number;
  fetchAll?: boolean;
  filters?: Record<string, string>;
} = {}): Promise<Business[]> {
  try {
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    const params: Record<string, string> = {
      offset: offset.toString(),
      limit: limit.toString(),
      ...(options.filters || {}),
    };

    const benefits = await benefitsAPI.getBenefits(params);
    if (benefits.length === 0) return [];

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
          image: '',
          benefits: [],
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
          textoAplicacion: benefit.link || undefined,
        };

        business.benefits.push(bankBenefit);
        businessMap.set(businessName, business);
      } else {
        const business = businessMap.get(businessName)!;
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
          textoAplicacion: benefit.link || undefined,
        };
        business.benefits.push(bankBenefit);
      }
    });

    return Array.from(businessMap.values());
  } catch {
    return [];
  }
}

export async function getRawBenefits(options: {
  limit?: number;
  offset?: number;
  filters?: Record<string, string>;
} = {}): Promise<RawMongoBenefit[]> {
  try {
    const offset = options.offset || 0;
    const params: Record<string, string> = {
      offset: offset.toString(),
      ...(options.filters || {}),
    };
    if (options.limit) params.limit = options.limit.toString();
    return await benefitsAPI.getRawBenefits(params);
  } catch {
    return [];
  }
}
