import { useLocation } from 'react-router-dom';
import { useSEO } from '../../hooks/useSEO';
import { SEOConfig, SITE_NAME, toAbsoluteUrl } from '../../seo/seo';

function RouteSEO() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchTerm = (queryParams.get('q') ?? '').trim();
  const selectedCategory = (queryParams.get('category') ?? '').trim();

  const baseDescription = 'Encontra descuentos, cuotas y beneficios bancarios en comercios de toda Argentina.';

  let seoConfig: SEOConfig;

  if (location.pathname === '/' || location.pathname === '/home') {
    seoConfig = {
      title: `Descuentos bancarios en Argentina | ${SITE_NAME}`,
      description: baseDescription,
      path: '/home',
      keywords: [
        'descuentos bancarios',
        'promociones tarjetas',
        'beneficios bancos argentina',
        'cuotas sin interes',
      ],
      structuredData: [
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: SITE_NAME,
          url: toAbsoluteUrl('/home'),
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: toAbsoluteUrl('/home'),
          inLanguage: 'es-AR',
          potentialAction: {
            '@type': 'SearchAction',
            target: `${toAbsoluteUrl('/search')}?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
      ],
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
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'SearchResultsPage',
        name: title,
        url: toAbsoluteUrl(location.pathname + location.search),
        inLanguage: 'es-AR',
      },
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
  } else if (location.pathname.startsWith('/business/')) {
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
  } else if (location.pathname === '/saved' || location.pathname === '/profile') {
    seoConfig = {
      title: `${SITE_NAME}`,
      description: baseDescription,
      path: location.pathname,
      robots: 'noindex, nofollow',
    };
  } else {
    seoConfig = {
      title: `${SITE_NAME}`,
      description: baseDescription,
      path: '/home',
    };
  }

  useSEO(seoConfig);

  return null;
}

export default RouteSEO;
