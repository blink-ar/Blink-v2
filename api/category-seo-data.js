export const SEO_CATEGORY_DEFINITIONS = [
  {
    slug: 'gastronomia',
    category: 'gastronomia',
    label: 'Gastronomia',
    description: 'restaurantes, bares, cafeterias y locales de comida',
  },
  {
    slug: 'moda',
    category: 'moda',
    label: 'Moda',
    description: 'indumentaria, calzado, accesorios y tiendas de ropa',
  },
  {
    slug: 'entretenimiento',
    category: 'entretenimiento',
    label: 'Entretenimiento',
    description: 'cines, juegos, salidas y experiencias',
  },
  {
    slug: 'deportes',
    category: 'deportes',
    label: 'Deportes',
    description: 'indumentaria deportiva, gimnasios y articulos deportivos',
  },
  {
    slug: 'regalos',
    category: 'regalos',
    label: 'Regalos',
    description: 'regalerias, flores, librerias y tiendas para regalar',
  },
  {
    slug: 'viajes',
    category: 'viajes',
    label: 'Viajes',
    description: 'turismo, hoteles, vuelos y experiencias de viaje',
  },
  {
    slug: 'automotores',
    category: 'automotores',
    label: 'Automotores',
    description: 'autos, motos, repuestos, servicios y mantenimiento',
  },
  {
    slug: 'belleza',
    category: 'belleza',
    label: 'Belleza',
    description: 'perfumerias, cosmetica, peluquerias y cuidado personal',
  },
  {
    slug: 'jugueterias',
    category: 'jugueterias',
    label: 'Jugueterias',
    description: 'juguetes, juegos, articulos infantiles y regalos para chicos',
  },
  {
    slug: 'hogar',
    category: 'hogar',
    label: 'Hogar',
    description: 'decoracion, muebles, bazar y articulos para la casa',
  },
  {
    slug: 'electro',
    category: 'electro',
    label: 'Electro',
    description: 'electrodomesticos, tecnologia y electronica',
  },
  {
    slug: 'supermercado',
    category: 'shopping',
    aliases: ['shopping'],
    label: 'Supermercado',
    description: 'supermercados, tiendas y compras diarias',
  },
  {
    slug: 'otros',
    category: 'otros',
    label: 'Otros',
    description: 'comercios y servicios con beneficios bancarios',
  },
];

function normalizeCategoryValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function resolveSeoCategory(value) {
  const normalized = normalizeCategoryValue(value);
  if (!normalized) return null;

  return SEO_CATEGORY_DEFINITIONS.find((category) => (
    category.slug === normalized ||
    category.category === normalized ||
    (category.aliases || []).includes(normalized)
  )) || null;
}

export function getCategorySeoPath(category, page = 1) {
  const safePage = Number.isFinite(Number(page)) ? Math.max(1, Number.parseInt(String(page), 10)) : 1;
  const basePath = `/categorias/${category.slug}`;
  return safePage > 1 ? `${basePath}/page/${safePage}` : basePath;
}
