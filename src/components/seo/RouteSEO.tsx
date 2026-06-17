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
        'cuotas sin interes',
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
      : 'Busca descuentos bancarios por comercio, categoria y banco en Argentina.';

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
  } else if (location.pathname === '/map') {
    seoConfig = {
      title: `Mapa de descuentos bancarios cercanos | ${SITE_NAME}`,
      description: 'Explora descuentos bancarios cercanos en el mapa y encuentra beneficios por ubicacion.',
      path: '/map',
    };
  } else if (location.pathname.startsWith('/descuentos/')) {
    seoConfig = {
      title: `Descuentos bancarios por banco y categoria | ${SITE_NAME}`,
      description: 'Explora descuentos bancarios por banco, categoria y ciudad en Argentina.',
      path: location.pathname,
    };
  } else if (location.pathname.startsWith('/categorias/')) {
    const [, , categoryParam, pageSegment, pageParam] = location.pathname.split('/');
    const category = resolveSeoCategory(categoryParam);
    const page = pageSegment === 'page' ? Number.parseInt(pageParam || '1', 10) : 1;
    const pageSuffix = Number.isFinite(page) && page > 1 ? ` - pagina ${page}` : '';
    const label = category?.label || 'categoria';

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
