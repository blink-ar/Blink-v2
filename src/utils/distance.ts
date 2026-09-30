import { calculateDistanceKm, normalizeDistanceKm } from '../../shared/coordinates.js';

/**
 * Calculate distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  return calculateDistanceKm(lat1, lon1, lat2, lon2) ?? Number.NaN;
};

/**
 * Format distance for display
 * @param km Distance in kilometers
 * @returns Formatted distance string
 */
export const formatDistance = (value: unknown): string => {
  const km = normalizeDistanceKm(value);
  if (km === null) return '';
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  if (km < 10) {
    return `${km.toFixed(1)}km`;
  }
  return `${Math.round(km)}km`;
};

/**
 * Check if a business has online benefits
 * @param business Business to check
 * @returns True if business has at least one online benefit
 */
export const hasOnlineBenefits = (business: { benefits: { usos?: string[] }[] }): boolean => {
  return business.benefits.some(
    (benefit) => benefit.usos?.includes('online')
  );
};

/**
 * Calculate priority score for sorting
 * - Nearby OR Online (or both) = 2 points
 * - Neither = 1 point
 * @param isNearby Is the business within 50km
 * @param isOnline Does the business have online benefits
 * @returns Priority score
 */
export const calculatePriorityScore = (
  isNearby: boolean,
  isOnline: boolean
): number => {
  if (isNearby || isOnline) return 2;
  return 1;
};
