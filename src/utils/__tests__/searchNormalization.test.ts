import { describe, expect, it } from 'vitest';
import { buildSearchPhraseVariants, matchesSearchPhrase, normalizeSearchText } from '../searchNormalization';

describe('searchNormalization', () => {
  it('normalizes accents in search text', () => {
    expect(normalizeSearchText('Almacén de Pizzas')).toBe('almacen de pizzas');
  });

  it('builds connector-free and singular phrase variants', () => {
    expect(buildSearchPhraseVariants('Almacén de Pizzas')).toEqual(
      expect.arrayContaining([
        'almacen de pizzas',
        'almacen de pizza',
        'almacen pizzas',
        'almacen pizza',
      ]),
    );
  });

  it.each([
    'almacen de pizza',
    'almacen pizzas',
    'almacen pizza',
    'almacen de la pizza',
    'almacen de las pizzas',
  ])('matches merchant names with normalized query "%s"', (query) => {
    expect(matchesSearchPhrase('Almacén de Pizzas', query)).toBe(true);
  });
});
