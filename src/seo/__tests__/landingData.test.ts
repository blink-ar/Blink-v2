import { describe, expect, it } from 'vitest';
import { Business } from '../../types';
import { businessMatchesCity, resolveCity } from '../landingData';

const baseBusiness: Business = {
  id: 'merchant_1',
  name: 'Restaurant CABA',
  category: 'gastronomia',
  description: '',
  rating: 5,
  image: '',
  benefits: [],
  location: [
    {
      lat: -34.6037,
      lng: -58.3816,
      formattedAddress: 'El Salvador, Cdad. Autónoma de Buenos Aires, Argentina',
      source: 'address',
      provider: 'google',
      confidence: 0.8,
      updatedAt: '2026-05-13T00:00:00.000Z',
      raw: '{"address_components":[{"short_name":"CABA","types":["locality","political"]}]}',
    },
  ],
};

describe('landingData city matching', () => {
  it('matches CABA locations with abbreviated provider text', () => {
    const caba = resolveCity('caba');

    expect(caba).not.toBeNull();
    expect(businessMatchesCity(baseBusiness, caba!)).toBe(true);
  });
});
