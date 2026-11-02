import { describe, expect, it } from 'vitest';
import { isMerchantBenefitActive, renderMerchantSeoHtml } from '../../../api/merchant-seo.js';

const appShell = [
  '<!doctype html>',
  '<html lang="es">',
  '<head>',
  '  <meta charset="UTF-8" />',
  '  <meta name="description" content="Default description" />',
  '  <meta property="og:title" content="Default title" />',
  '  <link rel="canonical" href="/" />',
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

  it('embeds an escaped business payload for client hydration', () => {
    const bootstrapBusiness = {
      id: 'merchant_1',
      name: 'Coto </script><script>alert(1)</script>',
      category: 'supermercados',
      description: '',
      rating: 5,
      location: [],
      image: '/coto.png',
      benefits: [],
    };
    const html = renderMerchantSeoHtml({
      appShell,
      siteUrl: 'https://www.blinkapp.com.ar',
      path: '/comercios/coto--merchant_1',
      merchant: {
        merchantId: 'merchant_1',
        merchantName: 'Coto',
      },
      bootstrapBusiness,
    });

    const bootstrapJson = html.match(
      /<script id="blink-merchant-bootstrap" type="application\/json">([\s\S]*?)<\/script>/,
    )?.[1];
    expect(bootstrapJson).toBeTruthy();
    expect(html).not.toContain('</script><script>alert(1)</script>');
    expect(JSON.parse(bootstrapJson || '{}')).toEqual({
      merchantId: 'merchant_1',
      business: bootstrapBusiness,
    });
  });

  it('renders multi-bank MODO benefits with compact provider text', () => {
    const longBankName = 'Banco Nación, Galicia, NaranjaX';
    const html = renderMerchantSeoHtml({
      appShell,
      siteUrl: 'https://www.blinkapp.com.ar',
      path: '/comercios/cuesta-blanca--merchant_1',
      now: new Date('2026-05-11T12:00:00.000Z'),
      merchant: {
        merchantId: 'merchant_1',
        merchantName: 'Cuesta Blanca',
        categories: ['moda'],
      },
      benefits: [
        {
          id: 'modo-promos-raw-1',
          bankName: longBankName,
          cardName: 'Tarjeta de credito',
          benefit: '6 cuotas sin interés',
          rewardRate: '6 cuotas s/int',
          installments: 6,
          validUntil: '2099-12-31',
          eligibilities: [
            {
              bank: 'nacion',
              bankDisplayName: 'Banco Nación',
            },
            {
              bank: 'galicia',
              bankDisplayName: 'Galicia',
            },
            {
              bank: 'naranjax',
              bankDisplayName: 'NaranjaX',
            },
          ],
        },
      ],
    });

    expect(html).toContain('MODO - Tarjeta de credito · 3 bancos adheridos');
    expect(html).not.toContain(`${longBankName} - Tarjeta de credito`);

    const jsonLd = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    const structuredData = JSON.parse(jsonLd || '[]') as Array<Record<string, unknown>>;
    const offer = structuredData.find((item) => item['@type'] === 'Offer') as
      | { offeredBy?: { name?: string } }
      | undefined;

    expect(offer?.offeredBy?.name).toBe('MODO');
  });
});


describe('merchant SEO factual promotion claims', () => {
  it('does not advertise a raffle or stale summary as a discount in HTML or schema', () => {
    const html = renderMerchantSeoHtml({ appShell, siteUrl: 'https://www.blinkapp.com.ar',
      merchant: { merchantId: 'm1', merchantName: 'Coto', maxDiscountPercentage: 100 },
      benefits: [{ benefit: 'Sorteo Mega Martes', rewardRate: '100%', tipo: 'descuento', validUntil: '2099-12-31' }],
    });
    expect(html).toContain('Sorteo Mega Martes');
    expect(html).not.toContain('100% OFF');
    expect(html).not.toContain('hasta 100%');
  });

  it('keeps expired discounts out of current description and maximum benefit', () => {
    const html = renderMerchantSeoHtml({ appShell, siteUrl: 'https://www.blinkapp.com.ar',
      merchant: { merchantId: 'm1', merchantName: 'Comercio', maxDiscountPercentage: 90 },
      benefits: [{ benefit: '90% OFF', rewardRate: '90%', validUntil: '2020-01-01' }],
    });
    expect(html).not.toContain('hasta 90%');
    expect(html).toContain('<dt>Mayor beneficio</dt><dd>Promociones bancarias</dd>');
    expect(html).toContain('https://schema.org/Discontinued');
  });

  it('labels reimbursement as reimbursement', () => {
    const html = renderMerchantSeoHtml({ appShell, siteUrl: 'https://www.blinkapp.com.ar',
      merchant: { merchantId: 'm1', merchantName: 'Comercio' },
      benefits: [{ benefit: 'Reintegro', rewardRate: '30%', validUntil: '2099-12-31' }],
    });
    expect(html).toContain('30% de reintegro');
    expect(html).not.toContain('30% OFF');
  });
});


it('SSR shares Argentina-inclusive date-only expiry with the backend', () => {
  const benefit = { validUntil: '2026-10-31' };
  expect(isMerchantBenefitActive(benefit, new Date('2026-11-01T02:59:59Z'))).toBe(true);
  expect(isMerchantBenefitActive(benefit, new Date('2026-11-01T03:00:00Z'))).toBe(false);
});

it('SSR respects canonical null and never infers a discount from title text', () => {
  const html = renderMerchantSeoHtml({ appShell, siteUrl: 'https://www.blinkapp.com.ar', merchant: { merchantId: 'm', merchantName: 'Comercio' }, benefits: [{ benefit: '100% financiado', rewardRate: '100%', discountPercentage: null, installments: 6 }] });
  expect(html).not.toContain('100% OFF');
  expect(html).not.toContain('hasta 100%');
  expect(html).toContain('6 cuotas sin interes');
});
