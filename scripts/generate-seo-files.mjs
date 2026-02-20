import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_SITE_URL = 'https://example.com';

function normalizeSiteUrl(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, '');
}

const resolvedSiteUrl = normalizeSiteUrl(
  process.env.VITE_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    '',
);

const siteUrl = resolvedSiteUrl || DEFAULT_SITE_URL;

const today = new Date().toISOString().split('T')[0];
const banks = ['galicia', 'santander', 'bbva', 'macro', 'nacion', 'icbc'];
const categories = ['gastronomia', 'moda', 'shopping', 'hogar', 'deportes', 'belleza'];
const cities = ['buenos-aires', 'caba', 'cordoba', 'rosario', 'mendoza'];

const baseRoutes = [
  { path: '/home', changefreq: 'daily', priority: '1.0' },
  { path: '/search', changefreq: 'daily', priority: '0.9' },
  { path: '/map', changefreq: 'daily', priority: '0.8' },
];

const landingRoutes = [];
for (const bank of banks) {
  for (const category of categories) {
    landingRoutes.push({
      path: `/descuentos/${bank}/${category}`,
      changefreq: 'weekly',
      priority: '0.8',
    });

    for (const city of cities) {
      landingRoutes.push({
        path: `/descuentos/${bank}/${category}/${city}`,
        changefreq: 'weekly',
        priority: '0.7',
      });
    }
  }
}

const routes = [...baseRoutes, ...landingRoutes];
const uniqueRoutes = Array.from(new Map(routes.map((route) => [route.path, route])).values());

const xmlUrls = uniqueRoutes
  .map((route) => {
    return [
      '  <url>',
      `    <loc>${siteUrl}${route.path}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${route.changefreq}</changefreq>`,
      `    <priority>${route.priority}</priority>`,
      '  </url>',
    ].join('\n');
  })
  .join('\n');

const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>
`;

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

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapContent, 'utf8');
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsContent, 'utf8');

if (siteUrl === DEFAULT_SITE_URL) {
  console.warn('[seo] VITE_SITE_URL/SITE_URL is not set. Using https://example.com in sitemap and robots.txt.');
} else {
  console.log(`[seo] Generated sitemap.xml and robots.txt for ${siteUrl}`);
}
