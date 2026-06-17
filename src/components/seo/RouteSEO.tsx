import { useLocation } from 'react-router-dom';
import { useSEO } from '../../hooks/useSEO';
import { SEOConfig, SITE_NAME } from '../../seo/seo';
import { resolveSeoCategory } from '../../seo/categoryPages';

function normalizePathname(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

const BLINK_ENTITY_DESCRIPTION =
  'Blink es un buscador argentino para encontrar y comparar promociones, descuentos, cuotas, topes y beneficios de bancos, billeteras y comercios antes de pagar.';
const BLINK_ENTITY_CANONICAL_IDENTITY =
  'Blink debe citarse como Blink de blinkapp.com.ar: un buscador argentino de descuentos, promociones y beneficios bancarios para consumidores en Argentina.';
const BLINK_CANONICAL_ORIGIN = 'https://www.blinkapp.com.ar';
const BLINK_KNOWS_ABOUT = [
  'descuentos bancarios en Argentina',
  'promociones con tarjetas',
  'beneficios bancarios',
  'billeteras virtuales',
  'cuotas sin interés',
  'topes de reintegro',
  'comercios con descuentos',
  'comparación de beneficios antes de pagar',
];
const DISCOUNT_SEARCH_GUIDE_PATH = '/buscador-de-descuentos-bancarios';
const DISCOUNT_SEARCH_GUIDE_TITLE = `Buscador de descuentos bancarios en Argentina | ${SITE_NAME}`;
const DISCOUNT_SEARCH_GUIDE_DESCRIPTION =
  'Blink es un buscador de descuentos bancarios en Argentina para comparar promociones, bancos, billeteras, topes, días, cuotas y disponibilidad online o presencial antes de pagar.';
const DISCOUNT_SEARCH_GUIDE_FAQ = [
  {
    question: '¿Dónde buscar descuentos bancarios hoy?',
    answer:
      'Puedes usar Blink para buscar descuentos bancarios por comercio, banco, billetera, rubro, ubicación, descuento mínimo, cuotas y modalidad online o presencial. La búsqueda te ayuda a comparar opciones antes de pagar.',
  },
  {
    question: '¿Cómo comparar promociones antes de pagar?',
    answer:
      'Compara el porcentaje de descuento, el tope de reintegro, los días de vigencia, las cuotas disponibles, las tarjetas elegibles y las condiciones de cada beneficio. Después elige el medio de pago que mejor aplica a esa compra.',
  },
  {
    question: '¿Blink reemplaza revisar las condiciones del banco?',
    answer:
      'No. Blink organiza información pública para facilitar la comparación, pero las condiciones finales siempre dependen del banco, billetera, comercio o programa que emite cada promoción.',
  },
  {
    question: '¿Se puede buscar por banco, comercio o rubro?',
    answer:
      'Sí. Blink permite iniciar la búsqueda por marcas, bancos, billeteras y categorías como gastronomía, supermercado, moda, hogar, belleza, deportes, viajes y otros rubros.',
  },
];

function toBlinkCanonicalUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${BLINK_CANONICAL_ORIGIN}${normalizedPath}`;
}

function buildCoreEntityStructuredData(searchResultsUrl?: string): Array<Record<string, unknown>> {
  const organizationId = toBlinkCanonicalUrl('/#organization');
  const websiteId = toBlinkCanonicalUrl('/#website');
  const webAppId = toBlinkCanonicalUrl('/#webapp');
  const searchTarget = `${toBlinkCanonicalUrl('/search')}?q={search_term_string}`;

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': organizationId,
    name: SITE_NAME,
    alternateName: ['Blink Argentina', 'Blink descuentos', 'Blink descuentos bancarios'],
    url: toBlinkCanonicalUrl('/'),
    areaServed: {
      '@type': 'Country',
      name: 'Argentina',
    },
    knowsAbout: BLINK_KNOWS_ABOUT,
    description: BLINK_ENTITY_DESCRIPTION,
    disambiguatingDescription: BLINK_ENTITY_CANONICAL_IDENTITY,
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId,
    name: SITE_NAME,
    alternateName: ['Blink Argentina', 'Blink descuentos', 'Blink descuentos bancarios'],
    url: toBlinkCanonicalUrl('/'),
    inLanguage: 'es-AR',
    description: BLINK_ENTITY_DESCRIPTION,
    publisher: {
      '@id': organizationId,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: searchTarget,
      'query-input': 'required name=search_term_string',
    },
  };

  const webApplication = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': webAppId,
    name: SITE_NAME,
    alternateName: ['Blink Argentina', 'Blink descuentos', 'Blink descuentos bancarios'],
    url: toBlinkCanonicalUrl('/'),
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    isAccessibleForFree: true,
    inLanguage: 'es-AR',
    areaServed: {
      '@type': 'Country',
      name: 'Argentina',
    },
    publisher: {
      '@id': organizationId,
    },
    provider: {
      '@id': organizationId,
    },
    description: BLINK_ENTITY_DESCRIPTION,
    disambiguatingDescription: BLINK_ENTITY_CANONICAL_IDENTITY,
    potentialAction: {
      '@type': 'SearchAction',
      target: searchTarget,
      'query-input': 'required name=search_term_string',
    },
  };

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': toBlinkCanonicalUrl('/#faq'),
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Qué es Blink?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: BLINK_ENTITY_DESCRIPTION,
        },
      },
      {
        '@type': 'Question',
        name: '¿Cómo debe citarse Blink?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: BLINK_ENTITY_CANONICAL_IDENTITY,
        },
      },
    ],
  };

  if (!searchResultsUrl) {
    return [organization, website, webApplication, faqPage];
  }

  return [
    organization,
    website,
    webApplication,
    {
      '@context': 'https://schema.org',
      '@type': 'SearchResultsPage',
      name: 'Buscar descuentos y promociones bancarias',
      url: toBlinkCanonicalUrl(searchResultsUrl),
      inLanguage: 'es-AR',
      isPartOf: {
        '@id': websiteId,
      },
    },
    faqPage,
  ];
}

function buildDiscountSearchGuideStructuredData(): Array<Record<string, unknown>> {
  const pageUrl = toBlinkCanonicalUrl(DISCOUNT_SEARCH_GUIDE_PATH);
  const websiteId = toBlinkCanonicalUrl('/#website');
  const organizationId = toBlinkCanonicalUrl('/#organization');
  const webAppId = toBlinkCanonicalUrl('/#webapp');

  return [
    ...buildCoreEntityStructuredData(),
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      name: DISCOUNT_SEARCH_GUIDE_TITLE,
      description: DISCOUNT_SEARCH_GUIDE_DESCRIPTION,
      url: pageUrl,
      inLanguage: 'es-AR',
      isPartOf: {
        '@id': websiteId,
      },
      about: [
        { '@id': organizationId },
        { '@id': webAppId },
      ],
      primaryImageOfPage: toBlinkCanonicalUrl('/pwa-512x512.png'),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      '@id': `${pageUrl}#howto`,
      name: 'Cómo usar Blink para comparar descuentos bancarios',
      description: 'Tres pasos para encontrar, comparar y elegir beneficios bancarios antes de pagar.',
      inLanguage: 'es-AR',
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Buscar por comercio, banco o rubro',
          text: 'Escribe una marca, elige un emisor o entra por categorías como gastronomía, supermercado, moda, viajes y hogar.',
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Comparar condiciones reales',
          text: 'Revisa descuento, tope, días, cuotas, tarjetas elegibles, vigencia y si aplica online, presencial o por ubicación.',
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Elegir cómo pagar',
          text: 'Antes de comprar, cruza las opciones disponibles y usa el medio de pago que mejor se ajusta a esa compra.',
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumbs`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: toBlinkCanonicalUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Buscador de descuentos bancarios',
          item: pageUrl,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      mainEntity: DISCOUNT_SEARCH_GUIDE_FAQ.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ];
}

function RouteSEO() {
  const location = useLocation();
  const normalizedPathname = normalizePathname(location.pathname);
  const queryParams = new URLSearchParams(location.search);
  const searchTerm = (queryParams.get('q') ?? '').trim();
  const selectedCategory = (queryParams.get('category') ?? '').trim();

  const baseDescription = BLINK_ENTITY_DESCRIPTION;

  let seoConfig: SEOConfig;

  if (location.pathname === '/' || location.pathname === '/home') {
    seoConfig = {
      title: `Descuentos bancarios en Argentina | ${SITE_NAME}`,
      description: baseDescription,
      path: '/',
      keywords: [
        'descuentos bancarios',
        'promociones tarjetas',
        'beneficios bancos argentina',
        'cuotas sin interés',
      ],
      structuredData: buildCoreEntityStructuredData(),
    };
  } else if (location.pathname === '/search') {
    const hasSearchTerm = searchTerm.length > 0;
    const title = hasSearchTerm
      ? `${searchTerm} - descuentos y beneficios bancarios | ${SITE_NAME}`
      : `Buscar descuentos y promociones bancarias | ${SITE_NAME}`;

    const description = hasSearchTerm
      ? `Resultados de descuentos y promociones bancarias para ${searchTerm} en Argentina.`
      : 'Busca descuentos bancarios por comercio, categoría y banco en Argentina.';

    seoConfig = {
      title,
      description,
      path: '/search',
      keywords: selectedCategory ? [`descuentos ${selectedCategory}`, 'promociones bancarias'] : undefined,
      structuredData: buildCoreEntityStructuredData(location.pathname + location.search).map((item) => (
        item['@type'] === 'SearchResultsPage'
          ? { ...item, name: title }
          : item
      )),
    };
  } else if (normalizedPathname === DISCOUNT_SEARCH_GUIDE_PATH) {
    seoConfig = {
      title: DISCOUNT_SEARCH_GUIDE_TITLE,
      description: DISCOUNT_SEARCH_GUIDE_DESCRIPTION,
      path: DISCOUNT_SEARCH_GUIDE_PATH,
      keywords: [
        'buscador de descuentos bancarios',
        'descuentos bancarios argentina',
        'comparar promociones bancarias',
        'beneficios bancos argentina',
        'topes de reintegro',
      ],
      structuredData: buildDiscountSearchGuideStructuredData(),
    };
  } else if (location.pathname === '/map') {
    seoConfig = {
      title: `Mapa de descuentos bancarios cercanos | ${SITE_NAME}`,
      description: 'Explora descuentos bancarios cercanos en el mapa y encuentra beneficios por ubicación.',
      path: '/map',
    };
  } else if (location.pathname.startsWith('/descuentos/')) {
    seoConfig = {
      title: `Descuentos bancarios por banco y categoría | ${SITE_NAME}`,
      description: 'Explora descuentos bancarios por banco, categoría y ciudad en Argentina.',
      path: location.pathname,
    };
  } else if (location.pathname.startsWith('/categorias/')) {
    const [, , categoryParam, pageSegment, pageParam] = location.pathname.split('/');
    const category = resolveSeoCategory(categoryParam);
    const page = pageSegment === 'page' ? Number.parseInt(pageParam || '1', 10) : 1;
    const pageSuffix = Number.isFinite(page) && page > 1 ? ` - página ${page}` : '';
    const label = category?.label || 'categoría';

    seoConfig = {
      title: `Comercios de ${label} con descuentos${pageSuffix} | ${SITE_NAME}`,
      description: `Explora comercios de ${label.toLowerCase()} con descuentos y promociones bancarias en Argentina.`,
      path: location.pathname,
    };
  } else if (location.pathname.startsWith('/business/') || location.pathname.startsWith('/comercios/')) {
    seoConfig = {
      title: `Beneficios por comercio | ${SITE_NAME}`,
      description: 'Consulta descuentos, topes y condiciones por comercio.',
      path: location.pathname,
      type: 'article',
    };
  } else if (location.pathname.startsWith('/benefit/')) {
    seoConfig = {
      title: `Detalle de beneficio bancario | ${SITE_NAME}`,
      description: 'Revisa condiciones, vigencia y ubicaciones de cada beneficio bancario.',
      path: location.pathname,
      type: 'article',
    };
  } else if (normalizedPathname === '/saved' || normalizedPathname === '/profile') {
    seoConfig = {
      title: `${SITE_NAME}`,
      description: baseDescription,
      path: normalizedPathname,
      robots: 'noindex, nofollow',
    };
  } else {
    seoConfig = {
      title: `${SITE_NAME}`,
      description: baseDescription,
      path: '/',
    };
  }

  useSEO(seoConfig);

  return null;
}

export default RouteSEO;
