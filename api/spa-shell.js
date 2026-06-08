import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveCanonicalSiteUrl } from './canonical-site.js';

const LANDING_BANKS = [
  { slug: 'galicia', aliases: ['galicia'] },
  { slug: 'santander', aliases: ['santander', 'rio'] },
  { slug: 'bbva', aliases: ['bbva', 'frances', 'banco frances'] },
  { slug: 'macro', aliases: ['macro'] },
  { slug: 'nacion', aliases: ['nacion', 'bna', 'banco nacion'] },
  { slug: 'icbc', aliases: ['icbc'] },
];
const LANDING_CATEGORIES = [
  { slug: 'gastronomia' },
  { slug: 'moda' },
  { slug: 'shopping' },
  { slug: 'hogar' },
  { slug: 'deportes' },
  { slug: 'belleza' },
];
const LANDING_CITIES = [
  { slug: 'buenos-aires', aliases: ['buenos aires', 'provincia de buenos aires'] },
  { slug: 'caba', aliases: ['caba', 'ciudad autonoma de buenos aires', 'cdad autonoma de buenos aires', 'capital federal'] },
  { slug: 'cordoba', aliases: ['cordoba', 'cordoba capital'] },
  { slug: 'rosario', aliases: ['rosario', 'santa fe'] },
  { slug: 'mendoza', aliases: ['mendoza'] },
  { slug: 'la-plata', aliases: ['la plata'] },
  { slug: 'mar-del-plata', aliases: ['mar del plata'] },
  { slug: 'tucuman', aliases: ['tucuman', 'san miguel de tucuman'] },
];
const MALFORMED_PATH = '/__blink_malformed_path__';

let cachedAppShell = null;

function readAppShell() {
  if (cachedAppShell) {
    return cachedAppShell;
  }

  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    process.env.BLINK_VITE_APP_SHELL,
    path.resolve(process.cwd(), 'dist/index.html'),
    path.resolve(moduleDir, '../dist/index.html'),
    path.resolve(process.cwd(), 'index.html'),
    path.resolve(moduleDir, '../index.html'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      cachedAppShell = fs.readFileSync(candidate, 'utf8');
      return cachedAppShell;
    }
  }

  throw new Error('Unable to locate Vite app shell');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getParsedUrl(req) {
  const protoHeader = req.headers['x-forwarded-proto'];
  const protocol = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader || 'https';
  const host = req.headers.host || 'localhost';
  return new URL(req.url || '/', `${protocol}://${host}`);
}

function getRawSearchParam(url, name) {
  const query = url.search.startsWith('?') ? url.search.slice(1) : url.search;
  if (!query) return null;

  for (const part of query.split('&')) {
    const separatorIndex = part.indexOf('=');
    const rawKey = separatorIndex >= 0 ? part.slice(0, separatorIndex) : part;
    const rawValue = separatorIndex >= 0 ? part.slice(separatorIndex + 1) : '';
    try {
      if (decodeURIComponent(rawKey.replace(/\+/g, ' ')) === name) {
        return rawValue;
      }
    } catch {
      return null;
    }
  }

  return null;
}

function hasEncodedPathSeparator(value) {
  return /%(?:2f|5c)/i.test(String(value || ''));
}

function getRequestedPath(url) {
  const rawPathParam = getRawSearchParam(url, 'path');
  if (hasEncodedPathSeparator(rawPathParam)) return MALFORMED_PATH;

  const rawPath = url.searchParams.get('path');
  if (!rawPath) return '/';

  const decodedSegments = [];
  for (const segment of rawPath.split('/')) {
    try {
      const decodedSegment = decodeURIComponent(segment);
      if (decodedSegment.includes('/') || decodedSegment.includes('\\')) {
        return MALFORMED_PATH;
      }
      decodedSegments.push(decodedSegment);
    } catch {
      return MALFORMED_PATH;
    }
  }

  const normalized = `/${decodedSegments.join('/')}`;

  return normalized === '/' ? '/' : normalized.replace(/\/+$/, '');
}

function normalizeLandingToken(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveLandingDefinition(definitions, slug) {
  if (!slug) return null;
  const normalizedSlug = normalizeLandingToken(slug);
  return definitions.find((definition) => {
    return definition.slug === slug || definition.aliases?.some((alias) => {
      return normalizeLandingToken(alias) === normalizedSlug;
    });
  }) ?? null;
}

function isValidLandingPath(pathname) {
  const parts = pathname.startsWith('/') ? pathname.slice(1).split('/') : pathname.split('/');
  if (parts[0] !== 'descuentos') return false;
  if (parts.length !== 3 && parts.length !== 4) return false;
  if (parts.some((part) => !part)) return false;

  const [, bank, category, city] = parts;
  if (!resolveLandingDefinition(LANDING_BANKS, bank) || !resolveLandingDefinition(LANDING_CATEGORIES, category)) {
    return false;
  }

  return !city || Boolean(resolveLandingDefinition(LANDING_CITIES, city));
}

export function isKnownSpaPath(pathname) {
  const path = (String(pathname || '/').replace(/\/+$/, '') || '/').toLowerCase();
  if ([
    '/',
    '/home',
    '/search',
    '/map',
    '/saved',
    '/profile',
    '/notifications',
    '/signup',
    '/login',
    '/auth/callback',
  ].includes(path)) {
    return true;
  }

  if (/^\/benefit\/[^/]+(?:\/[^/]+)?$/.test(path)) {
    return true;
  }

  if (/^\/(?:comercios|business)\/[^/]+$/.test(path)) {
    return true;
  }

  if (/^\/categorias\/[^/]+(?:\/page\/[^/]+)?$/.test(path)) {
    return true;
  }

  return isValidLandingPath(path);
}

function buildNotFoundHtml({ siteUrl, pathname }) {
  const canonicalUrl = `${siteUrl}${pathname === '/' ? '/' : pathname}`;
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <title>Pagina no encontrada | Blink</title>
  </head>
  <body>
    <main style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 64px auto; padding: 0 20px; color: #111827;">
      <h1>Pagina no encontrada</h1>
      <p>Esta URL no existe en Blink.</p>
      <a href="/" style="color: #4f46e5; font-weight: 700;">Volver al inicio</a>
    </main>
  </body>
</html>
`;
}

function sendHtml(res, statusCode, payload, extraHeaders = {}) {
  res.status(statusCode);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  for (const [name, value] of Object.entries(extraHeaders)) {
    res.setHeader(name, value);
  }
  res.send(payload);
}

function getKnownSpaRouteHeaders(pathname) {
  const normalizedPath = (String(pathname || '/').replace(/\/+$/, '') || '/').toLowerCase();
  if (normalizedPath === '/map') {
    return { 'X-Robots-Tag': 'noindex, follow' };
  }

  return {};
}

export default async function handler(req, res) {
  const url = getParsedUrl(req);
  const pathname = getRequestedPath(url);

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405);
    res.setHeader('Allow', 'GET, HEAD');
    res.send('');
    return;
  }

  if (!isKnownSpaPath(pathname)) {
    const siteUrl = resolveCanonicalSiteUrl(
      process.env.CANONICAL_SITE_URL,
      process.env.VITE_CANONICAL_SITE_URL,
      process.env.VITE_SITE_URL,
      process.env.SITE_URL,
      url.origin
    );
    return sendHtml(
      res,
      404,
      buildNotFoundHtml({ siteUrl, pathname }),
      { 'X-Robots-Tag': 'noindex, nofollow' }
    );
  }

  return sendHtml(res, 200, readAppShell(), getKnownSpaRouteHeaders(pathname));
}
