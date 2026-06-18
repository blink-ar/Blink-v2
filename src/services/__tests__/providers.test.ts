import { describe, expect, it } from 'vitest';
import {
  buildProviderCatalog,
  resolveProviderCanonicalValues,
  resolveProviderFilterValues,
} from '../../../server/providers.js';

describe('provider canonical resolver', () => {
  const catalog = buildProviderCatalog([
    { key: 'mercadopago', name: 'Mercado Pago' },
    { key: 'personal', name: 'Personal Pay' },
    { key: 'nacion', name: 'Banco Nación' },
  ]);

  it('resolves static aliases to provider keys', () => {
    expect(catalog.resolveKey('mercado')).toBe('mercadopago');
    expect(catalog.resolveKey('Mercado Pago')).toBe('mercadopago');
    expect(catalog.resolveKey('personalpay')).toBe('personal');
    expect(catalog.resolveKey('Banco Nacion')).toBe('nacion');
  });

  it('uses provider display names and short names from the catalog', () => {
    expect(catalog.resolveProvider('mp')?.name).toBe('Mercado Pago');
    expect(catalog.resolveProvider('personal pay')?.shortName).toBe('PP');
  });

  it('expands known providers for legacy exact-match filters', () => {
    expect(resolveProviderCanonicalValues(catalog, 'mercado')).toEqual(['mercadopago']);
    expect(resolveProviderFilterValues(catalog, 'mercado')).toEqual(expect.arrayContaining([
      'mercadopago',
      'Mercado Pago',
      'mercado pago',
      'mercado',
      'MP',
      'mp',
    ]));
  });

  it('does not resolve unknown providers outside the catalog', () => {
    expect(catalog.resolveKey('Banco Test')).toBeNull();
    expect(catalog.resolveProvider('Banco Test')).toBeNull();
    expect(resolveProviderCanonicalValues(catalog, 'Banco Test')).toEqual([]);
    expect(resolveProviderFilterValues(catalog, 'Banco Test')).toEqual([]);
  });
});
