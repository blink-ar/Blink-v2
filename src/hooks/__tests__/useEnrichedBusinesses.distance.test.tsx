import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Business } from '../../types';
import { useEnrichedBusinesses } from '../useEnrichedBusinesses';
import { useGeolocation } from '../useGeolocation';
vi.mock('../useGeolocation', () => ({ useGeolocation: vi.fn() }));
const business = (extra: Record<string, unknown> = {}) => ({ id: 'district25', name: 'Distrito 25', category: 'gastronomia', description: '', rating: 5, location: [], image: '', benefits: [], ...extra } as unknown as Business);
describe('server and client distance enrichment', () => {
  beforeEach(() => vi.mocked(useGeolocation).mockReturnValue({ position: { latitude: -26.824, longitude: -65.223 }, error: null, loading: false, permissionDenied: false, requestPermission: vi.fn() }));
  it('preserves valid server distance and near state for compact address-only summaries', () => {
    const data = business({ location: [{ formattedAddress: 'Tucumán' }], distance: 1.935, distanceText: '1.9km', isNearby: true });
    const { result } = renderHook(() => useEnrichedBusinesses([data], { sortByDistance: true }));
    expect(result.current[0]).toMatchObject({ distance: 1.935, distanceText: '1.9km', isNearby: true });
  });
  it('does not replace the all-branches server minimum with a distant preview branch', () => {
    const data = business({ distance: 0.25, location: [{ lat: -34.6, lng: -58.4 }] });
    const { result } = renderHook(() => useEnrichedBusinesses([data]));
    expect(result.current[0].distance).toBe(0.25);
  });
  it('ignores invalid branches when computing a missing distance', () => {
    const data = business({ location: [{ lat: null, lng: null }, {}, { lat: 'bad', lng: -65 }, { lat: '-26.834', lng: '-65.223' }] });
    const { result } = renderHook(() => useEnrichedBusinesses([data]));
    expect(result.current[0].distance).toBeCloseTo(1.11195, 4);
    expect(result.current[0].distanceText).toBe('1.1km');
  });
  it.each([null, undefined, NaN, Infinity, -1])('keeps %s unknown when no valid coordinates exist', distance => {
    const data = business({ distance, distanceText: 'NaNkm', isNearby: true, location: [{ lat: null, lng: null }] });
    const { result } = renderHook(() => useEnrichedBusinesses([data]));
    expect(result.current[0]).toMatchObject({ distance: undefined, distanceText: undefined, isNearby: false });
  });
  it('keeps server ordering and genuine zero; an explicit radius excludes unknowns', () => {
    const records = [business({ id: 'zero', distance: 0 }), business({ id: 'near', distance: 1.935 }), business({ id: 'far', distance: 200 }), business({ id: 'unknown' })];
    const { result } = renderHook(() => useEnrichedBusinesses(records, { sortByDistance: true }));
    expect(result.current.map(x => x.id)).toEqual(['zero', 'near', 'far', 'unknown']);
    expect(result.current[0].distanceText).toBe('0m');
    const radius = renderHook(() => useEnrichedBusinesses(records, { maxDistance: 10 }));
    expect(radius.result.current.map(x => x.id)).toEqual(['zero', 'near']);
  });
});
