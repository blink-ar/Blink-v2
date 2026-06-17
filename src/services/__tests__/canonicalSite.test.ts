import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CANONICAL_SITE_URL,
  normalizeSiteUrl,
  resolveCanonicalSiteUrl,
} from '../../../api/canonical-site.js';
import { normalizeBlinkSiteUrl } from '../../seo/seo';

const NOINDEX_APP_ROUTE_SOURCES = [
  '/profile',
  '/profile/',
  '/saved',
  '/saved/',
  '/login',
  '/login/',
  '/signup',
  '/signup/',
  '/notifications',
  '/notifications/',
  '/auth/callback',
  '/auth/callback/',
];

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

    for (const source of NOINDEX_APP_ROUTE_SOURCES) {
      expect(vercelConfig.headers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            source,
            headers: expect.arrayContaining([
              {
                key: 'X-Robots-Tag',
                value: 'noindex, nofollow',
              },
            ]),
          }),
        ])
      );
    }
  });

  it('routes private app pages through the server noindex shell before filesystem fallback', () => {
    const vercelConfig = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), 'vercel.json'), 'utf8')
    );

    const filesystemIndex = vercelConfig.routes.findIndex((route: { handle?: string }) => route.handle === 'filesystem');
    const noindexRoutes = vercelConfig.routes
      .map((route: { src?: string; dest?: string }, index: number) => ({ ...route, index }))
      .filter((route: { dest?: string }) => route.dest?.includes('__app_noindex'));

    expect(noindexRoutes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: '/(profile|saved|login|signup|notifications)/?',
          dest: '/api/[...path]?path=__app_noindex/$1',
        }),
        expect.objectContaining({
          src: '/auth/callback/?',
          dest: '/api/[...path]?path=__app_noindex/auth/callback',
        }),
      ])
    );
    expect(noindexRoutes.every((route: { index: number }) => route.index < filesystemIndex)).toBe(true);
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
