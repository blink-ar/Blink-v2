import { useMemo } from 'react';
import { Business } from '../types';
import { useGeolocation } from './useGeolocation';
import {
  calculateDistance,
  formatDistance,
  hasOnlineBenefits,
  calculatePriorityScore,
} from '../utils/distance';

/**
 * Enriches businesses with distance and online information
 * Also applies smart sorting based on priority score
 */
export const useEnrichedBusinesses = (
  businesses: Business[],
  options?: {
    sortByPriority?: boolean;
    onlineOnly?: boolean; // Filter to show only online
  }
) => {
  const { position } = useGeolocation();
  const { sortByPriority = true, onlineOnly = false } = options || {};

  const enrichedBusinesses = useMemo(() => {
    let result = businesses.map((business) => {
      // Calculate distance if position is available
      let distance: number | undefined;
      let distanceText: string | undefined;
      let isNearby = false;

      if (position) {
        // Find the closest location for this business
        const distances = business.location
          .filter((loc) => loc.lat !== 0 && loc.lng !== 0) // Exclude invalid coordinates
          .map((loc) =>
            calculateDistance(
              position.latitude,
              position.longitude,
              loc.lat,
              loc.lng
            )
          );

        if (distances.length > 0) {
          distance = Math.min(...distances);
          distanceText = formatDistance(distance);
          isNearby = distance <= 50; // Within 50km
        }
      }

      // Check if has online benefits
      const hasOnline = hasOnlineBenefits(business);

      // Calculate priority score
      const priorityScore = calculatePriorityScore(isNearby, hasOnline);

      return {
        ...business,
        distance,
        distanceText,
        isNearby,
        hasOnline,
        priorityScore,
      };
    });

    // Apply filter if requested
    if (onlineOnly) {
      result = result.filter((b) => b.hasOnline);
    }

    // Sort by priority if requested
    if (sortByPriority) {
      result = result.sort((a, b) => {
        // First by priority score (higher first)
        if (b.priorityScore !== a.priorityScore) {
          return (b.priorityScore || 0) - (a.priorityScore || 0);
        }

        // Then by distance (closer first) if both have distance
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }

        // If only one has distance, prioritize it
        if (a.distance !== undefined) return -1;
        if (b.distance !== undefined) return 1;

        // Otherwise maintain original order
        return 0;
      });
    }

    return result;
  }, [businesses, position, sortByPriority, onlineOnly]);

  return enrichedBusinesses;
};
