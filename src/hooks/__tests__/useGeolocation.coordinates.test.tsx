import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGeolocation } from '../useGeolocation';
describe('cached geolocation coordinates', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.mocked(localStorage.getItem).mockImplementation(key => values.get(key) ?? null);
    vi.mocked(localStorage.setItem).mockImplementation((key, value) => { values.set(key, value); });
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: vi.fn() } });
    Object.defineProperty(navigator, 'permissions', { configurable: true, value: { query: vi.fn().mockResolvedValue({ state: 'prompt' }) } });
    localStorage.setItem('userPositionTimestamp', String(Date.now()));
  });
  it.each(['bad JSON', JSON.stringify({ latitude: null, longitude: null }), JSON.stringify({ latitude: 91, longitude: 181 }), JSON.stringify({ latitude: 'NaN', longitude: 0 })])('does not use a poisoned cache %s for near ordering', async value => {
    localStorage.setItem('userPosition', value);
    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.position).toBeNull();
    expect(navigator.geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });
  it('retains genuine zero coordinates', async () => {
    localStorage.setItem('userPosition', JSON.stringify({ latitude: 0, longitude: 0 }));
    const { result } = renderHook(() => useGeolocation());
    await waitFor(() => expect(result.current.position).toEqual({ latitude: 0, longitude: 0 }));
  });
});
