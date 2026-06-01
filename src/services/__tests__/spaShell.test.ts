import { describe, expect, it } from 'vitest';
import handler, { isKnownSpaPath } from '../../../api/spa-shell.js';

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
  it('recognizes valid client-side routes', () => {
    expect(isKnownSpaPath('/search')).toBe(true);
    expect(isKnownSpaPath('/benefit/abc/1')).toBe(true);
    expect(isKnownSpaPath('/descuentos/galicia/gastronomia')).toBe(true);
    expect(isKnownSpaPath('/descuentos/galicia/gastronomia/caba')).toBe(true);
  });

  it('rejects unknown and invalid landing routes', () => {
    expect(isKnownSpaPath('/no-such-path')).toBe(false);
    expect(isKnownSpaPath('/descuentos/nope/gastronomia')).toBe(false);
    expect(isKnownSpaPath('/descuentos/galicia/nope')).toBe(false);
    expect(isKnownSpaPath('/descuentos/galicia/gastronomia/nope')).toBe(false);
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
});
