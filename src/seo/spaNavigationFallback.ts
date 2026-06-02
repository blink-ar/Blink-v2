const landingBankPattern = [
  'galicia',
  'santander',
  'rio',
  'bbva',
  'frances',
  'banco-frances',
  'macro',
  'nacion',
  'bna',
  'banco-nacion',
  'icbc',
].join('|');

const landingCategoryPattern = 'gastronomia|moda|shopping|hogar|deportes|belleza';

const landingCityPattern = [
  'buenos-aires',
  'provincia-de-buenos-aires',
  'caba',
  'ciudad-autonoma-de-buenos-aires',
  'cdad-autonoma-de-buenos-aires',
  'capital-federal',
  'cordoba',
  'cordoba-capital',
  'rosario',
  'santa-fe',
  'mendoza',
  'la-plata',
  'mar-del-plata',
  'tucuman',
  'san-miguel-de-tucuman',
].join('|');

export const spaNavigationFallbackAllowlist: RegExp[] = [
  /^\/(?:\?.*)?$/i,
  /^\/(?:home|search|map|saved|profile|notifications|signup|login)\/?(?:\?.*)?$/i,
  /^\/auth\/callback\/?(?:\?.*)?$/i,
  /^\/benefit\/[^/?]+(?:\/[^/?]+)?\/?(?:\?.*)?$/i,
  /^\/comercios\/[^/?]+\/?(?:\?.*)?$/i,
  /^\/business\/[^/?]+\/?(?:\?.*)?$/i,
  /^\/categorias\/[^/?]+(?:\/page\/[^/?]+)?\/?(?:\?.*)?$/i,
  new RegExp(
    `^/descuentos/(?:${landingBankPattern})/(?:${landingCategoryPattern})(?:/(?:${landingCityPattern}))?/?(?:\\?.*)?$`,
    'i'
  ),
];
