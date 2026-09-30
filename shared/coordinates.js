// Shared browser/server validation: missing values must never become (0, 0).
function parseCoordinate(value, limit) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}

export function parseCoordinates(latitude, longitude) {
  const lat = parseCoordinate(latitude, 90);
  const lng = parseCoordinate(longitude, 180);
  return lat === null || lng === null ? null : { lat, lng };
}

export function normalizeDistanceKm(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

export function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  const first = parseCoordinates(lat1, lng1);
  const second = parseCoordinates(lat2, lng2);
  if (!first || !second) return null;
  const toRad = (value) => value * Math.PI / 180;
  const a = Math.sin(toRad(second.lat - first.lat) / 2) ** 2
    + Math.cos(toRad(first.lat)) * Math.cos(toRad(second.lat))
    * Math.sin(toRad(second.lng - first.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
}
