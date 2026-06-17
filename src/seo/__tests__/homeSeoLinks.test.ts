import { describe, expect, it } from 'vitest';
import { HOME_CATEGORY_LINKS, HOME_DISCOUNT_LINKS, HOME_GUIDE_LINKS } from '../homeSeoLinks';

describe('home SEO links', () => {
  it('exposes crawlable category and discount landing links', () => {
    expect(HOME_CATEGORY_LINKS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: '/categorias/gastronomia' }),
        expect.objectContaining({ href: '/categorias/supermercado' }),
      ])
    );
    expect(HOME_DISCOUNT_LINKS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: '/descuentos/galicia/gastronomia' }),
        expect.objectContaining({ href: '/descuentos/bbva/shopping' }),
      ])
    );
    expect(HOME_GUIDE_LINKS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: '/buscador-de-descuentos-bancarios' }),
      ])
    );
  });
});
