import { beforeEach, describe, expect, it } from 'vitest';
import { applySEO, toAbsoluteUrl } from '../seo';

function addServerStructuredData(
  kind: 'merchant' | 'category' | 'core',
  url: string | undefined,
  value: unknown
): HTMLScriptElement {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  if (kind === 'merchant') {
    script.dataset.blinkMerchantSeo = 'structured-data';
  } else if (kind === 'category') {
    script.dataset.blinkCategorySeo = 'structured-data';
  } else {
    script.dataset.blinkCoreSeo = 'structured-data';
  }
  if (url) {
    script.dataset.blinkSeoUrl = url;
  }
  script.textContent = JSON.stringify(value);
  document.head.appendChild(script);
  return script;
}

describe('applySEO structured data handling', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('preserves matching server-rendered JSON-LD instead of replacing it with client schema', () => {
    const url = 'https://www.blinkapp.com.ar/comercios/coto--merchant_1';
    addServerStructuredData('merchant', url, [
      { '@context': 'https://schema.org', '@type': 'LocalBusiness', name: 'Coto' },
      { '@context': 'https://schema.org', '@type': 'FAQPage' },
    ]);

    applySEO({
      title: 'Coto | Blink',
      description: 'Client description',
      path: '/comercios/coto--merchant_1',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Thin client schema',
      },
    });

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    expect(scripts[0].textContent).toContain('FAQPage');
    expect(scripts[0]).toHaveAttribute('data-blink-merchant-seo', 'structured-data');
    expect(document.querySelector('script[data-blink-seo="structured-data"]')).toBeNull();
  });

  it('preserves matching core server-rendered JSON-LD instead of duplicating client schema', () => {
    addServerStructuredData('core', toAbsoluteUrl('/'), [
      { '@context': 'https://schema.org', '@type': 'Organization', name: 'Blink' },
      { '@context': 'https://schema.org', '@type': 'WebSite' },
    ]);

    applySEO({
      title: 'Descuentos bancarios en Argentina | Blink',
      description: 'Client description',
      path: '/',
      structuredData: [
        { '@context': 'https://schema.org', '@type': 'Organization', name: 'Thin client schema' },
        { '@context': 'https://schema.org', '@type': 'WebSite' },
      ],
    });

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toHaveAttribute('data-blink-core-seo', 'structured-data');
    expect(scripts[0].textContent).toContain('Organization');
    expect(scripts[0].textContent).not.toContain('Thin client schema');
    expect(document.querySelector('script[data-blink-seo="structured-data"]')).toBeNull();
  });

  it('removes stale server-rendered JSON-LD before writing client schema for the current route', () => {
    addServerStructuredData('category', 'https://www.blinkapp.com.ar/categorias/gastronomia', [
      { '@context': 'https://schema.org', '@type': 'CollectionPage' },
    ]);

    applySEO({
      title: 'Buscar descuentos | Blink',
      description: 'Busca descuentos',
      path: '/search',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'SearchResultsPage',
        name: 'Buscar descuentos',
      },
    });

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toHaveAttribute('data-blink-seo', 'structured-data');
    expect(scripts[0]).toHaveAttribute('data-blink-seo-url', toAbsoluteUrl('/search'));
    expect(scripts[0].textContent).toContain('SearchResultsPage');
  });

  it('preserves legacy untagged server-rendered JSON-LD on first hydration', () => {
    addServerStructuredData('category', undefined, [
      { '@context': 'https://schema.org', '@type': 'CollectionPage' },
    ]);

    applySEO({
      title: 'Comercios de Gastronomia | Blink',
      description: 'Categoria',
      path: '/categorias/gastronomia',
    });

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toHaveAttribute('data-blink-category-seo', 'structured-data');
    expect(scripts[0]).toHaveAttribute(
      'data-blink-seo-url',
      toAbsoluteUrl('/categorias/gastronomia')
    );
    expect(scripts[0].textContent).toContain('CollectionPage');
  });

  it('removes legacy untagged server-rendered JSON-LD after route change', () => {
    addServerStructuredData('merchant', undefined, [
      { '@context': 'https://schema.org', '@type': 'LocalBusiness', name: 'Old Merchant' },
    ]);

    applySEO({
      title: 'Old Merchant | Blink',
      description: 'Server description',
      path: '/comercios/old-merchant--merchant_1',
    });

    const firstHydrationScripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(firstHydrationScripts).toHaveLength(1);
    expect(firstHydrationScripts[0]).toHaveAttribute(
      'data-blink-seo-url',
      toAbsoluteUrl('/comercios/old-merchant--merchant_1')
    );
    expect(firstHydrationScripts[0].textContent).toContain('Old Merchant');

    applySEO({
      title: 'Buscar descuentos | Blink',
      description: 'Busca descuentos',
      path: '/search',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'SearchResultsPage',
        name: 'Buscar descuentos',
      },
    });

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toHaveAttribute('data-blink-seo', 'structured-data');
    expect(scripts[0]).toHaveAttribute('data-blink-seo-url', toAbsoluteUrl('/search'));
    expect(scripts[0].textContent).toContain('SearchResultsPage');
    expect(scripts[0].textContent).not.toContain('Old Merchant');
  });

  it('keeps matching server-rendered JSON-LD when the hydrated route has no client schema', () => {
    const url = 'https://www.blinkapp.com.ar/categorias/gastronomia';
    addServerStructuredData('category', url, [
      { '@context': 'https://schema.org', '@type': 'CollectionPage' },
    ]);

    applySEO({
      title: 'Comercios de Gastronomia | Blink',
      description: 'Categoria',
      path: '/categorias/gastronomia',
    });

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toHaveAttribute('data-blink-category-seo', 'structured-data');
    expect(scripts[0].textContent).toContain('CollectionPage');
  });
});
