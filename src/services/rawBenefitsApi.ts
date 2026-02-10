/**
 * Raw Benefits API Service
 *
 * This module provides access to benefits data in the exact format as returned
 * by the MongoDB API (data.benefits) without any transformation.
 *
 * Uses the shared benefitsAPI instance from api.ts to avoid duplicate HTTP logic.
 */

import { RawMongoBenefit, MongoBenefitsResponse } from '../types/mongodb';
import {
  getRawBenefits as getSharedRawBenefits,
  fetchAllRawBenefits as fetchAllSharedRawBenefits,
  fetchMongoBenefitsWithPagination,
  benefitsAPI,
} from './api';

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
  return getSharedRawBenefits(options);
}

/**
 * Get ALL raw benefits using pagination
 */
export async function fetchAllRawBenefits(params: Record<string, string> = {}): Promise<RawMongoBenefit[]> {
  return fetchAllSharedRawBenefits(params);
}

/**
 * Get raw benefits response with pagination info
 */
export async function getRawBenefitsResponse(params: Record<string, string> = {}): Promise<MongoBenefitsResponse> {
  return fetchMongoBenefitsWithPagination(params);
}

/**
 * Get a specific raw benefit by ID
 */
export async function getRawBenefitById(id: string): Promise<RawMongoBenefit | null> {
  try {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003';
    const response = await fetch(`${BASE_URL}/api/benefits/${id}?collection=confirmed_benefits`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Handle structured response - extract benefit object if wrapped
    let rawBenefit = data;
    if (data && typeof data === 'object' && data.benefit) {
      rawBenefit = data.benefit;
    }

    return rawBenefit || null;
  } catch {
    return null;
  }
}

// ===== CONVENIENCE FUNCTIONS =====

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

export async function getRawBenefitsFromStart(): Promise<RawMongoBenefit[]> {
  return getRawBenefits({ offset: 0 });
}

export async function getRawBenefitsRange(offset: number, limit: number): Promise<RawMongoBenefit[]> {
  return getRawBenefits({ offset, limit });
}

// Re-export the shared API instance for direct use if needed
export { benefitsAPI as rawBenefitsAPI };
