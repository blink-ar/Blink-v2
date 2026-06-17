import { SEO_CATEGORY_LINKS } from './categoryPages';
import { getLandingPath } from './landingData';

export interface HomeSeoLink {
  label: string;
  href: string;
}

export const HOME_CATEGORY_LINKS: HomeSeoLink[] = SEO_CATEGORY_LINKS
  .filter((category) => [
    'gastronomia',
    'moda',
    'supermercado',
    'hogar',
    'deportes',
    'belleza',
  ].includes(category.slug))
  .map((category) => ({
    label: category.label,
    href: `/categorias/${category.slug}`,
  }));

export const HOME_DISCOUNT_LINKS: HomeSeoLink[] = [
  { label: 'Galicia en Gastronomía', href: getLandingPath('galicia', 'gastronomia') },
  { label: 'Santander en Moda', href: getLandingPath('santander', 'moda') },
  { label: 'BBVA en Supermercado', href: getLandingPath('bbva', 'shopping') },
  { label: 'Macro en Hogar', href: getLandingPath('macro', 'hogar') },
  { label: 'Banco Nación en Deportes', href: getLandingPath('nacion', 'deportes') },
  { label: 'ICBC en Belleza', href: getLandingPath('icbc', 'belleza') },
];

export const HOME_GUIDE_LINKS: HomeSeoLink[] = [
  {
    label: 'Buscador de descuentos bancarios',
    href: '/buscador-de-descuentos-bancarios',
  },
];
