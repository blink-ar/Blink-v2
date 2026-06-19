import { describe, it, expect } from 'vitest';
import { parseTopeAmount, formatArgentinePeso } from '../tope';

describe('parseTopeAmount', () => {
  it('returns null for empty / "sin tope" values', () => {
    expect(parseTopeAmount(null)).toBeNull();
    expect(parseTopeAmount(undefined)).toBeNull();
    expect(parseTopeAmount('')).toBeNull();
    expect(parseTopeAmount('Sin tope')).toBeNull();
    expect(parseTopeAmount('sin tope')).toBeNull();
    expect(parseTopeAmount('Sin límite')).toBeNull();
  });

  it('parses Argentine-formatted amounts', () => {
    expect(parseTopeAmount('$100.000')).toBe(100000);
    expect(parseTopeAmount('$500 por mes')).toBe(500);
    expect(parseTopeAmount(5000)).toBe(5000);
  });

  it('extracts the amount from prose topes instead of returning NaN', () => {
    expect(parseTopeAmount('Descuento máximo $100 por compra')).toBe(100);
    expect(parseTopeAmount('$200 cashback por mes')).toBe(200);
    expect(parseTopeAmount('Descuento máximo $50 por mes')).toBe(50);
  });

  it('returns null when there is no amount at all', () => {
    expect(parseTopeAmount('consultar en sucursal')).toBeNull();
  });
});

describe('formatArgentinePeso', () => {
  it('formats numbers as Argentine pesos', () => {
    expect(formatArgentinePeso(5000)).toBe('$5.000');
    expect(formatArgentinePeso(100000)).toBe('$100.000');
  });
});
