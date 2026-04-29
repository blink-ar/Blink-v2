import { Business, BankBenefit, SearchApiResponse } from '../types';
import {
  Benefit,
  RawMongoBenefit,
  MongoBenefitsResponse,
  MongoCategoriesResponse,
  MongoBanksResponse,
  MongoStatsResponse,
  transformRawBenefitToBenefit,
} from '../types/mongodb';
import { API_BASE_URL } from '../constants';

const COLLECTION = 'confirmed_benefits';
const SUBSCRIPTIONS_COLLECTION = 'bank_subscriptions';

export interface BusinessesApiResponse {
  success: boolean;
  businesses: Business[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
  filters: { merchantId?: string; category?: string; bank?: string; search?: string };
}

export interface BankSubscription {
  id: string;
  bank: string;
  name: string;
  icon?: string;
}

function normalizeBusinesses(businesses: any[]): Business[] {
  return businesses.map((raw) => {
    const rawLocations = raw.location || raw.locations || [];
    const uniqueLocations: any[] = [];
    const seenAddresses = new Set<string>();
    if (Array.isArray(rawLocations)) {
      for (const loc of rawLocations) {
        const key = loc.formattedAddress || `${loc.lat},${loc.lng}`;
        if (!seenAddresses.has(key)) { seenAddresses.add(key); uniqueLocations.push(loc); }
      }
    }
    const benefits = Array.isArray(raw.benefits)
      ? raw.benefits.map((b: any) => ({ ...b, cardTypes: Array.isArray(b.cardTypes) ? [...new Set(b.cardTypes)] : b.cardTypes }))
      : raw.benefits;
    const business: any = { ...raw, benefits, location: uniqueLocations };
    if ('locations' in business) delete business.locations;
    return business as Business;
  });
}

function mapSearchResponseToBusinessesResponse(
  searchData: SearchApiResponse,
  options: { limit: number; offset: number; category?: string; bank?: string; search?: string }
): BusinessesApiResponse {
  return {
    success: searchData.success,
    businesses: normalizeBusinesses((searchData.merchants || []).map((m) => m.business)),
    pagination: { total: searchData.pagination.totalMerchants, limit: options.limit, offset: options.offset, hasMore: searchData.pagination.hasMore },
    filters: { ...(options.category && { category: options.category }), ...(options.bank && { bank: options.bank }), ...(options.search && { search: options.search }) },
  };
}

export async function fetchSearch(options: {
  q: string; limit?: number; offset?: number; category?: string; bank?: string; lat?: number; lng?: number;
}): Promise<SearchApiResponse> {
  const params = new URLSearchParams();
  params.append('q', options.q);
  params.append('limit', String(options.limit ?? 20));
  params.append('offset', String(options.offset ?? 0));
  params.append('collection', COLLECTION);
  if (options.category) params.append('category', options.category);
  if (options.bank) params.append('bank', options.bank);
  if (options.lat !== undefined && options.lng !== undefined) {
    params.append('lat', String(options.lat));
    params.append('lng', String(options.lng));
  }
  const response = await fetch(`${API_BASE_URL}/api/search?${params.toString()}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
}

export async function fetchBusinessesPaginated(options: {
  limit?: number; offset?: number; merchantId?: string; category?: string; bank?: string;
  search?: string; subscription?: string; geohash?: string; lat?: number; lng?: number; online?: boolean;
} = {}): Promise<BusinessesApiResponse> {
  const { limit = 20, offset = 0, merchantId, category, bank, search, subscription, geohash, lat, lng, online } = options;
  const normalizedMerchantId = merchantId?.trim();

  if (!normalizedMerchantId && search && search.trim()) {
    try {
      const searchData = await fetchSearch({ q: search.trim(), limit, offset, category, bank, lat, lng });
      return mapSearchResponseToBusinessesResponse(searchData, { limit, offset, category, bank, search });
    } catch (error) {
      console.error('[API] fetchSearch failed, falling back:', error);
    }
  }

  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());
  params.append('collection', COLLECTION);
  if (normalizedMerchantId) params.append('merchantId', normalizedMerchantId);
  if (category) params.append('category', category);
  if (bank) params.append('bank', bank);
  if (search) params.append('search', search);
  if (subscription) params.append('subscription', subscription);
  if (online) params.append('online', 'true');
  if (lat !== undefined && lng !== undefined) {
    params.append('lat', lat.toString());
    params.append('lng', lng.toString());
  } else if (geohash) {
    params.append('geohash', geohash);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/businesses?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (data.success && Array.isArray(data.businesses)) data.businesses = normalizeBusinesses(data.businesses);
    return data;
  } catch (error) {
    console.error('[API] fetchBusinessesPaginated failed:', error);
    return { success: false, businesses: [], pagination: { total: 0, limit, offset, hasMore: false }, filters: {} };
  }
}

export async function fetchBusinessById(merchantId: string): Promise<Business | null> {
  const normalizedMerchantId = merchantId.trim();
  if (!normalizedMerchantId) return null;
  const response = await fetchBusinessesPaginated({ merchantId: normalizedMerchantId, limit: 1, offset: 0 });
  if (!response.success) throw new Error(`Failed to fetch business ${normalizedMerchantId}`);
  return response.businesses[0] || null;
}

export async function fetchBankSubscriptions(): Promise<BankSubscription[]> {
  try {
    const url = `${API_BASE_URL}/api/benefits?collection=${SUBSCRIPTIONS_COLLECTION}&limit=1000`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return (data.benefits || []).map((raw: any) => ({
      id: raw._id?.$oid || raw._id || raw.id,
      bank: raw.bank,
      name: raw.name,
      icon: raw.icon,
    }));
  } catch (error) {
    console.error('[API] fetchBankSubscriptions failed:', error);
    return [];
  }
}

class BenefitsAPI {
  async getRawBenefits(params: Record<string, string> = {}): Promise<RawMongoBenefit[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('collection', COLLECTION);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') queryParams.append(key, value);
    });
    const response = await fetch(`${API_BASE_URL}/api/benefits?${queryParams.toString()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data: MongoBenefitsResponse = await response.json();
    return data.benefits || [];
  }

  async getStats(): Promise<MongoStatsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/stats?collection=${COLLECTION}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }

  async getBanks(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/banks?collection=${COLLECTION}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data: MongoBanksResponse = await response.json();
    return data.banks || [];
  }
}

export const benefitsAPI = new BenefitsAPI();

export async function fetchMongoStats(): Promise<MongoStatsResponse> {
  try { return await benefitsAPI.getStats(); }
  catch { return { success: false, stats: { totalBenefits: 0, totalMerchants: 0, totalBanks: 0, totalCategories: 0 } }; }
}

export async function fetchBanks(): Promise<string[]> {
  try { return await benefitsAPI.getBanks(); }
  catch { return []; }
}

export async function getRawBenefits(options: { limit?: number; offset?: number; filters?: Record<string, string> } = {}): Promise<RawMongoBenefit[]> {
  try {
    const params: Record<string, string> = { offset: String(options.offset || 0), ...(options.filters || {}) };
    if (options.limit) params.limit = options.limit.toString();
    return await benefitsAPI.getRawBenefits(params);
  } catch { return []; }
}
