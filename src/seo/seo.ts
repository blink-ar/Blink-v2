export interface SEOConfig {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  keywords?: string[];
  robots?: string;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export const SITE_NAME = 'Blink';
export const DEFAULT_OG_IMAGE = '/pwa-512x512.png';

const FALLBACK_SITE_URL = 'https://example.com';
const CONFIGURED_SITE_URL = (import.meta.env.VITE_SITE_URL ?? '').trim().replace(/\/$/, '');

function getSiteUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }

  return CONFIGURED_SITE_URL || FALLBACK_SITE_URL;
}

export function toAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const siteUrl = getSiteUrl();
  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${siteUrl}${normalizedPath}`;
}

function setMetaTag(attribute: 'name' | 'property', key: string, content: string): void {
  let element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

function removeMetaTag(attribute: 'name' | 'property', key: string): void {
  const element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  element?.remove();
}

function setCanonical(path: string): void {
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }

  canonical.setAttribute('href', toAbsoluteUrl(path));
}

function setStructuredData(structuredData: SEOConfig['structuredData']): void {
  const previousScripts = document.querySelectorAll<HTMLScriptElement>('script[data-blink-seo="structured-data"]');
  previousScripts.forEach((script) => script.remove());

  if (!structuredData) {
    return;
  }

  const items = Array.isArray(structuredData) ? structuredData : [structuredData];
  items.forEach((item) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.blinkSeo = 'structured-data';
    script.textContent = JSON.stringify(item);
    document.head.appendChild(script);
  });
}

export function applySEO(config: SEOConfig): void {
  if (typeof document === 'undefined') {
    return;
  }

  const ogImage = toAbsoluteUrl(config.image || DEFAULT_OG_IMAGE);
  const canonicalPath = config.path || '/home';
  const title = config.title;
  const keywords = config.keywords?.join(', ');
  const robots = config.robots || 'index, follow';
  const seoType = config.type || 'website';

  document.title = title;
  setCanonical(canonicalPath);

  setMetaTag('name', 'description', config.description);
  setMetaTag('name', 'robots', robots);

  if (keywords) {
    setMetaTag('name', 'keywords', keywords);
  } else {
    removeMetaTag('name', 'keywords');
  }

  const absoluteUrl = toAbsoluteUrl(canonicalPath);
  setMetaTag('property', 'og:site_name', SITE_NAME);
  setMetaTag('property', 'og:locale', 'es_AR');
  setMetaTag('property', 'og:type', seoType);
  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', config.description);
  setMetaTag('property', 'og:url', absoluteUrl);
  setMetaTag('property', 'og:image', ogImage);

  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', title);
  setMetaTag('name', 'twitter:description', config.description);
  setMetaTag('name', 'twitter:image', ogImage);

  setStructuredData(config.structuredData);
}
