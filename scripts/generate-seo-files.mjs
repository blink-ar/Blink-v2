import fs from 'node:fs';
import path from 'node:path';
import { MongoClient } from 'mongodb';
import ts from 'typescript';
import { DEFAULT_CANONICAL_SITE_URL, resolveCanonicalSiteUrl } from '../api/canonical-site.js';
import { SEO_CATEGORY_DEFINITIONS } from '../api/category-seo-data.js';
import { buildLandingSeoRoutesFromMerchants } from '../api/landing-seo-data.js';
import { slugify } from '../api/search/normalize.js';

const DEFAULT_SITE_URL = DEFAULT_CANONICAL_SITE_URL;
const DEFAULT_DATABASE_NAME = 'benefitsV3';
const MERCHANT_ASSETS_COLLECTION = 'merchant_assets';
const MAX_URLS_PER_SITEMAP = 50000;

function loadEnvFromFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

const envFiles = [path.resolve(process.cwd(), '.env.local'), path.resolve(process.cwd(), '.env')];
for (const envFile of envFiles) {
  loadEnvFromFile(envFile);
}

const siteUrlCandidates = [
  process.env.CANONICAL_SITE_URL,
  process.env.VITE_CANONICAL_SITE_URL,
  process.env.VITE_SITE_URL,
  process.env.SITE_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  process.env.VERCEL_URL,
];
const hasConfiguredSiteUrl = siteUrlCandidates.some((value) => String(value || '').trim());
const siteUrl = resolveCanonicalSiteUrl(...siteUrlCandidates);
const mongoUri = process.env.MONGODB_URI_READ_ONLY || '';
const databaseName = process.env.DATABASE_NAME || DEFAULT_DATABASE_NAME;
const landingMinMerchantCount = Number.parseInt(process.env.SITEMAP_LANDING_MIN_MERCHANTS || '3', 10);
const landingMaxCityRoutesPerCombination = Number.parseInt(
  process.env.SITEMAP_LANDING_MAX_CITY_ROUTES_PER_COMBO || '5',
  10,
);

const today = new Date().toISOString().split('T')[0];

const baseRoutes = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/search', changefreq: 'daily', priority: '0.9' },
  { path: '/map', changefreq: 'daily', priority: '0.8' },
];

const categorySeoRoutes = SEO_CATEGORY_DEFINITIONS.map((category) => ({
  path: `/categorias/${category.slug}`,
  changefreq: 'weekly',
  priority: '0.8',
}));

function extractExportedSlugArray(sourceFile, exportName) {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    if (!statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== exportName) continue;
      if (!declaration.initializer || !ts.isArrayLiteralExpression(declaration.initializer)) return [];

      return declaration.initializer.elements.flatMap((element) => {
        if (!ts.isObjectLiteralExpression(element)) return [];
        const slugProperty = element.properties.find((property) => {
          return ts.isPropertyAssignment(property) &&
            ts.isIdentifier(property.name) &&
            property.name.text === 'slug';
        });
        if (!slugProperty || !ts.isPropertyAssignment(slugProperty)) return [];
        return (
          ts.isStringLiteral(slugProperty.initializer) ||
          ts.isNoSubstitutionTemplateLiteral(slugProperty.initializer)
        ) ? [slugProperty.initializer.text] : [];
      });
    }
  }

  return [];
}

function readClientLandingRouteAllowlist() {
  const landingDataPath = path.resolve(process.cwd(), 'src/seo/landingData.ts');
  const sourceText = fs.readFileSync(landingDataPath, 'utf8');
  const sourceFile = ts.createSourceFile(
    landingDataPath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  return {
    allowedBankSlugs: extractExportedSlugArray(sourceFile, 'LANDING_BANKS'),
    allowedCategorySlugs: extractExportedSlugArray(sourceFile, 'LANDING_CATEGORIES'),
    allowedCitySlugs: extractExportedSlugArray(sourceFile, 'LANDING_CITIES'),
  };
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getMerchantSeoPath(merchant) {
  const merchantId = String(merchant?.merchantId || '').trim();
  const merchantSlug = slugify(merchant?.merchantName || '') || 'comercio';
  return `/comercios/${merchantSlug}--${encodeURIComponent(merchantId)}`;
}

async function loadMerchantSeoDocuments() {
  if (!mongoUri) {
    console.warn('[seo] MONGODB_URI_READ_ONLY is not set. Skipping dynamic merchant and landing sitemap URLs.');
    return [];
  }

  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db(databaseName);
    const merchants = await db.collection(MERCHANT_ASSETS_COLLECTION)
      .find(
        {
          isActive: { $ne: false },
          merchantId: { $exists: true, $type: 'string' },
          activeBenefitCount: { $gt: 0 },
        },
        {
          projection: {
            _id: 0,
            merchantId: 1,
            merchantName: 1,
            categories: 1,
            banks: 1,
            locations: 1,
            activeBenefitCount: 1,
            'searchProfile.benefits.bankName': 1,
          },
        },
      )
      .sort({ merchantName: 1 })
      .toArray();
    return merchants;
  } finally {
    await client.close();
  }
}

function buildMerchantRoutes(merchants) {
  return merchants
    .filter((merchant) => String(merchant.merchantId || '').trim())
    .map((merchant) => ({
      path: getMerchantSeoPath(merchant),
      changefreq: 'weekly',
      priority: '0.8',
    }));
}

const merchantDocuments = await loadMerchantSeoDocuments();
const merchantRoutes = buildMerchantRoutes(merchantDocuments);
const landingRoutes = buildLandingSeoRoutesFromMerchants(merchantDocuments, {
  minMerchantCount: Number.isFinite(landingMinMerchantCount) ? landingMinMerchantCount : 3,
  maxCityRoutesPerCombination: Number.isFinite(landingMaxCityRoutesPerCombination)
    ? landingMaxCityRoutesPerCombination
    : 5,
  ...readClientLandingRouteAllowlist(),
});
const routes = [...baseRoutes, ...categorySeoRoutes, ...landingRoutes, ...merchantRoutes];
const uniqueRoutes = Array.from(new Map(routes.map((route) => [route.path, route])).values());

function buildUrlset(routeChunk) {
  const xmlUrls = routeChunk
  .map((route) => {
    return [
      '  <url>',
      `    <loc>${escapeXml(`${siteUrl}${route.path}`)}</loc>`,
      `    <lastmod>${route.lastmod || today}</lastmod>`,
      `    <changefreq>${route.changefreq}</changefreq>`,
      `    <priority>${route.priority}</priority>`,
      '  </url>',
    ].join('\n');
  })
  .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>
`;
}

function buildSitemapIndex(sitemapPaths) {
  const sitemapEntries = sitemapPaths
    .map((sitemapPath) => [
      '  <sitemap>',
      `    <loc>${escapeXml(`${siteUrl}${sitemapPath}`)}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      '  </sitemap>',
    ].join('\n'))
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>
`;
}

const robotsContent = `User-agent: *
Allow: /
Disallow: /profile
Disallow: /saved

Sitemap: ${siteUrl}/sitemap.xml
`;

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const sitemapPath = path.join(publicDir, 'sitemap.xml');
const shouldPreserveExistingSitemap = !mongoUri && fs.existsSync(sitemapPath);
if (shouldPreserveExistingSitemap) {
  console.warn('[seo] Preserving existing sitemap.xml because MONGODB_URI_READ_ONLY is not set.');
}

if (!shouldPreserveExistingSitemap) {
  for (const fileName of fs.readdirSync(publicDir)) {
    if (/^sitemap-\d+\.xml$/.test(fileName)) {
      fs.unlinkSync(path.join(publicDir, fileName));
    }
  }

  const sitemapChunks = [];
  for (let index = 0; index < uniqueRoutes.length; index += MAX_URLS_PER_SITEMAP) {
    sitemapChunks.push(uniqueRoutes.slice(index, index + MAX_URLS_PER_SITEMAP));
  }

  if (sitemapChunks.length <= 1) {
    fs.writeFileSync(sitemapPath, buildUrlset(sitemapChunks[0] || []), 'utf8');
  } else {
    const sitemapPaths = sitemapChunks.map((chunk, index) => {
      const childPath = `/sitemap-${index + 1}.xml`;
      fs.writeFileSync(path.join(publicDir, `sitemap-${index + 1}.xml`), buildUrlset(chunk), 'utf8');
      return childPath;
    });
    fs.writeFileSync(sitemapPath, buildSitemapIndex(sitemapPaths), 'utf8');
  }
}

fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsContent, 'utf8');

if (!hasConfiguredSiteUrl) {
  console.warn(`[seo] CANONICAL_SITE_URL/VITE_SITE_URL/SITE_URL is not set. Using ${DEFAULT_SITE_URL} in sitemap and robots.txt.`);
} else {
  console.log(`[seo] Generated sitemap.xml and robots.txt for ${siteUrl} (${uniqueRoutes.length} URLs, ${categorySeoRoutes.length} category URLs, ${landingRoutes.length} landing URLs, ${merchantRoutes.length} merchant URLs)`);
}
