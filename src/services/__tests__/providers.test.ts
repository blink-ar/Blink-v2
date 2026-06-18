import { describe, expect, it } from 'vitest';
import {
  buildProviderCatalog,
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

  it('falls back to normalized keys for unknown providers', () => {
    expect(catalog.resolveKey('Banco Test')).toBe('bancotest');
    expect(resolveProviderFilterValues(catalog, 'Banco Test')).toEqual([
      'banco test',
      'bancotest',
      'test',
    ]);
  });
});
