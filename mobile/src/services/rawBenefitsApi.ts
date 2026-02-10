import { RawMongoBenefit } from '../types/mongodb';
import { getRawBenefits as getSharedRawBenefits, benefitsAPI } from './api';
import { API_BASE_URL } from '../constants';

export async function getRawBenefits(options: {
  limit?: number;
  offset?: number;
  filters?: Record<string, string>;
} = {}): Promise<RawMongoBenefit[]> {
  return getSharedRawBenefits(options);
}

export async function getRawBenefitById(id: string): Promise<RawMongoBenefit | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/benefits/${id}?collection=confirmed_benefits`);
    if (!response.ok) return null;

    const data = await response.json();
    let rawBenefit = data;
    if (data && typeof data === 'object' && data.benefit) {
      rawBenefit = data.benefit;
    }
    return rawBenefit || null;
  } catch {
    return null;
  }
}

export { benefitsAPI as rawBenefitsAPI };
