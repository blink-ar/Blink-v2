import { describe, expect, it } from 'vitest';
import { assertProviderCatalogAvailable } from '../../../scripts/search-indexer.mjs';
import { buildProviderCatalog } from '../../../server/providers.js';

describe('search indexer provider catalog guard', () => {
  it('aborts when the provider catalog is empty', () => {
    expect(() => assertProviderCatalogAvailable(buildProviderCatalog([]))).toThrow(
      'Provider catalog is empty'
    );
  });

  it('allows indexing when the provider catalog has providers', () => {
    const catalog = buildProviderCatalog([
      { key: 'mercadopago', name: 'Mercado Pago', aliases: ['mercado'], shortName: 'MP' },
    ]);

    expect(() => assertProviderCatalogAvailable(catalog)).not.toThrow();
  });
});
