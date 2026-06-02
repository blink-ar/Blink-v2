import {
  getCategorySeoPath,
  resolveSeoCategory,
} from './category-seo-data.js';
import {
  getMerchantSeoPathFromMerchant,
  readViteAppShell,
} from './merchant-seo.js';

const DEFAULT_SITE_NAME = 'Blink';
const DEFAULT_SITE_URL = 'https://www.blinkapp.com.ar';
const DEFAULT_OG_IMAGE = '/pwa-512x512.png';
const CATEGORY_PAGE_SIZE = 100;

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

function getMerchantBanks(merchant) {
  const banks = Array.isArray(merchant?.banks) ? merchant.banks : [];
  return banks.filter(Boolean).slice(0, 4).join(', ') || 'bancos participantes';
}

function getMerchantLocation(merchant) {
  const locations = Array.isArray(merchant?.locations) ? merchant.locations : [];
  const firstLocation = locations[0];
  const components = firstLocation?.addressComponents || {};
  return components.locality ||
    components.sublocality ||
    components.adminAreaLevel2 ||
    components.adminAreaLevel1 ||
    firstLocation?.formattedAddress ||
    'Argentina';
}

function getMerchantDiscountText(merchant) {
  const discount = Number(merchant?.maxDiscountPercentage || 0);
  if (Number.isFinite(discount) && discount > 0) {
    return `hasta ${discount}% OFF`;
  }

  return `${Number(merchant?.benefitCount || 0)} beneficios`;
}

function buildDescription(category, total) {
  const countText = total > 0 ? `${total} comercios` : 'comercios';
  return `Explora ${countText} de ${category.label.toLowerCase()} con descuentos y promociones bancarias en Argentina. Encuentra bancos, topes, cuotas y beneficios activos en Blink.`;
}

function buildStructuredData({ category, merchants, absoluteUrl, page, totalPages }) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Comercios de ${category.label} con descuentos`,
      description: `Comercios de ${category.label.toLowerCase()} con beneficios bancarios en Blink.`,
      url: absoluteUrl,
      inLanguage: 'es-AR',
      isPartOf: {
        '@type': 'WebSite',
        name: DEFAULT_SITE_NAME,
        url: new URL('/', absoluteUrl).toString(),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: DEFAULT_SITE_NAME,
          item: new URL('/', absoluteUrl).toString(),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Categorias',
          item: new URL('/categorias', absoluteUrl).toString(),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: category.label,
          item: absoluteUrl,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Comercios de ${category.label}`,
      numberOfItems: merchants.length,
      itemListElement: merchants.map((merchant, index) => ({
        '@type': 'ListItem',
        position: ((page - 1) * CATEGORY_PAGE_SIZE) + index + 1,
        name: merchant.merchantName,
        url: new URL(getMerchantSeoPathFromMerchant(merchant), absoluteUrl).toString(),
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Pagina ${page} de ${totalPages} de ${category.label}`,
      url: absoluteUrl,
    },
  ];
}

function renderMerchantLinks(merchants) {
  if (merchants.length === 0) {
    return '<p class="blink-category-empty">Todavia no hay comercios publicados para esta categoria.</p>';
  }

  return [
    '<ol class="blink-category-list">',
    ...merchants.map((merchant) => {
      const href = getMerchantSeoPathFromMerchant(merchant);
      return [
        '<li class="blink-category-card">',
        `  <a href="${escapeHtml(href)}">`,
        `    <strong>${escapeHtml(merchant.merchantName || 'Comercio')}</strong>`,
        `    <span>${escapeHtml(getMerchantDiscountText(merchant))}</span>`,
        `    <small>${escapeHtml(getMerchantBanks(merchant))} · ${escapeHtml(getMerchantLocation(merchant))}</small>`,
        '  </a>',
        '</li>',
      ].join('\n');
    }),
    '</ol>',
  ].join('\n');
}

function renderPagination({ category, page, totalPages }) {
  if (totalPages <= 1) return '';

  const previousPage = page > 1
    ? `<a href="${escapeHtml(getCategorySeoPath(category, page - 1))}" rel="prev">Anterior</a>`
    : '<span>Anterior</span>';
  const nextPage = page < totalPages
    ? `<a href="${escapeHtml(getCategorySeoPath(category, page + 1))}" rel="next">Siguiente</a>`
    : '<span>Siguiente</span>';

  return [
    '<nav class="blink-category-pagination" aria-label="Paginacion de comercios">',
    previousPage,
    `<span>Pagina ${page} de ${totalPages}</span>`,
    nextPage,
    '</nav>',
  ].join('\n');
}

function buildBodyHtml({ category, merchants, total, page, totalPages }) {
  const searchPath = `/search?category=${encodeURIComponent(category.category)}`;

  return [
    '<main class="blink-category-shell" data-blink-category-seo>',
    '  <nav class="blink-category-breadcrumb" aria-label="Breadcrumb"><a href="/">Blink</a><span>/</span><span>Categorias</span><span>/</span><span>' + escapeHtml(category.label) + '</span></nav>',
    '  <section class="blink-category-hero">',
    '    <p class="blink-category-kicker">Comercios por categoria</p>',
    `    <h1>Comercios de ${escapeHtml(category.label)} con descuentos</h1>`,
    `    <p>${escapeHtml(buildDescription(category, total))}</p>`,
    `    <a class="blink-category-search" href="${escapeHtml(searchPath)}">Ver ${escapeHtml(category.label.toLowerCase())} con filtros</a>`,
    '  </section>',
    '  <section class="blink-category-section">',
    `    <h2>${escapeHtml(total.toLocaleString('es-AR'))} comercios encontrados</h2>`,
    renderMerchantLinks(merchants),
    renderPagination({ category, page, totalPages }),
    '  </section>',
    '</main>',
  ].join('\n');
}

function buildHeadHtml({ title, description, absoluteUrl, structuredData, previousUrl, nextUrl }) {
  const links = [
    `    <link rel="canonical" href="${escapeHtml(absoluteUrl)}" />`,
    previousUrl ? `    <link rel="prev" href="${escapeHtml(previousUrl)}" />` : '',
    nextUrl ? `    <link rel="next" href="${escapeHtml(nextUrl)}" />` : '',
  ].filter(Boolean);

  return [
    `    <title>${escapeHtml(title)}</title>`,
    `    <meta name="description" content="${escapeHtml(description)}" />`,
    '    <meta name="robots" content="index, follow" />',
    ...links,
    '    <meta property="og:site_name" content="Blink" />',
    '    <meta property="og:locale" content="es_AR" />',
    '    <meta property="og:type" content="website" />',
    `    <meta property="og:title" content="${escapeHtml(title)}" />`,
    `    <meta property="og:description" content="${escapeHtml(description)}" />`,
    `    <meta property="og:url" content="${escapeHtml(absoluteUrl)}" />`,
    `    <meta property="og:image" content="${escapeHtml(toAbsoluteUrl(new URL(absoluteUrl).origin, DEFAULT_OG_IMAGE))}" />`,
    '    <meta name="twitter:card" content="summary_large_image" />',
    `    <meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `    <meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `    <script type="application/ld+json" data-blink-category-seo="structured-data" data-blink-seo-url="${escapeHtml(absoluteUrl)}">${escapeJsonForHtml(structuredData)}</script>`,
    '    <style data-blink-category-seo>',
    '      .blink-category-shell{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:1040px;margin:0 auto;padding:32px 20px 56px;color:#111827;background:#fff}',
    '      .blink-category-breadcrumb{display:flex;gap:8px;flex-wrap:wrap;font-size:14px;margin-bottom:32px;color:#4b5563}.blink-category-breadcrumb a{color:#111827}',
    '      .blink-category-kicker{text-transform:uppercase;font-size:12px;letter-spacing:.08em;font-weight:700;color:#4f46e5}.blink-category-hero h1{font-size:40px;line-height:1.05;margin:8px 0 12px}.blink-category-hero p{font-size:18px;line-height:1.55;color:#374151}.blink-category-search{display:inline-flex;margin-top:12px;color:#4f46e5;font-weight:700}',
    '      .blink-category-section{margin-top:36px}.blink-category-section h2{font-size:24px;margin:0 0 14px}.blink-category-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;list-style:none;margin:0;padding:0}.blink-category-card a{display:block;border:1px solid #e5e7eb;border-radius:8px;padding:14px;background:#fafafa;color:#111827;text-decoration:none}.blink-category-card strong{display:block;font-size:18px}.blink-category-card span,.blink-category-card small{display:block;margin-top:5px;color:#4b5563}.blink-category-card small{font-size:12px}.blink-category-empty{color:#6b7280}',
    '      .blink-category-pagination{display:flex;align-items:center;justify-content:center;gap:18px;margin-top:28px}.blink-category-pagination a,.blink-category-pagination span{font-weight:700;color:#4f46e5}.blink-category-pagination span{color:#6b7280}',
    '      @media (max-width:640px){.blink-category-shell{padding:24px 16px 48px}.blink-category-hero h1{font-size:32px}}',
    '    </style>',
  ].join('\n');
}

export function renderCategorySeoHtml({
  appShell,
  category,
  merchants,
  total,
  page,
  path,
  siteUrl,
}) {
  const totalPages = Math.max(1, Math.ceil(total / CATEGORY_PAGE_SIZE));
  const absoluteUrl = toAbsoluteUrl(siteUrl, path);
  const title = page > 1
    ? `Comercios de ${category.label} con descuentos - pagina ${page} | ${DEFAULT_SITE_NAME}`
    : `Comercios de ${category.label} con descuentos | ${DEFAULT_SITE_NAME}`;
  const description = buildDescription(category, total);
  const previousUrl = page > 1 ? toAbsoluteUrl(siteUrl, getCategorySeoPath(category, page - 1)) : '';
  const nextUrl = page < totalPages ? toAbsoluteUrl(siteUrl, getCategorySeoPath(category, page + 1)) : '';
  const structuredData = buildStructuredData({
    category,
    merchants,
    absoluteUrl,
    page,
    totalPages,
  });
  const headHtml = buildHeadHtml({
    title,
    description,
    absoluteUrl,
    structuredData,
    previousUrl,
    nextUrl,
  });
  const bodyHtml = buildBodyHtml({
    category,
    merchants,
    total,
    page,
    totalPages,
  });

  return injectBody(injectHead(appShell, headHtml), bodyHtml);
}

export async function loadCategorySeoData({ db, merchantCollectionName, category, page }) {
  const safePage = Math.max(1, Number.parseInt(String(page || 1), 10) || 1);
  const query = {
    isActive: { $ne: false },
    merchantId: { $exists: true, $type: 'string' },
    benefitCount: { $gt: 0 },
    categories: { $in: [category.category] },
  };
  const projection = {
    _id: 0,
    merchantId: 1,
    merchantName: 1,
    categories: 1,
    banks: 1,
    locations: 1,
    benefitCount: 1,
    activeBenefitCount: 1,
    maxDiscountPercentage: 1,
  };

  const collection = db.collection(merchantCollectionName);
  const total = await collection.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(total / CATEGORY_PAGE_SIZE));
  if (safePage > totalPages && total > 0) {
    return { total, totalPages, merchants: [], page: safePage, outOfRange: true };
  }

  const merchants = await collection
    .find(query, { projection })
    .sort({ activeBenefitCount: -1, benefitCount: -1, merchantName: 1 })
    .skip((safePage - 1) * CATEGORY_PAGE_SIZE)
    .limit(CATEGORY_PAGE_SIZE)
    .toArray();

  return {
    total,
    totalPages,
    merchants,
    page: safePage,
    outOfRange: false,
  };
}

export {
  CATEGORY_PAGE_SIZE,
  getCategorySeoPath,
  readViteAppShell,
  resolveSeoCategory,
};
