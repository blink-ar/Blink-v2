import { afterEach, describe, expect, it, vi } from 'vitest';
import handler, { isKnownSpaPath } from '../../../api/spa-shell.js';
import { spaNavigationFallbackAllowlist } from '../../seo/spaNavigationFallback';

function createResponseCapture() {
  return {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: null as string | null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    send(payload: string) {
      this.body = payload;
      return this;
    }
  };
}

describe('SPA shell route guard', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('recognizes valid client-side routes', () => {
    expect(isKnownSpaPath('/search')).toBe(true);
    expect(isKnownSpaPath('/Search')).toBe(true);
    expect(isKnownSpaPath('/benefit/abc/1')).toBe(true);
    expect(isKnownSpaPath('/Benefit/abc/1')).toBe(true);
    expect(isKnownSpaPath('/comercios/coto--merchant_1')).toBe(true);
    expect(isKnownSpaPath('/business/merchant_1')).toBe(true);
    expect(isKnownSpaPath('/categorias/gastronomia')).toBe(true);
    expect(isKnownSpaPath('/categorias/gastronomia/page/foo')).toBe(true);
    expect(isKnownSpaPath('/descuentos/galicia/gastronomia')).toBe(true);
    expect(isKnownSpaPath('/descuentos/galicia/gastronomia/caba')).toBe(true);
    expect(isKnownSpaPath('/descuentos/rio/gastronomia')).toBe(true);
    expect(isKnownSpaPath('/Descuentos/Rio/Gastronomia')).toBe(true);
    expect(isKnownSpaPath('/descuentos/galicia/gastronomia/capital-federal')).toBe(true);
  });

  it('rejects unknown and invalid landing routes', () => {
    expect(isKnownSpaPath('/no-such-path')).toBe(false);
    expect(isKnownSpaPath('/descuentos/nope/gastronomia')).toBe(false);
    expect(isKnownSpaPath('/descuentos/galicia/nope')).toBe(false);
    expect(isKnownSpaPath('/descuentos/galicia/gastronomia/nope')).toBe(false);
    expect(isKnownSpaPath('/descuentos/galicia//gastronomia')).toBe(false);
    expect(isKnownSpaPath('/descuentos//galicia/gastronomia')).toBe(false);
  });

  it('returns a noindex 404 HTML response for unknown routes', async () => {
    const req = {
      method: 'GET',
      url: '/api/spa-shell?path=no-such-path',
      headers: {
        host: 'www.blinkapp.com.ar',
        'x-forwarded-proto': 'https',
      },
    };
    const res = createResponseCapture();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(404);
    expect(res.headers['Content-Type']).toBe('text/html; charset=utf-8');
    expect(res.headers['X-Robots-Tag']).toBe('noindex, nofollow');
    expect(res.body).toContain('<meta name="robots" content="noindex, nofollow" />');
    expect(res.body).toContain('<title>Pagina no encontrada | Blink</title>');
    expect(res.body).toContain('href="https://www.blinkapp.com.ar/no-such-path"');
  });

  it('returns the SPA shell with noindex follow headers for the map route', async () => {
    const req = {
      method: 'GET',
      url: '/api/spa-shell?path=map',
      headers: {
        host: 'www.blinkapp.com.ar',
        'x-forwarded-proto': 'https',
      },
    };
    const res = createResponseCapture();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toBe('text/html; charset=utf-8');
    expect(res.headers['X-Robots-Tag']).toBe('noindex, follow');
    expect(res.body).toContain('<div id="root"></div>');
  });

  it('falls back when a site env value is malformed by literal quotes', async () => {
    vi.stubEnv('CANONICAL_SITE_URL', '');
    vi.stubEnv('VITE_CANONICAL_SITE_URL', '');
    vi.stubEnv('VITE_SITE_URL', '"https://www.blinkapp.com.ar');
    vi.stubEnv('SITE_URL', '');

    const req = {
      method: 'GET',
      url: '/api/spa-shell?path=no-such-path',
      headers: {
        host: 'preview.blinkapp.test',
        'x-forwarded-proto': 'https',
      },
    };
    const res = createResponseCapture();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(404);
    expect(res.body).toContain('href="https://preview.blinkapp.test/no-such-path"');
    expect(res.body).not.toContain('&quot;https');
  });

  it('returns a noindex 404 for malformed encoded path segments', async () => {
    const req = {
      method: 'GET',
      url: '/api/spa-shell?path=bad/%25',
      headers: {
        host: 'www.blinkapp.com.ar',
        'x-forwarded-proto': 'https',
      },
    };
    const res = createResponseCapture();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(404);
    expect(res.headers['X-Robots-Tag']).toBe('noindex, nofollow');
    expect(res.body).toContain('<title>Pagina no encontrada | Blink</title>');
  });

  it('rejects encoded slashes in rewritten paths before route validation', async () => {
    const req = {
      method: 'GET',
      url: '/api/spa-shell?path=descuentos/galicia%2Fgastronomia',
      headers: {
        host: 'www.blinkapp.com.ar',
        'x-forwarded-proto': 'https',
      },
    };
    const res = createResponseCapture();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(404);
    expect(res.headers['X-Robots-Tag']).toBe('noindex, nofollow');
    expect(res.body).toContain('<title>Pagina no encontrada | Blink</title>');
  });

  it('limits the service worker navigation fallback to known SPA routes', () => {
    const matchesFallback = (pathname: string) => {
      return spaNavigationFallbackAllowlist.some((pattern) => pattern.test(pathname));
    };

    expect(matchesFallback('/search')).toBe(true);
    expect(matchesFallback('/search?category=gastronomia')).toBe(true);
    expect(matchesFallback('/Search')).toBe(true);
    expect(matchesFallback('/auth/callback?code=abc')).toBe(true);
    expect(matchesFallback('/benefit/abc/1')).toBe(true);
    expect(matchesFallback('/comercios/coto--merchant_1')).toBe(true);
    expect(matchesFallback('/business/merchant_1')).toBe(true);
    expect(matchesFallback('/categorias/gastronomia/page/foo')).toBe(true);
    expect(matchesFallback('/descuentos/rio/gastronomia/capital-federal')).toBe(true);
    expect(matchesFallback('/no-such-path')).toBe(false);
    expect(matchesFallback('/no-such-path?x=1')).toBe(false);
    expect(matchesFallback('/descuentos/nope/gastronomia')).toBe(false);
    expect(matchesFallback('/descuentos/galicia%2Fgastronomia')).toBe(false);
  });
});
