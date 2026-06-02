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

  it('ignores malformed quoted site URL values', () => {
    expect(normalizeSiteUrl('"https://www.blinkapp.com.ar"')).toBe(
      'https://www.blinkapp.com.ar'
    );
    expect(normalizeSiteUrl('"https://www.blinkapp.com.ar')).toBe('');
    expect(resolveCanonicalSiteUrl('"https://broken', 'https://blink-v2-preview.vercel.app')).toBe(
      'https://blink-v2-preview.vercel.app'
    );
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
