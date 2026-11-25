import { getCategorySeoPath, resolveSeoCategory } from '../api/category-seo-data.js';

export function getMerchantSeoAlternative(category) {
  const resolved = resolveSeoCategory(category);
  if (resolved && resolved.slug !== 'otros') {
    return {
      href: getCategorySeoPath(resolved),
      label: `Ver descuentos en ${resolved.label.toLocaleLowerCase('es-AR')}`,
    };
  }
  return { href: '/search', label: 'Buscar otros descuentos' };
}

export function getInactiveMerchantDescription(name) {
  return `${name} no tiene descuentos activos publicados en Blink. Explorá otros comercios y compará promociones bancarias vigentes.`;
}
