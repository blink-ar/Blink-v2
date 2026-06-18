import { describe, expect, it } from 'vitest';
import {
  buildProviderCatalog,
  loadProviderCatalog,
  resolveProviderCanonicalValues,
  resolveProviderFilterValues,
} from '../../../server/providers.js';

describe('provider canonical resolver', () => {
  const catalog = buildProviderCatalog([
    {
      key: 'mercadopago',
      name: 'Mercado Pago',
      aliases: ['mercado', 'mercado pago', 'mp'],
      shortName: 'MP',
    },
    {
      key: 'personal',
      name: 'Personal Pay',
      aliases: ['personalpay', 'personal pay'],
      shortName: 'PP',
    },
    {
      key: 'nacion',
      name: 'Banco Nación',
      aliases: ['bna', 'banco nacion', 'banco nación'],
      shortName: 'BNA',
    },
  ]);

  it('resolves catalog aliases to provider keys', () => {
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

  it('does not use seed metadata when aliases are missing from provider docs', () => {
    const catalogWithoutAliases = buildProviderCatalog([
      { key: 'mercadopago', name: 'Mercado Pago' },
    ]);

    expect(catalogWithoutAliases.resolveKey('Mercado Pago')).toBe('mercadopago');
    expect(catalogWithoutAliases.resolveKey('mercado')).toBeNull();
    expect(catalogWithoutAliases.resolveKey('mp')).toBeNull();
  });

  it('marks an empty provider catalog as unavailable', () => {
    expect(buildProviderCatalog([]).isAvailable).toBe(false);
    expect(catalog.isAvailable).toBe(true);
  });

  it('does not keep an empty loaded catalog cached', async () => {
    delete (globalThis as { __blinkProviderCatalog?: unknown }).__blinkProviderCatalog;
    const providerDocs = [
      [],
      [{ key: 'mercadopago', name: 'Mercado Pago', aliases: ['mercado'], shortName: 'MP' }],
    ];
    let readCount = 0;
    const db = {
      collection(name: string) {
        expect(name).toBe('providers');
        return {
          find() {
            return {
              async toArray() {
                return providerDocs[Math.min(readCount++, providerDocs.length - 1)];
              },
            };
          },
        };
      },
    };

    const emptyCatalog = await loadProviderCatalog(db as never);
    const reloadedCatalog = await loadProviderCatalog(db as never);

    expect(emptyCatalog.isAvailable).toBe(false);
    expect(reloadedCatalog.isAvailable).toBe(true);
    expect(reloadedCatalog.resolveKey('mercado')).toBe('mercadopago');
    expect(readCount).toBe(2);
  });
});
