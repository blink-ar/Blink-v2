import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugify } from './search/normalize.js';

const MERCHANT_SEO_DELIMITER = '--';
const DEFAULT_SITE_NAME = 'Blink';
const DEFAULT_SITE_URL = 'https://www.blinkapp.com.ar';
const DEFAULT_OG_IMAGE = '/pwa-512x512.png';
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

let cachedAppShell = null;

function formatLocalDateOnly(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

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

function uniqueDisplayStrings(values) {
  const seen = new Set();
  const result = [];

  for (const value of values || []) {
    const normalized = String(value || '').trim();
    if (!normalized) continue;

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function formatList(values, fallback) {
  const items = uniqueDisplayStrings(values);
  if (items.length === 0) return fallback;
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} y ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`;
}

function toAbsoluteUrl(siteUrl, pathOrUrl) {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const normalizedSiteUrl = String(siteUrl || DEFAULT_SITE_URL).replace(/\/$/, '');
  const normalizedPath = String(pathOrUrl || '/').startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${normalizedSiteUrl}${normalizedPath}`;
}

function getMerchantName(merchant) {
  return String(merchant?.merchantName || merchant?.name || 'Comercio').trim() || 'Comercio';
}

function getMerchantCategories(merchant) {
  return uniqueDisplayStrings(Array.isArray(merchant?.categories) ? merchant.categories : [merchant?.category]);
}

function getPrimaryCategory(merchant) {
  return getMerchantCategories(merchant)[0] || 'comercios';
}

function getMerchantImage(merchant) {
  return merchant?.coverUrl || merchant?.imageUrl || merchant?.logoUrl || DEFAULT_OG_IMAGE;
}

function getMerchantLocations(merchant) {
  return Array.isArray(merchant?.locations) ? merchant.locations.filter(Boolean) : [];
}

function getPrimaryLocation(merchant) {
  return getMerchantLocations(merchant)[0] || null;
}

function getPrimaryCity(merchant) {
  const location = getPrimaryLocation(merchant);
  const components = location?.addressComponents || {};
  return (
    components.locality ||
    components.sublocality ||
    components.adminAreaLevel2 ||
    components.adminAreaLevel1 ||
    ''
  );
}

function getPrimaryAddress(merchant) {
  const location = getPrimaryLocation(merchant);
  return String(location?.formattedAddress || '').trim();
}

function getBenefitBankName(benefit) {
  const providerNames = Array.isArray(benefit?.eligibilities)
    ? benefit.eligibilities
      .map((eligibility) => eligibility?.bankDisplayName || eligibility?.bank)
      .filter(Boolean)
    : [];
  return String(benefit?.bankName || providerNames.join(', ') || 'Proveedor').trim() || 'Proveedor';
}

function getBenefitTitle(benefit) {
  return String(benefit?.benefit || benefit?.benefitTitle || benefit?.rewardRate || 'Beneficio').trim() || 'Beneficio';
}

function extractDiscountPercentage(benefit) {
  if (Number.isFinite(Number(benefit?.discountPercentage)) && Number(benefit.discountPercentage) > 0) {
    return Number(benefit.discountPercentage);
  }

  const rawValue = `${benefit?.rewardRate || ''} ${benefit?.valor || ''} ${benefit?.benefit || ''}`;
  const match = rawValue.match(/(\d+(?:[.,]\d+)?)\s*%/);
  return match ? Number(match[1].replace(',', '.')) : null;
}

function getMaxDiscountPercentage(merchant, benefits) {
  if (Number.isFinite(Number(merchant?.maxDiscountPercentage)) && Number(merchant.maxDiscountPercentage) > 0) {
    return Number(merchant.maxDiscountPercentage);
  }

  const percentages = (benefits || [])
    .map((benefit) => extractDiscountPercentage(benefit))
    .filter((value) => Number.isFinite(value) && value > 0);

  return percentages.length > 0 ? Math.max(...percentages) : null;
}

function sortBenefitsForSeo(benefits) {
  return [...(benefits || [])].sort((left, right) => {
    const leftDiscount = extractDiscountPercentage(left) || 0;
    const rightDiscount = extractDiscountPercentage(right) || 0;
    if (rightDiscount !== leftDiscount) return rightDiscount - leftDiscount;
    return Number(right?.installments || 0) - Number(left?.installments || 0);
  });
}

function formatBenefitValue(benefit) {
  const discount = extractDiscountPercentage(benefit);
  if (discount) return `${discount}% OFF`;
  if (Number.isFinite(Number(benefit?.installments)) && Number(benefit.installments) > 0) {
    return `${Number(benefit.installments)} cuotas sin interes`;
  }
  return String(benefit?.rewardRate || benefit?.valor || getBenefitTitle(benefit)).trim();
}

function buildMerchantDescription(merchant, benefits) {
  const name = getMerchantName(merchant);
  const category = getPrimaryCategory(merchant);
  const city = getPrimaryCity(merchant);
  const banks = uniqueDisplayStrings([
    ...(Array.isArray(merchant?.banks) ? merchant.banks : []),
    ...(benefits || []).map(getBenefitBankName)
  ]).slice(0, 4);
  const bankText = formatList(banks, 'bancos seleccionados');
  const maxDiscount = getMaxDiscountPercentage(merchant, benefits);
  const locationText = city ? `en ${city}` : 'en Argentina';
  const discountText = maxDiscount
    ? `hasta ${maxDiscount}% OFF`
    : 'promociones bancarias';

  return `${name}: descuentos y promociones ${locationText} en ${category} con ${bankText}. Consulta ${discountText}, beneficios activos y promociones anteriores en Blink.`;
}

function buildFaqItems(merchant, activeBenefits, pastBenefits, description) {
  const name = getMerchantName(merchant);
  const banks = formatList(
    uniqueDisplayStrings([
      ...(Array.isArray(merchant?.banks) ? merchant.banks : []),
      ...activeBenefits.map(getBenefitBankName),
      ...pastBenefits.map(getBenefitBankName)
    ]).slice(0, 5),
    'bancos participantes'
  );
  const city = getPrimaryCity(merchant) || 'Argentina';

  return [
    {
      question: `Que descuentos hay en ${name}?`,
      answer: activeBenefits.length > 0
        ? `${description}`
        : `${name} no tiene descuentos activos publicados ahora, pero puedes revisar promociones anteriores.`
    },
    {
      question: `Que bancos tienen promociones en ${name}?`,
      answer: `Las promociones disponibles y anteriores de ${name} incluyen beneficios de ${banks}.`
    },
    {
      question: `Hay promociones activas en ${name}?`,
      answer: activeBenefits.length > 0
        ? `Si, hay ${activeBenefits.length} promociones activas publicadas para ${name}.`
        : `No hay promociones activas publicadas para ${name} en este momento.`
    },
    {
      question: `Donde puedo usar beneficios de ${name}?`,
      answer: `Los beneficios de ${name} se muestran para ${city} y otros puntos disponibles segun la informacion publicada por cada banco.`
    }
  ];
}

function buildAddressSchema(merchant) {
  const location = getPrimaryLocation(merchant);
  if (!location) return undefined;

  const components = location.addressComponents || {};
  const address = {
    '@type': 'PostalAddress',
    addressCountry: components.countryCode || components.country || 'AR'
  };

  const streetAddress = getPrimaryAddress(merchant);
  if (streetAddress) address.streetAddress = streetAddress;
  if (components.locality) address.addressLocality = components.locality;
  if (components.adminAreaLevel1) address.addressRegion = components.adminAreaLevel1;
  if (components.postalCode) address.postalCode = components.postalCode;

  return address;
}

function buildOfferSchema(benefits, merchantName, absoluteUrl, availability) {
  return benefits.map((benefit) => {
    const offer = {
      '@context': 'https://schema.org',
      '@type': 'Offer',
      name: `${formatBenefitValue(benefit)} en ${merchantName}`,
      description: benefit?.description || getBenefitTitle(benefit),
      offeredBy: {
        '@type': 'Organization',
        name: getBenefitBankName(benefit)
      },
      url: absoluteUrl,
      availability
    };

    if (benefit?.validUntil) {
      offer.validThrough = benefit.validUntil;
    }

    return offer;
  });
}

function buildStructuredData({ merchant, activeBenefits, pastBenefits, faqItems, absoluteUrl }) {
  const name = getMerchantName(merchant);
  const image = getMerchantImage(merchant);
  const activeOffers = buildOfferSchema(activeBenefits, name, absoluteUrl, 'https://schema.org/InStock');
  const pastOffers = activeOffers.length > 0
    ? []
    : buildOfferSchema(pastBenefits, name, absoluteUrl, 'https://schema.org/Discontinued');

  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
    image: toAbsoluteUrl(new URL(absoluteUrl).origin, image),
    url: absoluteUrl,
    description: buildMerchantDescription(merchant, [...activeBenefits, ...pastBenefits]),
    address: buildAddressSchema(merchant)
  };

  if (activeOffers.length > 0) {
    localBusiness.makesOffer = activeOffers;
  } else if (pastOffers.length > 0) {
    localBusiness.makesOffer = pastOffers;
  }

  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: DEFAULT_SITE_NAME,
        item: new URL('/', absoluteUrl).toString()
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Comercios',
        item: new URL('/comercios', absoluteUrl).toString()
      },
      {
        '@type': 'ListItem',
        position: 3,
        name,
        item: absoluteUrl
      }
    ]
  };

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };

  return [localBusiness, ...activeOffers, ...pastOffers, breadcrumbList, faqPage];
}

function renderBenefitList(benefits, emptyText, isPast = false) {
  if (benefits.length === 0) {
    return `<p class="blink-seo-empty">${escapeHtml(emptyText)}</p>`;
  }

  const items = benefits.map((benefit) => {
    const validUntil = benefit?.validUntil
      ? `<span>Vigencia: ${escapeHtml(benefit.validUntil)}</span>`
      : '';
    const cap = benefit?.tope
      ? `<span>Tope: ${escapeHtml(benefit.tope)}</span>`
      : '';
    const days = benefit?.cuando
      ? `<span>Dias: ${escapeHtml(benefit.cuando)}</span>`
      : '';

    return [
      '<li class="blink-seo-benefit">',
      `  <strong>${escapeHtml(formatBenefitValue(benefit))}</strong>`,
      `  <span>${escapeHtml(getBenefitBankName(benefit))} - ${escapeHtml(benefit?.cardName || 'Tarjeta')}</span>`,
      `  <p>${escapeHtml(getBenefitTitle(benefit))}</p>`,
      `  <small>${[days, cap, validUntil].filter(Boolean).join(' ') || (isPast ? 'Promocion anterior' : 'Beneficio activo')}</small>`,
      '</li>'
    ].join('');
  }).join('');

  return `<ul class="blink-seo-benefits">${items}</ul>`;
}

function renderFaq(faqItems) {
  return faqItems.map((item) => [
    '<article class="blink-seo-faq-item">',
    `  <h3>${escapeHtml(item.question)}</h3>`,
    `  <p>${escapeHtml(item.answer)}</p>`,
    '</article>'
  ].join('')).join('');
}

function buildBodyHtml({ merchant, activeBenefits, pastBenefits, description, faqItems }) {
  const name = getMerchantName(merchant);
  const category = getPrimaryCategory(merchant);
  const city = getPrimaryCity(merchant) || 'Argentina';
  const banks = formatList(
    uniqueDisplayStrings([
      ...(Array.isArray(merchant?.banks) ? merchant.banks : []),
      ...activeBenefits.map(getBenefitBankName),
      ...pastBenefits.map(getBenefitBankName)
    ]).slice(0, 5),
    'bancos participantes'
  );
  const maxDiscount = getMaxDiscountPercentage(merchant, [...activeBenefits, ...pastBenefits]);
  const maxDiscountText = maxDiscount ? `${maxDiscount}% OFF` : 'Promociones bancarias';

  return [
    '<main class="blink-seo-shell" data-blink-merchant-seo>',
    '  <nav class="blink-seo-breadcrumb" aria-label="Breadcrumb"><a href="/">Blink</a><span>/</span><span>Comercios</span><span>/</span><span>' + escapeHtml(name) + '</span></nav>',
    '  <section class="blink-seo-hero">',
    '    <p class="blink-seo-kicker">Descuentos y promociones</p>',
    `    <h1>${escapeHtml(name)} descuentos y promociones</h1>`,
    `    <p>${escapeHtml(description)}</p>`,
    '    <dl class="blink-seo-facts">',
    `      <div><dt>Categoria</dt><dd>${escapeHtml(category)}</dd></div>`,
    `      <div><dt>Bancos</dt><dd>${escapeHtml(banks)}</dd></div>`,
    `      <div><dt>Ubicacion</dt><dd>${escapeHtml(city)}</dd></div>`,
    `      <div><dt>Mayor beneficio</dt><dd>${escapeHtml(maxDiscountText)}</dd></div>`,
    '    </dl>',
    '  </section>',
    '  <section class="blink-seo-section">',
    '    <h2>Beneficios activos</h2>',
    renderBenefitList(activeBenefits, 'No hay descuentos activos ahora.'),
    '  </section>',
    '  <section class="blink-seo-section">',
    '    <h2>Beneficios anteriores</h2>',
    renderBenefitList(pastBenefits, 'No hay beneficios anteriores publicados.', true),
    '  </section>',
    '  <section class="blink-seo-section blink-seo-faq">',
    '    <h2>Preguntas frecuentes</h2>',
    renderFaq(faqItems),
    '  </section>',
    '</main>'
  ].filter(Boolean).join('\n');
}

function buildHeadHtml({ title, description, absoluteUrl, imageUrl, structuredData }) {
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);
  const escapedUrl = escapeHtml(absoluteUrl);
  const escapedImage = escapeHtml(imageUrl);

  return [
    `    <title>${escapedTitle}</title>`,
    `    <meta name="description" content="${escapedDescription}" />`,
    '    <meta name="robots" content="index, follow" />',
    `    <link rel="canonical" href="${escapedUrl}" />`,
    '    <meta property="og:site_name" content="Blink" />',
    '    <meta property="og:locale" content="es_AR" />',
    '    <meta property="og:type" content="article" />',
    `    <meta property="og:title" content="${escapedTitle}" />`,
    `    <meta property="og:description" content="${escapedDescription}" />`,
    `    <meta property="og:url" content="${escapedUrl}" />`,
    `    <meta property="og:image" content="${escapedImage}" />`,
    '    <meta name="twitter:card" content="summary_large_image" />',
    `    <meta name="twitter:title" content="${escapedTitle}" />`,
    `    <meta name="twitter:description" content="${escapedDescription}" />`,
    `    <meta name="twitter:image" content="${escapedImage}" />`,
    `    <script type="application/ld+json" data-blink-merchant-seo="structured-data">${escapeJsonForHtml(structuredData)}</script>`,
    '    <style data-blink-merchant-seo>',
    '      .blink-seo-shell{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:960px;margin:0 auto;padding:32px 20px 56px;color:#111827;background:#fff}',
    '      .blink-seo-breadcrumb{display:flex;gap:8px;flex-wrap:wrap;font-size:14px;margin-bottom:32px;color:#4b5563}.blink-seo-breadcrumb a{color:#111827}',
    '      .blink-seo-kicker{text-transform:uppercase;font-size:12px;letter-spacing:.08em;font-weight:700;color:#4f46e5}.blink-seo-hero h1{font-size:40px;line-height:1.05;margin:8px 0 12px}.blink-seo-hero p{font-size:18px;line-height:1.55;color:#374151}',
    '      .blink-seo-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:24px 0;padding:0}.blink-seo-facts div,.blink-seo-benefit,.blink-seo-faq-item{border:1px solid #e5e7eb;border-radius:8px;padding:14px;background:#fafafa}.blink-seo-facts dt{font-size:12px;text-transform:uppercase;color:#6b7280}.blink-seo-facts dd{margin:4px 0 0;font-weight:700}',
    '      .blink-seo-section{margin-top:36px}.blink-seo-section h2{font-size:24px;margin:0 0 14px}.blink-seo-benefits{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;list-style:none;margin:0;padding:0}.blink-seo-benefit strong{display:block;font-size:20px}.blink-seo-benefit span{display:block;color:#4b5563;margin-top:4px}.blink-seo-benefit p{margin:8px 0;color:#111827}.blink-seo-benefit small{color:#6b7280}.blink-seo-empty{color:#6b7280}',
    '      .blink-seo-faq{display:grid;gap:12px}.blink-seo-faq h2{grid-column:1/-1}.blink-seo-faq-item h3{font-size:18px;margin:0 0 8px}.blink-seo-faq-item p{margin:0;color:#374151;line-height:1.5}',
    '      @media (max-width:640px){.blink-seo-shell{padding:24px 16px 48px}.blink-seo-hero h1{font-size:32px}}',
    '    </style>'
  ].join('\n');
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

export function parseMerchantSeoSlugId(slugId) {
  const rawParam = String(slugId || '').trim();
  if (!rawParam) return null;

  const delimiterIndex = rawParam.lastIndexOf(MERCHANT_SEO_DELIMITER);
  if (delimiterIndex <= 0 || delimiterIndex + MERCHANT_SEO_DELIMITER.length >= rawParam.length) {
    return null;
  }

  const slug = rawParam.slice(0, delimiterIndex);
  const rawMerchantId = rawParam.slice(delimiterIndex + MERCHANT_SEO_DELIMITER.length);

  let merchantId;
  try {
    merchantId = decodeURIComponent(rawMerchantId).trim();
  } catch {
    return null;
  }

  if (!slug || !merchantId) return null;
  return { slug, merchantId };
}

export function getMerchantSeoPathFromMerchant(merchant) {
  const merchantId = String(merchant?.merchantId || '').trim();
  const slug = slugify(getMerchantName(merchant)) || 'comercio';
  return `/comercios/${slug}${MERCHANT_SEO_DELIMITER}${encodeURIComponent(merchantId)}`;
}

export function isMerchantBenefitActive(benefit, now = new Date()) {
  const validUntil = String(benefit?.validUntil || '').trim();
  if (!validUntil) return true;

  if (DATE_ONLY_PATTERN.test(validUntil)) {
    return validUntil >= formatLocalDateOnly(now);
  }

  const parsedTime = Date.parse(validUntil);
  return Number.isFinite(parsedTime) && parsedTime >= now.getTime();
}

export function splitMerchantSeoBenefits(benefits, now = new Date()) {
  return sortBenefitsForSeo(benefits).reduce(
    (groups, benefit) => {
      if (isMerchantBenefitActive(benefit, now)) {
        groups.activeBenefits.push(benefit);
      } else {
        groups.pastBenefits.push(benefit);
      }
      return groups;
    },
    {
      activeBenefits: [],
      pastBenefits: []
    }
  );
}

export function readViteAppShell() {
  if (cachedAppShell) {
    return cachedAppShell;
  }

  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    process.env.BLINK_VITE_APP_SHELL,
    path.resolve(process.cwd(), 'dist/index.html'),
    path.resolve(moduleDir, '../dist/index.html'),
    path.resolve(process.cwd(), 'index.html'),
    path.resolve(moduleDir, '../index.html')
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      cachedAppShell = fs.readFileSync(candidate, 'utf8');
      return cachedAppShell;
    }
  }

  throw new Error('Unable to locate Vite app shell');
}

export function renderMerchantSeoHtml({
  appShell,
  merchant,
  benefits = [],
  path: merchantPath,
  siteUrl,
  now = new Date()
}) {
  const canonicalPath = merchantPath || getMerchantSeoPathFromMerchant(merchant);
  const absoluteUrl = toAbsoluteUrl(siteUrl, canonicalPath);
  const allBenefits = sortBenefitsForSeo(benefits);
  const { activeBenefits, pastBenefits } = splitMerchantSeoBenefits(allBenefits, now);
  const title = `${getMerchantName(merchant)} descuentos y promociones | ${DEFAULT_SITE_NAME}`;
  const description = buildMerchantDescription(merchant, allBenefits);
  const faqItems = buildFaqItems(merchant, activeBenefits, pastBenefits, description);
  const imageUrl = toAbsoluteUrl(siteUrl, getMerchantImage(merchant));
  const structuredData = buildStructuredData({
    merchant,
    activeBenefits,
    pastBenefits,
    faqItems,
    absoluteUrl
  });
  const headHtml = buildHeadHtml({
    title,
    description,
    absoluteUrl,
    imageUrl,
    structuredData
  });
  const bodyHtml = buildBodyHtml({
    merchant,
    activeBenefits,
    pastBenefits,
    description,
    faqItems
  });

  return injectBody(injectHead(appShell, headHtml), bodyHtml);
}
