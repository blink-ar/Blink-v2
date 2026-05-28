import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getGoogleMapsMock } = vi.hoisted(() => ({
  getGoogleMapsMock: vi.fn(),
}));

vi.mock('../googleMapsLoader', () => ({
  getGoogleMaps: getGoogleMapsMock,
}));

describe('googlePlacesService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => '',
      }),
    );
    getGoogleMapsMock.mockReset();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('does not load the browser Google Maps fallback by default', async () => {
    const { googlePlacesService } = await import('../googlePlacesService');

    const result = await googlePlacesService.getPlaceDetails('place-123');

    expect(result).toBeNull();
    expect(getGoogleMapsMock).not.toHaveBeenCalled();
  });
});
