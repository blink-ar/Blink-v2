export function parseCoordinates(latitude: unknown, longitude: unknown): { lat: number; lng: number } | null;
export function normalizeDistanceKm(value: unknown): number | null;
export function calculateDistanceKm(lat1: unknown, lng1: unknown, lat2: unknown, lng2: unknown): number | null;
