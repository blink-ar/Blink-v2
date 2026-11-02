import { describe, it, expect } from 'vitest';
import { renderAppSeoHtml } from '../../../api/app-seo.js';
import handler from '../../../api/[...path].js';

const shell = '<html><head><title>Home</title><meta name="robots" content="index, follow"><link rel="canonical" href="/"><script type="application/ld+json">{"@type":"WebSite"}</script></head><body><div id="root"></div><script src="/app.js"></script></body></html>';

describe('server app routes', () => {
  it.each(['map', 'profile', 'saved', 'login', 'signup', 'notifications', 'auth/callback'])('renders %s as a usable noindex app screen', (page) => {
    const html = renderAppSeoHtml(shell, page, 'https://www.blinkapp.com.ar');
    expect(html).toContain(`href="https://www.blinkapp.com.ar/${page}"`);
    expect(html).toContain('content="noindex,');
    expect(html).not.toContain('content="index,');
    expect(html).not.toContain('application/ld+json');
    expect(html).toContain('<script src="/app.js">');
    expect(html?.match(/rel="canonical"/g)).toHaveLength(1);
  });

  it('rejects arbitrary page names', () => {
    expect(renderAppSeoHtml(shell, 'made-up', 'https://www.blinkapp.com.ar')).toBeNull();
  });

  it.each(['GET', 'HEAD'])('serves noindex through the real %s handler without a DB connection', async (method) => {
    const res = { headers: {}, statusCode: 0, body: '',
      setHeader(name, value) { this.headers[name] = value; },
      status(code) { this.statusCode = code; return this; },
      send(body) { this.body = body; return this; },
    };
    await handler({ method, url: '/map?path=__app/map', headers: { host: 'www.blinkapp.com.ar' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.headers['X-Robots-Tag']).toBe('noindex, follow');
    expect(res.headers['Cache-Control']).toBe('private, no-store');
    expect(res.body).toContain('content="noindex, follow"');
  });
});
