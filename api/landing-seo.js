import {
  compactLandingBankName,
  getLandingCategoryMatchValues,
  getLandingSeoPath,
  normalizeLandingSearchText,
  resolveLandingBankFromMerchants,
  resolveLandingCategoryFromMerchants,
  resolveLandingCityFromMerchants,
  resolveLandingBank,
  resolveLandingCategory,
  resolveLandingCity,
} from './landing-seo-data.js';
import {
  getMerchantSeoPathFromMerchant,
  readViteAppShell,
} from './merchant-seo.js';

const DEFAULT_SITE_NAME = 'Blink';
const DEFAULT_SITE_URL = 'https://www.blinkapp.com.ar';
const DEFAULT_OG_IMAGE = '/pwa-512x512.png';
const LANDING_PAGE_SIZE = 24;
const LANDING_FETCH_LIMIT = 500;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  const count = Number(merchant?.activeBenefitCount || merchant?.benefitCount || 0);
  return count === 1 ? '1 beneficio' : `${count} beneficios`;
}

function collectLocationText(merchant) {
  const parts = [];
  for (const location of Array.isArray(merchant?.locations) ? merchant.locations : []) {
    if (location?.formattedAddress) parts.push(location.formattedAddress);
    if (location?.name) parts.push(location.name);
    if (location?.addressComponents?.locality) parts.push(location.addressComponents.locality);
    if (location?.addressComponents?.adminAreaLevel1) parts.push(location.addressComponents.adminAreaLevel1);
    if (location?.addressComponents?.adminAreaLevel2) parts.push(location.addressComponents.adminAreaLevel2);
    if (typeof location?.raw === 'string') parts.push(location.raw);
    if (location?.raw && typeof location.raw === 'object') parts.push(JSON.stringify(location.raw));
  }

  return parts.map((part) => normalizeLandingSearchText(part));
}

function merchantMatchesCity(merchant, city) {
  if (!city) return true;
  const locationText = collectLocationText(merchant);
  return locationText.some((text) => (
    city.aliases.some((alias) => text.includes(normalizeLandingSearchText(alias)))
  ));
}

function buildDescription({ bank, category, city, resultCount }) {
  const locationText = city ? ` en ${city.name}` : ' en Argentina';
  const countPrefix = resultCount > 0 ? `${resultCount} comercios con ` : '';
  return `Descubri ${countPrefix}descuentos y beneficios de ${bank.name} en ${category.name}${locationText}. Compara bancos, topes y promociones activas en Blink.`;
}

function buildTitle({ bank, category, city }) {
  return `Descuentos ${bank.name} en ${category.name}${city ? ` en ${city.name}` : ''} | ${DEFAULT_SITE_NAME}`;
}

function buildFaqItems({ bank, category, city }) {
  const locationText = city ? ` en ${city.name}` : '';
  return [
    {
      question: `Como encontrar descuentos de ${bank.name} en ${category.name}${locationText}?`,
      answer: `Filtra por ${bank.name} y ${category.name}${locationText} para ver comercios adheridos, condiciones y beneficios vigentes.`,
    },
    {
      question: 'Como saber si un beneficio aplica hoy?',
      answer: 'Revisa la vigencia, los dias de aplicacion y el tope de reintegro en cada beneficio.',
    },
    {
      question: 'Blink sirve para todo Argentina?',
      answer: 'Si. Puedes explorar beneficios por ciudad o a nivel nacional en toda Argentina.',
    },
  ];
}

function buildRelatedLinks({ bank, category, city }) {
  const links = [
    {
      href: `/search?bank=${encodeURIComponent(bank.slug)}&category=${encodeURIComponent(category.slug)}`,
      label: `Ver filtros de ${compactLandingBankName(bank.name)} y ${category.name}`,
    },
  ];

  if (city) {
    links.push({
      href: getLandingSeoPath(bank, category),
      label: `${compactLandingBankName(bank.name)} en ${category.name} a nivel nacional`,
    });
  }

  return links;
}

function buildStructuredData({ bank, category, city, merchants, absoluteUrl, description, faqItems }) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: buildTitle({ bank, category, city }),
      description,
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
          name: 'Descuentos',
          item: new URL('/search', absoluteUrl).toString(),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: `${bank.name} en ${category.name}`,
          item: absoluteUrl,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${bank.name} en ${category.name}${city ? ` en ${city.name}` : ''}`,
      numberOfItems: merchants.length,
      itemListElement: merchants.map((merchant, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: merchant.merchantName,
        url: new URL(getMerchantSeoPathFromMerchant(merchant), absoluteUrl).toString(),
      })),
    },
  ];
}

function renderMerchantLinks(merchants) {
  if (merchants.length === 0) {
    return '<p class="blink-landing-empty">Todavia no hay comercios publicados para esta combinacion.</p>';
  }

  return [
    '<ol class="blink-landing-list">',
    ...merchants.map((merchant) => {
      const href = getMerchantSeoPathFromMerchant(merchant);
      return [
        '<li class="blink-landing-card">',
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

function renderRelatedLinks(links) {
  if (links.length === 0) return '';

  return [
    '<nav class="blink-landing-related" aria-label="Enlaces relacionados">',
    ...links.map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`),
    '</nav>',
  ].join('\n');
}

function buildBodyHtml({ bank, category, city, merchants, resultCount, description, relatedLinks }) {
  return [
    '<main class="blink-landing-shell" data-blink-landing-seo>',
    '  <nav class="blink-landing-breadcrumb" aria-label="Breadcrumb"><a href="/">Blink</a><span>/</span><a href="/search">Descuentos</a><span>/</span><span>' + escapeHtml(bank.name) + '</span><span>/</span><span>' + escapeHtml(category.name) + '</span></nav>',
    '  <section class="blink-landing-hero">',
    '    <p class="blink-landing-kicker">Descuentos</p>',
    `    <h1>Descuentos ${escapeHtml(bank.name)} en ${escapeHtml(category.name)}${city ? ` en ${escapeHtml(city.name)}` : ''}</h1>`,
    `    <p>${escapeHtml(description)}</p>`,
    `    <a class="blink-landing-search" href="/search?bank=${escapeHtml(encodeURIComponent(bank.slug))}&category=${escapeHtml(encodeURIComponent(category.slug))}">Ver en buscador</a>`,
    '  </section>',
    '  <section class="blink-landing-section">',
    `    <h2>${escapeHtml(resultCount.toLocaleString('es-AR'))} comercios encontrados</h2>`,
    renderMerchantLinks(merchants),
    renderRelatedLinks(relatedLinks),
    '  </section>',
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
    `    <script type="application/ld+json" data-blink-landing-seo="structured-data">${escapeJsonForHtml(structuredData)}</script>`,
    '    <style data-blink-landing-seo>',
    '      .blink-landing-shell{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:1040px;margin:0 auto;padding:32px 20px 56px;color:#111827;background:#fff}',
    '      .blink-landing-breadcrumb{display:flex;gap:8px;flex-wrap:wrap;font-size:14px;margin-bottom:32px;color:#4b5563}.blink-landing-breadcrumb a{color:#111827}',
    '      .blink-landing-kicker{text-transform:uppercase;font-size:12px;letter-spacing:.08em;font-weight:700;color:#4f46e5}.blink-landing-hero h1{font-size:40px;line-height:1.05;margin:8px 0 12px}.blink-landing-hero p{font-size:18px;line-height:1.55;color:#374151}.blink-landing-search{display:inline-flex;margin-top:12px;color:#4f46e5;font-weight:700}',
    '      .blink-landing-section{margin-top:36px}.blink-landing-section h2{font-size:24px;margin:0 0 14px}.blink-landing-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;list-style:none;margin:0;padding:0}.blink-landing-card a{display:block;border:1px solid #e5e7eb;border-radius:8px;padding:14px;background:#fafafa;color:#111827;text-decoration:none}.blink-landing-card strong{display:block;font-size:18px}.blink-landing-card span,.blink-landing-card small{display:block;margin-top:5px;color:#4b5563}.blink-landing-card small{font-size:12px}.blink-landing-empty{color:#6b7280}',
    '      .blink-landing-related{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}.blink-landing-related a{font-weight:700;color:#4f46e5}',
    '      @media (max-width:640px){.blink-landing-shell{padding:24px 16px 48px}.blink-landing-hero h1{font-size:32px}}',
    '    </style>',
  ].join('\n');
}

function getBankPatterns(bank) {
  return Array.from(
    new Set([
      bank.slug,
      bank.name,
      compactLandingBankName(bank.name),
      ...(bank.aliases || []),
    ].filter(Boolean))
  ).map((value) => new RegExp(escapeRegex(value), 'i'));
}

export async function loadLandingSeoData({ db, merchantCollectionName, bank, category, city }) {
  const categoryValues = getLandingCategoryMatchValues(category);
  const merchantQuery = {
    isActive: { $ne: false },
    merchantId: { $exists: true, $type: 'string' },
    benefitCount: { $gt: 0 },
    categories: { $in: categoryValues },
    banks: { $in: getBankPatterns(bank) },
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
    searchProfile: 1,
  };
  const collection = db.collection(merchantCollectionName);
  const baseCountPromise = city ? null : collection.countDocuments(merchantQuery);
  const merchants = await collection
    .find(merchantQuery, { projection })
    .sort({ activeBenefitCount: -1, maxDiscountPercentage: -1, benefitCount: -1, merchantName: 1 })
    .limit(city ? LANDING_FETCH_LIMIT : LANDING_PAGE_SIZE)
    .toArray();
  const filteredMerchants = city ? merchants.filter((merchant) => merchantMatchesCity(merchant, city)) : merchants;
  const resultCount = city ? filteredMerchants.length : await baseCountPromise;

  return {
    resultCount,
    merchants: filteredMerchants.slice(0, LANDING_PAGE_SIZE),
  };
}

export function renderLandingSeoHtml({
  appShell,
  bank,
  category,
  city,
  merchants,
  resultCount,
  path,
  siteUrl,
}) {
  const absoluteUrl = toAbsoluteUrl(siteUrl, path);
  const title = buildTitle({ bank, category, city });
  const description = buildDescription({ bank, category, city, resultCount });
  const faqItems = buildFaqItems({ bank, category, city });
  const relatedLinks = buildRelatedLinks({ bank, category, city });
  const structuredData = buildStructuredData({
    bank,
    category,
    city,
    merchants,
    absoluteUrl,
    description,
    faqItems,
  });
  const headHtml = buildHeadHtml({
    title,
    description,
    absoluteUrl,
    structuredData,
  });
  const bodyHtml = buildBodyHtml({
    bank,
    category,
    city,
    merchants,
    resultCount,
    description,
    relatedLinks,
  });

  return injectBody(injectHead(appShell, headHtml), bodyHtml);
}

export {
  getLandingSeoPath,
  readViteAppShell,
  resolveLandingBank,
  resolveLandingBankFromMerchants,
  resolveLandingCategory,
  resolveLandingCategoryFromMerchants,
  resolveLandingCity,
  resolveLandingCityFromMerchants,
};
