/**
 * Lightweight keyword → category inference.
 * Used in the search fallback to suggest relatives when a query
 * yields zero results and the user hasn't applied a category filter.
 *
 * Keywords are matched against the normalised (lowercase, accent-stripped)
 * search term. The first matching rule wins.
 */

const RULES: { keywords: string[]; category: string }[] = [
  {
    category: 'gastronomia',
    keywords: [
      'restaurant', 'restaurante', 'sandwich', 'sandwicheria', 'sandwichería',
      'burger', 'hamburguesa', 'pizza', 'pizzeria', 'pizzería', 'sushi',
      'cafe', 'café', 'cafeteria', 'cafetería', 'panaderia', 'panadería',
      'heladeria', 'heladería', 'comida', 'food', 'bar', 'cerveceria',
      'cervecería', 'brasserie', 'bistro', 'grill', 'asador', 'rotiseria',
      'rotisería', 'delivery', 'empanada', 'empanadas', 'taco', 'sushi',
      'wok', 'bodegon', 'bodegón', 'cantina', 'trattoria', 'creperia',
      'crepería', 'waffle', 'brunch', 'resto', 'ristorante',
    ],
  },
  {
    category: 'moda',
    keywords: [
      'ropa', 'moda', 'fashion', 'clothing', 'zapatillas', 'zapatos',
      'remera', 'camisa', 'jean', 'jeans', 'vestido', 'pollera',
      'indumentaria', 'calzado', 'boutique', 'tienda', 'outlet',
      'uniqlo', 'zara', 'forever21', 'hm', 'h&m', 'adidas', 'nike',
      'reebok', 'puma', 'lacoste', 'tommy', 'gap',
    ],
  },
  {
    category: 'viajes',
    keywords: [
      'hotel', 'vuelo', 'viaje', 'viajes', 'travel', 'turismo', 'airline',
      'aereo', 'aéreo', 'aerolinea', 'aerolínea', 'hospedaje', 'hostel',
      'crucero', 'tour', 'excursion', 'excursión', 'alojamiento',
      'airbnb', 'booking',
    ],
  },
  {
    category: 'entretenimiento',
    keywords: [
      'cine', 'cinema', 'teatro', 'show', 'espectaculo', 'espectáculo',
      'musica', 'música', 'concierto', 'evento', 'streaming', 'netflix',
      'spotify', 'disney', 'hbo', 'gaming', 'juego',
    ],
  },
  {
    category: 'deportes',
    keywords: [
      'deporte', 'deportes', 'gym', 'gimnasio', 'fitness', 'sport',
      'running', 'crossfit', 'pilates', 'yoga', 'natacion', 'natación',
      'cancha', 'futbol', 'fútbol', 'tenis', 'padel', 'pádel',
    ],
  },
  {
    category: 'belleza',
    keywords: [
      'belleza', 'beauty', 'peluqueria', 'peluquería', 'salon', 'salón',
      'spa', 'estetica', 'estética', 'cosmetica', 'cosmética', 'perfume',
      'maquillaje', 'makeup', 'nail', 'uñas', 'brower', 'barberia', 'barbería',
    ],
  },
  {
    category: 'hogar',
    keywords: [
      'hogar', 'mueble', 'muebles', 'deco', 'decoracion', 'decoración',
      'colchon', 'colchón', 'cocina', 'baño', 'iluminacion', 'iluminación',
      'jardin', 'jardín', 'ferreteria', 'ferretería', 'pintura',
    ],
  },
  {
    category: 'electro',
    keywords: [
      'electro', 'electronica', 'electrónica', 'celular', 'smartphone',
      'notebook', 'computadora', 'laptop', 'tablet', 'television',
      'televisor', 'heladera', 'lavarropas', 'aire', 'acondicionado',
      'frigobar', 'audio',
    ],
  },
  {
    category: 'automotores',
    keywords: [
      'auto', 'autos', 'automotor', 'automotores', 'vehiculo', 'vehículo',
      'taller', 'nafta', 'combustible', 'aceite', 'neumatico', 'neumático',
      'lavadero', 'garage',
    ],
  },
];

/** Normalise text: lowercase + remove diacritics */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Given a raw search string, returns the best matching category token
 * or `undefined` if nothing matches.
 */
export function inferCategoryFromSearch(search: string): string | undefined {
  const norm = normalise(search);
  const words = norm.split(/\s+/).filter(Boolean);

  for (const rule of RULES) {
    const normKeywords = rule.keywords.map(normalise);
    const hit = words.some((word) =>
      normKeywords.some((kw) => word.includes(kw) || kw.includes(word))
    );
    if (hit) return rule.category;
  }

  return undefined;
}
