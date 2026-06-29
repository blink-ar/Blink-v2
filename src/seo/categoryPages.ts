export interface SeoCategoryLink {
  slug: string;
  category: string;
  aliases?: string[];
  label: string;
  description: string;
  emoji: string;
}

export const SEO_CATEGORY_LINKS: SeoCategoryLink[] = [
  { slug: 'gastronomia', category: 'gastronomia', label: 'Gastronomía', description: 'Restaurantes, bares y cafeterías', emoji: '🍕' },
  { slug: 'moda', category: 'moda', label: 'Moda', description: 'Ropa, calzado y accesorios', emoji: '👗' },
  { slug: 'entretenimiento', category: 'entretenimiento', label: 'Entretenimiento', description: 'Cines, juegos y salidas', emoji: '🎮' },
  { slug: 'deportes', category: 'deportes', label: 'Deportes', description: 'Indumentaria y artículos deportivos', emoji: '⚽' },
  { slug: 'regalos', category: 'regalos', label: 'Regalos', description: 'Regalerías, flores y librerías', emoji: '🎁' },
  { slug: 'viajes', category: 'viajes', label: 'Viajes', description: 'Turismo, hoteles y experiencias', emoji: '✈️' },
  { slug: 'combustible', category: 'combustible', aliases: ['combustibles', 'nafta'], label: 'Combustible', description: 'Estaciones de servicio y combustibles', emoji: '⛽' },
  { slug: 'automotores', category: 'automotores', label: 'Automotores', description: 'Autos, motos y servicios', emoji: '🚗' },
  { slug: 'belleza', category: 'belleza', label: 'Belleza', description: 'Perfumerías y cuidado personal', emoji: '💄' },
  { slug: 'jugueterias', category: 'jugueterias', label: 'Jugueterías', description: 'Juguetes y artículos infantiles', emoji: '🧸' },
  { slug: 'hogar', category: 'hogar', label: 'Hogar', description: 'Decoración, muebles y bazar', emoji: '🏠' },
  { slug: 'electro', category: 'electro', label: 'Electro', description: 'Tecnología y electrodomésticos', emoji: '💻' },
  { slug: 'supermercados', category: 'supermercados', aliases: ['supermercado'], label: 'Supermercados', description: 'Supermercados e hipermercados', emoji: '🛒' },
  { slug: 'shopping', category: 'shopping', label: 'Shopping', description: 'Shoppings y tiendas retail', emoji: '🛍️' },
  { slug: 'otros', category: 'otros', label: 'Otros', description: 'Más comercios con beneficios', emoji: '📦' },
];

function normalizeCategoryValue(value: string | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getCategorySeoPath(category: SeoCategoryLink, page = 1): string {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  const basePath = `/categorias/${category.slug}`;
  return safePage > 1 ? `${basePath}/page/${safePage}` : basePath;
}

export function resolveSeoCategory(value: string | undefined): SeoCategoryLink | null {
  const normalized = normalizeCategoryValue(value);
  if (!normalized) return null;

  return SEO_CATEGORY_LINKS.find((category) => (
    category.slug === normalized ||
    category.category === normalized ||
    (category.aliases ?? []).includes(normalized)
  )) ?? null;
}
