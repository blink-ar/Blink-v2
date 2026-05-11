import { describe, expect, it } from 'vitest';
import { renderMerchantSeoHtml } from '../../../api/merchant-seo.js';

const appShell = [
  '<!doctype html>',
  '<html lang="es">',
  '<head>',
  '  <meta charset="UTF-8" />',
  '  <meta name="description" content="Default description" />',
  '  <meta property="og:title" content="Default title" />',
  '  <link rel="canonical" href="/home" />',
  '  <title>Default</title>',
  '</head>',
  '<body>',
  '  <div id="root"></div>',
  '  <script type="module" crossorigin src="/assets/index-test.js"></script>',
  '</body>',
  '</html>',
].join('\n');

function countMatches(value: string, pattern: RegExp): number {
  return value.match(pattern)?.length || 0;
}

describe('merchant SEO renderer', () => {
  it('renders escaped merchant SEO metadata, visible content, and JSON-LD', () => {
    const html = renderMerchantSeoHtml({
      appShell,
      siteUrl: 'https://www.blinkapp.com.ar',
      path: '/comercios/coto--merchant_1',
      now: new Date('2026-05-11T12:00:00.000Z'),
      merchant: {
        merchantId: 'merchant_1',
        merchantName: 'Coto <Especial>',
        categories: ['supermercados'],
        banks: ['Banco Galicia', 'BBVA'],
        maxDiscountPercentage: 35,
        imageUrl: '/pwa-512x512.png',
        locations: [
          {
            formattedAddress: 'Av Siempre Viva <123>',
            addressComponents: {
              locality: 'Buenos Aires',
              adminAreaLevel1: 'CABA',
              countryCode: 'AR',
            },
          },
        ],
      },
      benefits: [
        {
          bankName: 'Banco Galicia',
          cardName: 'Visa',
          benefit: '35% OFF <script>alert(1)</script>',
          rewardRate: '35%',
          cuando: 'lunes',
          validUntil: '2099-12-31',
        },
        {
          bankName: 'BBVA',
          cardName: 'Mastercard',
          benefit: '20% OFF',
          rewardRate: '20%',
          validUntil: '2020-01-01',
        },
      ],
    });

    expect(html).toContain('<title>Coto &lt;Especial&gt; descuentos y promociones | Blink</title>');
    expect(html).toContain('<h1>Coto &lt;Especial&gt; descuentos y promociones</h1>');
    expect(html).toContain('Banco Galicia y BBVA');
    expect(html).toContain('Buenos Aires');
    expect(html).toContain('Beneficios activos');
    expect(html).toContain('Beneficios anteriores');
    expect(html).toContain('35% OFF &lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(countMatches(html, /rel="canonical"/g)).toBe(1);
    expect(html).toContain('href="https://www.blinkapp.com.ar/comercios/coto--merchant_1"');
    expect(html).toContain('src="/assets/index-test.js"');

    const jsonLd = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    expect(jsonLd).toBeTruthy();
    const structuredData = JSON.parse(jsonLd || '[]') as Array<Record<string, unknown>>;

    expect(structuredData.some((item) => item['@type'] === 'LocalBusiness')).toBe(true);
    expect(structuredData.some((item) => item['@type'] === 'Offer')).toBe(true);
    expect(structuredData.some((item) => item['@type'] === 'BreadcrumbList')).toBe(true);
    expect(structuredData.some((item) => item['@type'] === 'FAQPage')).toBe(true);
  });

  it('uses safe description fallbacks when merchant SEO fields are sparse', () => {
    const html = renderMerchantSeoHtml({
      appShell,
      siteUrl: 'https://www.blinkapp.com.ar',
      path: '/comercios/comercio--merchant_2',
      merchant: {
        merchantId: 'merchant_2',
        merchantName: '',
      },
      benefits: [],
    });

    expect(html).toContain('<title>Comercio descuentos y promociones | Blink</title>');
    expect(html).toContain('en Argentina');
    expect(html).toContain('en comercios');
    expect(html).toContain('bancos seleccionados');
    expect(html).toContain('promociones bancarias');
  });
});
