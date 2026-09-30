import { describe, expect, it } from 'vitest';
import { calculateDistanceKm, normalizeDistanceKm, parseCoordinates } from '../../../shared/coordinates.js';
import { formatDistance } from '../distance';

describe('distance coordinate contract', () => {
  it.each([null, undefined, '', ' ', 'bad', '12km', NaN, Infinity, -Infinity, true, {}, []])('rejects missing or invalid coordinate %s', value => {
    expect(parseCoordinates(value, -65.22)).toBeNull();
    expect(parseCoordinates(-26.82, value)).toBeNull();
    expect(calculateDistanceKm(-26.82, -65.22, value, -65.22)).toBeNull();
  });
  it('accepts finite numeric strings, valid zeroes and coordinate boundaries', () => {
    expect(parseCoordinates(' -26.824 ', '-65.223')).toEqual({ lat: -26.824, lng: -65.223 });
    expect(parseCoordinates(0, 0)).toEqual({ lat: 0, lng: 0 });
    expect(parseCoordinates(90, 180)).toEqual({ lat: 90, lng: 180 });
    expect(parseCoordinates(90.001, 0)).toBeNull();
    expect(parseCoordinates(0, -180.001)).toBeNull();
  });
  it('calculates a genuine zero, a Tucumán distance and finite antipodal distance', () => {
    expect(calculateDistanceKm(-26.824, -65.223, -26.824, -65.223)).toBe(0);
    expect(calculateDistanceKm(-26.824, -65.223, -26.834, -65.223)).toBeCloseTo(1.11195, 4);
    expect(calculateDistanceKm(0, 0, 0, 180)).toBeCloseTo(20015.0868, 3);
  });
  it.each([null, undefined, NaN, Infinity, -Infinity, -1, '2', 'NaNkm'])('never formats unknown distance %s', value => {
    expect(normalizeDistanceKm(value)).toBeNull();
    expect(formatDistance(value)).toBe('');
  });
  it('preserves real zero and ordinary meter/km labels', () => {
    expect(formatDistance(0)).toBe('0m');
    expect(formatDistance(0.25)).toBe('250m');
    expect(formatDistance(1.935)).toBe('1.9km');
  });
});
