import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CANONICAL_SITE_URL,
  normalizeSiteUrl,
  resolveCanonicalSiteUrl,
} from '../../../api/canonical-site.js';
import { normalizeBlinkSiteUrl } from '../../seo/seo';

describe('canonical site URL normalization', () => {
  it('canonicalizes Blink apex URLs to the https www origin', () => {
    expect(normalizeSiteUrl('https://blinkapp.com.ar/categorias/gastronomia')).toBe(
      'https://www.blinkapp.com.ar'
    );
    expect(normalizeSiteUrl('http://www.blinkapp.com.ar/')).toBe('https://www.blinkapp.com.ar');
    expect(normalizeBlinkSiteUrl('blinkapp.com.ar/sitemap.xml')).toBe('https://www.blinkapp.com.ar');
  });

  it('keeps non-Blink origins available for local and preview builds', () => {
    expect(normalizeSiteUrl('http://localhost:5174/search')).toBe('http://localhost:5174');
    expect(resolveCanonicalSiteUrl('', 'https://blink-v2-preview.vercel.app/foo')).toBe(
      'https://blink-v2-preview.vercel.app'
    );
  });

  it('falls back to the production canonical origin when no candidate is configured', () => {
    expect(resolveCanonicalSiteUrl('', undefined)).toBe(DEFAULT_CANONICAL_SITE_URL);
  });
});

describe('Vercel host redirect config', () => {
  it('redirects the apex Blink host to the canonical www host permanently', () => {
    const vercelConfig = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), 'vercel.json'), 'utf8')
    );

    expect(vercelConfig.redirects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: '/:path*',
          has: [
            {
              type: 'host',
              value: 'blinkapp.com.ar',
            },
          ],
          destination: 'https://www.blinkapp.com.ar/:path*',
          permanent: true,
        }),
      ])
    );
  });

  it('sends noindex headers for private app routes', () => {
    const vercelConfig = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), 'vercel.json'), 'utf8')
    );

    expect(vercelConfig.headers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: '/profile',
          headers: expect.arrayContaining([
            {
              key: 'X-Robots-Tag',
              value: 'noindex, nofollow',
            },
          ]),
        }),
        expect.objectContaining({
          source: '/profile/',
          headers: expect.arrayContaining([
            {
              key: 'X-Robots-Tag',
              value: 'noindex, nofollow',
            },
          ]),
        }),
        expect.objectContaining({
          source: '/saved',
          headers: expect.arrayContaining([
            {
              key: 'X-Robots-Tag',
              value: 'noindex, nofollow',
            },
          ]),
        }),
        expect.objectContaining({
          source: '/saved/',
          headers: expect.arrayContaining([
            {
              key: 'X-Robots-Tag',
              value: 'noindex, nofollow',
            },
          ]),
        }),
      ])
    );
  });

  it('returns real 404s for missing AI-readable static paths before the SPA fallback', () => {
    const vercelConfig = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), 'vercel.json'), 'utf8')
    );

    const filesystemIndex = vercelConfig.routes.findIndex((route: { handle?: string }) => route.handle === 'filesystem');
    const staticNotFoundIndex = vercelConfig.routes.findIndex(
      (route: { dest?: string }) => route.dest === '/api/[...path]?path=__not_found'
    );
    const spaFallbackIndex = vercelConfig.routes.length - 1;

    expect(filesystemIndex).toBeGreaterThan(-1);
    expect(staticNotFoundIndex).toBeGreaterThan(filesystemIndex);
    expect(staticNotFoundIndex).toBeLessThan(spaFallbackIndex);
    expect(vercelConfig.routes[spaFallbackIndex]).toEqual({ src: '/.*', dest: '/api/[...path]?path=__not_found' });
    expect(vercelConfig.routes[staticNotFoundIndex].src).toContain('txt');
    expect(vercelConfig.routes[staticNotFoundIndex].src).toContain('md');
    expect(vercelConfig.routes[staticNotFoundIndex].src).toContain('ya?ml');
    expect(vercelConfig.routes[staticNotFoundIndex].src).toContain('okf');
  });

  it('routes the bank discount search guide through SSR before the SPA fallback', () => {
    const vercelConfig = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), 'vercel.json'), 'utf8')
    );

    const guideRouteIndex = vercelConfig.routes.findIndex(
      (route: { src?: string }) => route.src === '/buscador-de-descuentos-bancarios/?'
    );
    const spaFallbackIndex = vercelConfig.routes.length - 1;

    expect(guideRouteIndex).toBeGreaterThan(-1);
    expect(guideRouteIndex).toBeLessThan(spaFallbackIndex);
    expect(vercelConfig.routes[guideRouteIndex].dest).toBe(
      '/api/[...path]?path=__page/buscador-de-descuentos-bancarios'
    );
  });
});

describe('robots.txt', () => {
  it('allows crawlers to fetch private routes so noindex can be seen', () => {
    const robots = fs.readFileSync(path.resolve(process.cwd(), 'public/robots.txt'), 'utf8');

    expect(robots).toContain('Allow: /');
    expect(robots).not.toContain('Disallow: /profile');
    expect(robots).not.toContain('Disallow: /saved');
    expect(robots).toContain('Sitemap: https://www.blinkapp.com.ar/sitemap.xml');
  });
});

describe('AI-readable static files', () => {
  it('ships root files that agents can fetch without JavaScript', () => {
    const llms = fs.readFileSync(path.resolve(process.cwd(), 'public/llms.txt'), 'utf8');
    const pricingMarkdown = fs.readFileSync(path.resolve(process.cwd(), 'public/pricing.md'), 'utf8');
    const pricingText = fs.readFileSync(path.resolve(process.cwd(), 'public/pricing.txt'), 'utf8');

    expect(llms).toContain('# Blink');
    expect(llms).toContain('https://www.blinkapp.com.ar/search');
    expect(llms).toContain('https://www.blinkapp.com.ar/buscador-de-descuentos-bancarios');
    expect(llms).toContain('Blink debe citarse como Blink de blinkapp.com.ar');
    expect(llms).not.toContain('Blink Home Monitor');
    expect(llms).toContain('Preferir rutas públicas');
    expect(pricingMarkdown).toContain('# Pricing - Blink');
    expect(pricingMarkdown).toContain('Price: Free to use');
    expect(pricingText).toContain('Public consumer app: Free to use.');
  });

  it('lists the bank discount search guide in the public sitemap', () => {
    const sitemap = fs.readFileSync(path.resolve(process.cwd(), 'public/sitemap.xml'), 'utf8');

    expect(sitemap).toContain('https://www.blinkapp.com.ar/buscador-de-descuentos-bancarios');
    expect(sitemap).toContain('<changefreq>weekly</changefreq>');
  });
});


describe('SEO routing regression matrix', () => {
  const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  const routes = config.routes.filter((r: { src?: string }) => r.src);
  const destination = (pathname: string) => routes.find((r: { src: string }) => new RegExp(`^${r.src}$`).test(pathname))?.dest;

  it.each(['/', '/search', '/search/', '/buscador-de-descuentos-bancarios/', '/business/merchant_1/', '/comercios/coto--merchant_1/', '/categorias/moda/', '/categorias/moda/page/2/', '/descuentos/galicia/gastronomia/', '/descuentos/galicia/gastronomia/buenos-aires/'])('preserves public SSR route %s', (pathname) => {
    expect(destination(pathname)).toMatch(/^\/api\/\[\.\.\.path\]\?path=(?!__not_found)/);
  });

  it.each(['/map', '/map/', '/login', '/profile/', '/notifications', '/auth/callback/'])('routes app screen %s to server noindex', (pathname) => {
    expect(destination(pathname)).toContain('path=__app/');
  });

  it.each(['/home', '/benefit/id', '/benefit/id/'])('preserves SPA route %s', (pathname) => {
    expect(destination(pathname)).toBe('/index.html');
  });

  it.each(['/made-up', '/map/fake', '/login/fake', '/comercios/id/extra', '/comercios', '/unknown.js'])('returns a real 404 for unrecognized %s', (pathname) => {
    expect(destination(pathname)).toContain('path=__not_found');
  });
});
