const DEFAULT_SITE_NAME = 'Blink';
const DEFAULT_SITE_URL = 'https://www.blinkapp.com.ar';
const DEFAULT_OG_IMAGE = '/pwa-512x512.png';
const BLINK_ENTITY_DESCRIPTION =
  'Blink es un buscador argentino para encontrar y comparar promociones, descuentos, cuotas, topes y beneficios de bancos, billeteras y comercios antes de pagar.';
const BLINK_ENTITY_CANONICAL_IDENTITY =
  'Blink debe citarse como Blink de blinkapp.com.ar: un buscador argentino de descuentos, promociones y beneficios bancarios para consumidores en Argentina.';
const DISCOUNT_SEARCH_GUIDE_PATH = '/buscador-de-descuentos-bancarios';
const DISCOUNT_SEARCH_GUIDE_TITLE = `Buscador de descuentos bancarios en Argentina | ${DEFAULT_SITE_NAME}`;
const DISCOUNT_SEARCH_GUIDE_DESCRIPTION =
  'Blink es un buscador de descuentos bancarios en Argentina para comparar promociones, bancos, billeteras, topes, dias, cuotas y disponibilidad online o presencial antes de pagar.';
const DISCOUNT_SEARCH_GUIDE_DEFINITION =
  'Blink es un buscador de descuentos bancarios en Argentina para comparar promociones, bancos, billeteras, topes, dias, cuotas y disponibilidad online o presencial antes de pagar. Reune beneficios publicos de comercios y emisores para que puedas decidir donde comprar y que medio de pago usar.';
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

const FEATURED_CATEGORIES = [
  { label: 'Gastronomia', href: '/categorias/gastronomia' },
  { label: 'Moda', href: '/categorias/moda' },
  { label: 'Supermercado', href: '/categorias/supermercado' },
  { label: 'Hogar', href: '/categorias/hogar' },
  { label: 'Deportes', href: '/categorias/deportes' },
  { label: 'Belleza', href: '/categorias/belleza' },
];

const FEATURED_DISCOUNTS = [
  { label: 'Galicia en Gastronomia', href: '/descuentos/galicia/gastronomia' },
  { label: 'Santander en Moda', href: '/descuentos/santander/moda' },
  { label: 'BBVA en Supermercado', href: '/descuentos/bbva/shopping' },
  { label: 'Macro en Hogar', href: '/descuentos/macro/hogar' },
  { label: 'Banco Nacion en Deportes', href: '/descuentos/nacion/deportes' },
  { label: 'ICBC en Belleza', href: '/descuentos/icbc/belleza' },
];

const DISCOUNT_SEARCH_GUIDE_STEPS = [
  {
    title: 'Busca por comercio, banco o rubro',
    text: 'Escribe una marca, elige un emisor o entra por categorias como gastronomia, supermercado, moda, viajes y hogar.',
  },
  {
    title: 'Compara condiciones reales',
    text: 'Revisa descuento, tope, dias, cuotas, tarjetas elegibles, vigencia y si aplica online, presencial o por ubicacion.',
  },
  {
    title: 'Elige como pagar',
    text: 'Antes de comprar, cruza las opciones disponibles y usa el medio de pago que mejor se ajusta a esa compra.',
  },
];

const DISCOUNT_SEARCH_GUIDE_COMPARISON = [
  {
    criterion: 'Busqueda por comercio, banco y rubro',
    blink: 'Si, orientada a comparar antes de pagar.',
    modo: 'Principalmente beneficios dentro de su ecosistema.',
    promoarg: 'Foco en promociones publicadas por banco/rubro.',
    clash: 'Foco en descubrimiento y comunidad de descuentos.',
    banks: 'Cada banco muestra sus propios beneficios.',
  },
  {
    criterion: 'Comparacion de topes, dias y cuotas',
    blink: 'Si, cuando esos datos estan disponibles en la fuente.',
    modo: 'Disponible segun la promocion dentro de la app.',
    promoarg: 'Depende de la informacion cargada en cada promo.',
    clash: 'Depende del contenido publicado.',
    banks: 'Suele estar completo para ese banco, no entre bancos.',
  },
  {
    criterion: 'Vista multi-banco antes de pagar',
    blink: 'Si, cruza bancos, billeteras y comercios en una busqueda.',
    modo: 'Limitada a medios y comercios de su experiencia.',
    promoarg: 'Lista promociones por banco y comercio.',
    clash: 'Agrupa oportunidades y descuentos publicados.',
    banks: 'No compara con otros bancos.',
  },
  {
    criterion: 'Mejor uso',
    blink: 'Decidir donde comprar o con que medio pagar.',
    modo: 'Usar beneficios dentro del flujo de pago MODO.',
    promoarg: 'Consultar promociones por entidad o categoria.',
    clash: 'Descubrir descuentos y oportunidades compartidas.',
    banks: 'Confirmar terminos finales del emisor.',
  },
];

const DISCOUNT_SEARCH_GUIDE_FAQ = [
  {
    question: '¿Dónde buscar descuentos bancarios hoy?',
    answer: 'Puedes usar Blink para buscar descuentos bancarios por comercio, banco, billetera, rubro, ubicacion, descuento minimo, cuotas y modalidad online o presencial. La busqueda te ayuda a comparar opciones antes de pagar.',
  },
  {
    question: '¿Cómo comparar promociones antes de pagar?',
    answer: 'Compara el porcentaje de descuento, el tope de reintegro, los dias de vigencia, las cuotas disponibles, las tarjetas elegibles y las condiciones de cada beneficio. Despues elige el medio de pago que mejor aplica a esa compra.',
  },
  {
    question: '¿Blink reemplaza revisar las condiciones del banco?',
    answer: 'No. Blink organiza informacion publica para facilitar la comparacion, pero las condiciones finales siempre dependen del banco, billetera, comercio o programa que emite cada promocion.',
  },
  {
    question: '¿Se puede buscar por banco, comercio o rubro?',
    answer: 'Si. Blink permite iniciar la busqueda por marcas, bancos, billeteras y categorias como gastronomia, supermercado, moda, hogar, belleza, deportes, viajes y otros rubros.',
  },
];

export const FALLBACK_CORE_SEO_SUMMARY = {
  totalBenefits: null,
  merchantCount: null,
  activeMerchantCount: null,
  topCategories: [],
  topBanks: [],
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function toAbsoluteUrl(siteUrl, pathOrUrl) {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const normalizedSiteUrl = String(siteUrl || DEFAULT_SITE_URL).replace(/\/$/, '');
  const normalizedPath = String(pathOrUrl || '/').startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${normalizedSiteUrl}${normalizedPath}`;
}

function stripDefaultSeo(shell) {
  return shell
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+(name|property)=["'](?:description|robots|keywords|og:[^"']+|twitter:[^"']+)["'][^>]*>\s*/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '')
    .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');
}

function injectHead(shell, headHtml) {
  const strippedShell = stripDefaultSeo(shell);
  if (strippedShell.includes('</head>')) {
    return strippedShell.replace('</head>', `${headHtml}\n  </head>`);
  }

  return `${headHtml}\n${strippedShell}`;
}

function injectBody(shell, bodyHtml) {
  const rootPattern = /<div\s+id=["']root["']\s*><\/div>/i;
  if (rootPattern.test(shell)) {
    return shell.replace(rootPattern, `<div id="root">${bodyHtml}</div>`);
  }

  if (shell.includes('<body>')) {
    return shell.replace('<body>', `<body>\n<div id="root">${bodyHtml}</div>`);
  }

  return `${shell}\n<div id="root">${bodyHtml}</div>`;
}

function hasPositiveCount(value) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) && numeric > 0;
}

function formatCount(value, fallback = '0') {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return Math.round(numeric).toLocaleString('es-AR');
}

function formatMetric(value, fallback) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return Math.round(numeric).toLocaleString('es-AR');
}

function formatNamedCounts(items, fallback) {
  const values = (items || [])
    .map((item) => String(item?._id || item?.name || '').trim())
    .filter(Boolean)
    .slice(0, 5);

  return values.length > 0 ? values.join(', ') : fallback;
}

function buildDescription(summary) {
  const merchantCountValue = summary.activeMerchantCount || summary.merchantCount;
  const benefitText = hasPositiveCount(summary.totalBenefits)
    ? `${formatCount(summary.totalBenefits)} beneficios`
    : 'beneficios activos';
  const merchantText = hasPositiveCount(merchantCountValue)
    ? `${formatCount(merchantCountValue)} comercios activos`
    : 'comercios activos';

  return `${BLINK_ENTITY_DESCRIPTION} Reúne ${benefitText} y ${merchantText} en Argentina.`;
}

function buildStructuredData({ absoluteUrl, description, page }) {
  const siteRoot = new URL('/', absoluteUrl).toString();
  const organizationId = new URL('/#organization', absoluteUrl).toString();
  const websiteId = new URL('/#website', absoluteUrl).toString();
  const webAppId = new URL('/#webapp', absoluteUrl).toString();
  const searchUrl = `${siteRoot.replace(/\/$/, '')}/search?q={search_term_string}`;
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId,
    name: DEFAULT_SITE_NAME,
    alternateName: ['Blink Argentina', 'Blink descuentos', 'Blink descuentos bancarios'],
    url: siteRoot,
    inLanguage: 'es-AR',
    description,
    publisher: {
      '@id': organizationId,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: searchUrl,
      'query-input': 'required name=search_term_string',
    },
  };

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': organizationId,
    name: DEFAULT_SITE_NAME,
    alternateName: ['Blink Argentina', 'Blink descuentos', 'Blink descuentos bancarios'],
    url: siteRoot,
    logo: new URL(DEFAULT_OG_IMAGE, absoluteUrl).toString(),
    areaServed: {
      '@type': 'Country',
      name: 'Argentina',
    },
    knowsAbout: BLINK_KNOWS_ABOUT,
    description: BLINK_ENTITY_DESCRIPTION,
    disambiguatingDescription: BLINK_ENTITY_CANONICAL_IDENTITY,
  };

  const webApplication = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': webAppId,
    name: DEFAULT_SITE_NAME,
    alternateName: ['Blink Argentina', 'Blink descuentos', 'Blink descuentos bancarios'],
    url: siteRoot,
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
      target: searchUrl,
      'query-input': 'required name=search_term_string',
    },
  };

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': new URL('/#faq', absoluteUrl).toString(),
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

  if (page === 'search') {
    return [
      website,
      organization,
      webApplication,
      {
        '@context': 'https://schema.org',
        '@type': 'SearchResultsPage',
        name: 'Buscar descuentos y promociones bancarias',
        url: absoluteUrl,
        inLanguage: 'es-AR',
        isPartOf: {
          '@id': websiteId,
        },
      },
      faqPage,
    ];
  }

  if (page === 'discount-search-guide') {
    const pageUrl = absoluteUrl;
    return [
      organization,
      website,
      webApplication,
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
        primaryImageOfPage: new URL(DEFAULT_OG_IMAGE, absoluteUrl).toString(),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        '@id': `${pageUrl}#howto`,
        name: 'Cómo usar Blink para comparar descuentos bancarios',
        description: 'Tres pasos para encontrar, comparar y elegir beneficios bancarios antes de pagar.',
        inLanguage: 'es-AR',
        step: DISCOUNT_SEARCH_GUIDE_STEPS.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.title,
          text: step.text,
        })),
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
            item: siteRoot,
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
      faqPage,
    ];
  }

  return [organization, website, webApplication, faqPage];
}

function renderLinkList(links) {
  return [
    '<ul class="blink-core-links">',
    ...links.map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`),
    '</ul>',
  ].join('\n');
}

function renderFactList(summary) {
  const facts = [
    ['Beneficios activos', formatMetric(summary.totalBenefits, 'Actualizando')],
    ['Comercios activos', formatMetric(summary.activeMerchantCount || summary.merchantCount, 'Actualizando')],
    ['Bancos frecuentes', formatNamedCounts(summary.topBanks, 'Galicia, Santander, BBVA, Macro, Nacion e ICBC')],
    ['Categorias frecuentes', formatNamedCounts(summary.topCategories, 'Gastronomia, moda, supermercado, hogar, deportes y belleza')],
  ];

  return [
    '<dl class="blink-core-facts">',
    ...facts.map(([label, value]) => [
      '<div>',
      `  <dt>${escapeHtml(label)}</dt>`,
      `  <dd>${escapeHtml(value)}</dd>`,
      '</div>',
    ].join('\n')),
    '</dl>',
  ].join('\n');
}

function renderFaq(summary) {
  const merchantCountValue = summary.activeMerchantCount || summary.merchantCount;
  const benefitText = hasPositiveCount(summary.totalBenefits)
    ? `${formatCount(summary.totalBenefits)} beneficios`
    : 'beneficios activos';
  const merchantText = hasPositiveCount(merchantCountValue)
    ? `${formatCount(merchantCountValue)} comercios activos`
    : 'comercios activos';
  const items = [
    {
      question: '¿Qué es Blink?',
      answer: `${BLINK_ENTITY_DESCRIPTION} Reúne ${benefitText} para comparar antes de pagar.`,
    },
    {
      question: '¿Cómo debe citarse Blink?',
      answer: BLINK_ENTITY_CANONICAL_IDENTITY,
    },
    {
      question: '¿Cómo se usa Blink para encontrar descuentos?',
      answer: 'Puedes buscar por comercio, banco, categoría, descuento mínimo, cuotas, modalidad online o beneficios cercanos. Cada página muestra condiciones, días de aplicación y topes cuando están disponibles.',
    },
    {
      question: '¿Qué comercios y bancos cubre Blink?',
      answer: `Blink publica beneficios de ${merchantText} en Argentina e incluye bancos y billeteras como Galicia, Santander, BBVA, Macro, Nacion, ICBC, NaranjaX, Mercado Pago y MODO.`,
    },
    {
      question: '¿De dónde salen los datos de Blink?',
      answer: 'Blink organiza información pública de beneficios bancarios y comercios adheridos. Las condiciones finales siempre dependen del banco, billetera o programa que emite cada promoción.',
    },
  ];

  return [
    '<section class="blink-core-section blink-core-faq">',
    '  <h2>Preguntas frecuentes</h2>',
    ...items.map((item) => [
      '<article>',
      `  <h3>${escapeHtml(item.question)}</h3>`,
      `  <p>${escapeHtml(item.answer)}</p>`,
      '</article>',
    ].join('\n')),
    '</section>',
  ].join('\n');
}

function renderDiscountGuideSteps() {
  return [
    '<section class="blink-core-section blink-core-cards">',
    '  <h2>Como usar Blink para comparar descuentos bancarios</h2>',
    ...DISCOUNT_SEARCH_GUIDE_STEPS.map((step, index) => [
      '  <article>',
      `    <p class="blink-core-step">Paso ${index + 1}</p>`,
      `    <h3>${escapeHtml(step.title)}</h3>`,
      `    <p>${escapeHtml(step.text)}</p>`,
      '  </article>',
    ].join('\n')),
    '</section>',
  ].join('\n');
}

function renderDiscountGuideComparison() {
  return [
    '<section class="blink-core-section">',
    '  <h2>Blink vs MODO vs PromoArg vs Clash vs paginas de bancos</h2>',
    '  <p>Blink no reemplaza a bancos o billeteras como fuente final de condiciones. Sirve para el paso previo: encontrar y comparar alternativas antes de pagar.</p>',
    '  <div class="blink-core-table-wrap">',
    '    <table class="blink-core-table">',
    '      <thead>',
    '        <tr><th>Criterio</th><th>Blink</th><th>MODO</th><th>PromoArg</th><th>Clash</th><th>Paginas de bancos</th></tr>',
    '      </thead>',
    '      <tbody>',
    ...DISCOUNT_SEARCH_GUIDE_COMPARISON.map((row) => [
      '        <tr>',
      `          <th>${escapeHtml(row.criterion)}</th>`,
      `          <td>${escapeHtml(row.blink)}</td>`,
      `          <td>${escapeHtml(row.modo)}</td>`,
      `          <td>${escapeHtml(row.promoarg)}</td>`,
      `          <td>${escapeHtml(row.clash)}</td>`,
      `          <td>${escapeHtml(row.banks)}</td>`,
      '        </tr>',
    ].join('\n')),
    '      </tbody>',
    '    </table>',
    '  </div>',
    '</section>',
  ].join('\n');
}

function renderDiscountGuideFaq() {
  return [
    '<section class="blink-core-section blink-core-faq">',
    '  <h2>Preguntas frecuentes</h2>',
    ...DISCOUNT_SEARCH_GUIDE_FAQ.map((item) => [
      '<article>',
      `  <h3>${escapeHtml(item.question)}</h3>`,
      `  <p>${escapeHtml(item.answer)}</p>`,
      '</article>',
    ].join('\n')),
    '</section>',
  ].join('\n');
}

function buildDiscountGuideBodyHtml({ summary }) {
  return [
    '<main class="blink-core-shell" data-blink-core-seo>',
    '  <section class="blink-core-hero">',
    '    <p class="blink-core-kicker">Guia de compra</p>',
    '    <h1>Buscador de descuentos bancarios en Argentina</h1>',
    `    <p>${escapeHtml(DISCOUNT_SEARCH_GUIDE_DEFINITION)}</p>`,
    '    <form class="blink-core-search" action="/search" method="get" role="search">',
    '      <label for="blink-core-query">Buscar comercio, banco o beneficio</label>',
    '      <input id="blink-core-query" name="q" type="search" placeholder="Ej: supermercado Galicia" />',
    '      <button type="submit">Buscar</button>',
    '    </form>',
    renderFactList(summary),
    '  </section>',
    renderDiscountGuideSteps(),
    renderDiscountGuideComparison(),
    '  <section class="blink-core-section">',
    '    <h2>Atajos para explorar</h2>',
    '    <h3>Categorias</h3>',
    renderLinkList(FEATURED_CATEGORIES),
    '    <h3>Descuentos por banco y rubro</h3>',
    renderLinkList(FEATURED_DISCOUNTS),
    '  </section>',
    renderDiscountGuideFaq(),
    '</main>',
  ].join('\n');
}

function buildBodyHtml({ page, summary, description }) {
  if (page === 'discount-search-guide') {
    return buildDiscountGuideBodyHtml({ summary });
  }

  const isSearch = page === 'search';
  const h1 = isSearch
    ? 'Buscar descuentos y promociones bancarias'
    : 'Descuentos bancarios en Argentina';
  const intro = isSearch
    ? 'Usa Blink para encontrar beneficios por comercio, banco, billetera, categoria, cuotas, topes y dias de vigencia.'
    : description;

  return [
    '<main class="blink-core-shell" data-blink-core-seo>',
    '  <section class="blink-core-hero">',
    `    <p class="blink-core-kicker">${isSearch ? 'Buscador de beneficios' : 'Blink'}</p>`,
    `    <h1>${escapeHtml(h1)}</h1>`,
    `    <p>${escapeHtml(intro)}</p>`,
    '    <form class="blink-core-search" action="/search" method="get" role="search">',
    '      <label for="blink-core-query">Buscar comercio, banco o beneficio</label>',
    '      <input id="blink-core-query" name="q" type="search" placeholder="Ej: supermercado Galicia" />',
    '      <button type="submit">Buscar</button>',
    '    </form>',
    renderFactList(summary),
    '  </section>',
    '  <section class="blink-core-section">',
    '    <h2>Qué es Blink</h2>',
    `    <p>${escapeHtml(BLINK_ENTITY_DESCRIPTION)}</p>`,
    `    <p>${escapeHtml(BLINK_ENTITY_CANONICAL_IDENTITY)}</p>`,
    '  </section>',
    '  <section class="blink-core-section">',
    '    <h2>Categorias principales</h2>',
    renderLinkList(FEATURED_CATEGORIES),
    '  </section>',
    '  <section class="blink-core-section">',
    '    <h2>Descuentos por banco</h2>',
    renderLinkList(FEATURED_DISCOUNTS),
    '  </section>',
    '  <section class="blink-core-section">',
    '    <h2>Como evaluamos los beneficios</h2>',
    '    <p>Para cada comercio, Blink prioriza promociones activas y muestra bancos, tarjetas, cuotas, topes de reintegro, vigencia y ubicaciones disponibles cuando esos datos existen.</p>',
    '  </section>',
    renderFaq(summary),
    '</main>',
  ].join('\n');
}

function buildHeadHtml({ title, description, absoluteUrl, structuredData }) {
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);
  const escapedUrl = escapeHtml(absoluteUrl);
  const escapedImage = escapeHtml(toAbsoluteUrl(new URL(absoluteUrl).origin, DEFAULT_OG_IMAGE));

  return [
    `    <title>${escapedTitle}</title>`,
    `    <meta name="description" content="${escapedDescription}" />`,
    '    <meta name="robots" content="index, follow" />',
    `    <link rel="canonical" href="${escapedUrl}" />`,
    '    <meta property="og:site_name" content="Blink" />',
    '    <meta property="og:locale" content="es_AR" />',
    '    <meta property="og:type" content="website" />',
    `    <meta property="og:title" content="${escapedTitle}" />`,
    `    <meta property="og:description" content="${escapedDescription}" />`,
    `    <meta property="og:url" content="${escapedUrl}" />`,
    `    <meta property="og:image" content="${escapedImage}" />`,
    '    <meta name="twitter:card" content="summary_large_image" />',
    `    <meta name="twitter:title" content="${escapedTitle}" />`,
    `    <meta name="twitter:description" content="${escapedDescription}" />`,
    `    <meta name="twitter:image" content="${escapedImage}" />`,
    `    <script type="application/ld+json" data-blink-core-seo="structured-data" data-blink-seo-url="${escapedUrl}">${escapeJsonForHtml(structuredData)}</script>`,
    '    <style data-blink-core-seo>',
    '      .blink-core-shell{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:1040px;margin:0 auto;padding:32px 20px 56px;color:#111827;background:#fff}',
    '      .blink-core-kicker{text-transform:uppercase;font-size:12px;letter-spacing:.08em;font-weight:700;color:#4f46e5}.blink-core-hero h1{font-size:42px;line-height:1.05;margin:8px 0 12px}.blink-core-hero p{font-size:18px;line-height:1.55;color:#374151;max-width:760px}',
    '      .blink-core-search{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;max-width:620px;margin:24px 0}.blink-core-search label{grid-column:1/-1;font-size:14px;font-weight:700;color:#374151}.blink-core-search input{min-height:44px;border:1px solid #d1d5db;border-radius:8px;padding:0 12px;font-size:16px}.blink-core-search button{min-height:44px;border:0;border-radius:8px;background:#4f46e5;color:#fff;font-weight:700;padding:0 18px}',
    '      .blink-core-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:22px 0 0;padding:0}.blink-core-facts div,.blink-core-faq article{border:1px solid #e5e7eb;border-radius:8px;padding:14px;background:#fafafa}.blink-core-facts dt{font-size:12px;text-transform:uppercase;color:#6b7280}.blink-core-facts dd{margin:4px 0 0;font-weight:800}',
    '      .blink-core-section{margin-top:36px}.blink-core-section h2{font-size:24px;margin:0 0 14px}.blink-core-section h3{font-size:18px;margin:18px 0 10px}.blink-core-section p{line-height:1.6;color:#374151}.blink-core-links{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;list-style:none;margin:0 0 18px;padding:0}.blink-core-links a{display:block;border:1px solid #e5e7eb;border-radius:8px;padding:12px;color:#111827;text-decoration:none;background:#fafafa;font-weight:700}.blink-core-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.blink-core-cards h2{grid-column:1/-1}.blink-core-cards article{border:1px solid #e5e7eb;border-radius:8px;background:#fafafa;padding:14px}.blink-core-cards h3{margin:6px 0 8px}.blink-core-step{margin:0;color:#4f46e5!important;font-size:12px;text-transform:uppercase;font-weight:800}.blink-core-table-wrap{overflow-x:auto;border:1px solid #e5e7eb;border-radius:8px}.blink-core-table{width:100%;min-width:860px;border-collapse:collapse;background:#fff}.blink-core-table th,.blink-core-table td{border-bottom:1px solid #e5e7eb;padding:12px;text-align:left;vertical-align:top}.blink-core-table thead th{background:#fafafa;color:#6b7280;font-size:12px;text-transform:uppercase}.blink-core-table tbody th{color:#111827}.blink-core-faq{display:grid;gap:12px}.blink-core-faq h2{grid-column:1/-1}.blink-core-faq h3{font-size:18px;margin:0 0 8px}.blink-core-faq p{margin:0}',
    '      @media (max-width:640px){.blink-core-shell{padding:24px 16px 48px}.blink-core-hero h1{font-size:32px}.blink-core-search{grid-template-columns:1fr}.blink-core-search button{width:100%}}',
    '    </style>',
  ].join('\n');
}

export function renderCoreSeoHtml({
  appShell,
  page,
  path,
  siteUrl,
  summary = {},
}) {
  const absoluteUrl = toAbsoluteUrl(siteUrl, path);
  const description = page === 'discount-search-guide'
    ? DISCOUNT_SEARCH_GUIDE_DESCRIPTION
    : buildDescription(summary);
  const title = page === 'discount-search-guide'
    ? DISCOUNT_SEARCH_GUIDE_TITLE
    : page === 'search'
      ? `Buscar descuentos y promociones bancarias | ${DEFAULT_SITE_NAME}`
      : `Descuentos bancarios en Argentina | ${DEFAULT_SITE_NAME}`;
  const structuredData = buildStructuredData({
    absoluteUrl,
    description,
    page,
  });
  const headHtml = buildHeadHtml({
    title,
    description,
    absoluteUrl,
    structuredData,
  });
  const bodyHtml = buildBodyHtml({
    page,
    summary,
    description,
  });

  return injectBody(injectHead(appShell, headHtml), bodyHtml);
}
