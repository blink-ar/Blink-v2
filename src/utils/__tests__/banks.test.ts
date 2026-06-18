import { describe, expect, it } from 'vitest';
import { buildBankOptions, toBankDescriptor } from '../banks';

describe('bank descriptors', () => {
  it('normalizes legacy aliases to canonical provider keys', () => {
    expect(toBankDescriptor('mercado').token).toBe('mercadopago');
    expect(toBankDescriptor('Mercado Pago').token).toBe('mercadopago');
    expect(toBankDescriptor('personalpay').token).toBe('personal');
  });

  it('dedupes API descriptors and selected legacy tokens by canonical key', () => {
    const options = buildBankOptions(
      [
        {
          key: 'mercadopago',
          name: 'Mercado Pago',
          shortName: 'MP',
          aliases: ['mercado'],
          count: 10,
          indexed: true,
        },
      ],
      ['mercado'],
    );

    expect(options).toHaveLength(1);
    expect(options[0]).toMatchObject({
      token: 'mercadopago',
      label: 'MERCADO PAGO',
      code: 'MP',
      count: 10,
      indexed: true,
    });
  });

  it('sorts API descriptors by indexed count', () => {
    const options = buildBankOptions([
      { key: 'bbva', name: 'BBVA', shortName: 'BBVA', count: 2, indexed: false },
      { key: 'galicia', name: 'Galicia', shortName: 'GAL', count: 20, indexed: true },
    ]);

    expect(options.map((option) => option.token)).toEqual(['galicia', 'bbva']);
  });
});
