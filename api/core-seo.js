const DEFAULT_SITE_NAME = 'Blink';
const DEFAULT_SITE_URL = 'https://www.blinkapp.com.ar';
const DEFAULT_OG_IMAGE = '/pwa-512x512.png';

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

  return `Blink es un buscador de descuentos bancarios en Argentina con ${benefitText} y ${merchantText}. Compara bancos, billeteras, cuotas, dias de vigencia y topes antes de pagar.`;
}

function buildStructuredData({ absoluteUrl, description, page }) {
  const searchUrl = new URL('/search?q={search_term_string}', absoluteUrl).toString();
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: DEFAULT_SITE_NAME,
    url: new URL('/', absoluteUrl).toString(),
    inLanguage: 'es-AR',
    description,
    potentialAction: {
      '@type': 'SearchAction',
      target: searchUrl,
      'query-input': 'required name=search_term_string',
    },
  };

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: DEFAULT_SITE_NAME,
    url: new URL('/', absoluteUrl).toString(),
    logo: new URL(DEFAULT_OG_IMAGE, absoluteUrl).toString(),
  };

  if (page === 'search') {
    return [
      website,
      organization,
      {
        '@context': 'https://schema.org',
        '@type': 'SearchResultsPage',
        name: 'Buscar descuentos y promociones bancarias',
        url: absoluteUrl,
        inLanguage: 'es-AR',
        isPartOf: website,
      },
    ];
  }

  return [organization, website];
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
      question: 'Que es Blink?',
      answer: `Blink es un buscador argentino de descuentos, cuotas y beneficios de bancos, billeteras, clubes y suscripciones. Reune ${benefitText} para comparar antes de pagar.`,
    },
    {
      question: 'Como se usa Blink para encontrar descuentos?',
      answer: 'Puedes buscar por comercio, banco, categoria, descuento minimo, cuotas, modalidad online o beneficios cercanos. Cada pagina muestra condiciones, dias de aplicacion y topes cuando estan disponibles.',
    },
    {
      question: 'Que comercios y bancos cubre Blink?',
      answer: `Blink publica beneficios de ${merchantText} en Argentina e incluye bancos y billeteras como Galicia, Santander, BBVA, Macro, Nacion, ICBC, NaranjaX, Mercado Pago y MODO.`,
    },
    {
      question: 'De donde salen los datos de Blink?',
      answer: 'Blink organiza informacion publica de beneficios bancarios y comercios adheridos. Las condiciones finales siempre dependen del banco, billetera o programa que emite cada promocion.',
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

function buildBodyHtml({ page, summary, description }) {
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
    '      .blink-core-section{margin-top:36px}.blink-core-section h2{font-size:24px;margin:0 0 14px}.blink-core-section p{line-height:1.6;color:#374151}.blink-core-links{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;list-style:none;margin:0;padding:0}.blink-core-links a{display:block;border:1px solid #e5e7eb;border-radius:8px;padding:12px;color:#111827;text-decoration:none;background:#fafafa;font-weight:700}.blink-core-faq{display:grid;gap:12px}.blink-core-faq h2{grid-column:1/-1}.blink-core-faq h3{font-size:18px;margin:0 0 8px}.blink-core-faq p{margin:0}',
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
  const description = buildDescription(summary);
  const title = page === 'search'
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
