import { useMemo } from 'react';
import { Business } from '../types';
import { hasOnlineBenefits } from '../utils/distance';

/**
 * Enriches businesses with online information and applies filters
 * Note: Distance calculation and sorting by proximity are now handled by the backend
 */
export const useEnrichedBusinesses = (
  businesses: Business[],
  options?: {
    onlineOnly?: boolean; // Filter to show only online
  }
) => {
  const { onlineOnly = false } = options || {};

  const enrichedBusinesses = useMemo(() => {
    // Add hasOnline flag to each business
    let result = businesses.map((business) => {
      // Check if has online benefits
      const hasOnline = hasOnlineBenefits(business);

      return {
        ...business,
        hasOnline,
      };
    });

    // Apply online filter if requested
    if (onlineOnly) {
      result = result.filter((b) => b.hasOnline);
    }

    // Backend already sorts by distance, so we preserve that order
    return result;
  }, [businesses, onlineOnly]);

  return enrichedBusinesses;
};
