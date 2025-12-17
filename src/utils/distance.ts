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
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Format distance for display
 * @param km Distance in kilometers
 * @returns Formatted distance string
 */
export const formatDistance = (km: number): string => {
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
 * - Nearby + Online = 3 points
 * - Nearby OR Online = 2 points
 * - Neither = 1 point
 * @param isNearby Is the business within 50km
 * @param isOnline Does the business have online benefits
 * @returns Priority score
 */
export const calculatePriorityScore = (
  isNearby: boolean,
  isOnline: boolean
): number => {
  if (isNearby && isOnline) return 3;
  if (isNearby || isOnline) return 2;
  return 1;
};
