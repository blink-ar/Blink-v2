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

const BLINK_APEX_HOST = 'blinkapp.com.ar';
const BLINK_CANONICAL_HOST = 'www.blinkapp.com.ar';
const FALLBACK_SITE_URL = `https://${BLINK_CANONICAL_HOST}`;

export function normalizeBlinkSiteUrl(value: string | undefined): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (url.hostname === BLINK_APEX_HOST || url.hostname === BLINK_CANONICAL_HOST) {
      url.protocol = 'https:';
      url.hostname = BLINK_CANONICAL_HOST;
      url.port = '';
    }

    return url.origin.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

const CONFIGURED_SITE_URL = normalizeBlinkSiteUrl(
  import.meta.env.VITE_CANONICAL_SITE_URL ?? import.meta.env.VITE_SITE_URL
);
const CLIENT_STRUCTURED_DATA_SELECTOR = 'script[data-blink-seo="structured-data"]';
const SERVER_STRUCTURED_DATA_SELECTOR = [
  'script[type="application/ld+json"][data-blink-category-seo="structured-data"]',
  'script[type="application/ld+json"][data-blink-merchant-seo="structured-data"]',
  'script[type="application/ld+json"][data-blink-landing-seo="structured-data"]',
].join(', ');

function getSiteUrl(): string {
  if (CONFIGURED_SITE_URL) {
    return CONFIGURED_SITE_URL;
  }

  if (typeof window !== 'undefined' && window.location.origin) {
    return normalizeBlinkSiteUrl(window.location.origin) || FALLBACK_SITE_URL;
  }

  return FALLBACK_SITE_URL;
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

function getComparableSeoPath(pathOrUrl: string): string {
  try {
    const parsed = new URL(pathOrUrl, getSiteUrl());
    return parsed.pathname.replace(/\/+$/, '') || '/';
  } catch {
    return String(pathOrUrl || '').replace(/\/+$/, '') || '/';
  }
}

function getCurrentServerStructuredDataScripts(absoluteUrl: string): HTMLScriptElement[] {
  const currentPath = getComparableSeoPath(absoluteUrl);
  const serverScripts = Array.from(
    document.querySelectorAll<HTMLScriptElement>(SERVER_STRUCTURED_DATA_SELECTOR)
  );

  serverScripts.forEach((script) => {
    const scriptUrl = script.dataset.blinkSeoUrl;
    if (!scriptUrl || getComparableSeoPath(scriptUrl) !== currentPath) {
      script.remove();
    }
  });

  return serverScripts.filter((script) => {
    const scriptUrl = script.dataset.blinkSeoUrl;
    return Boolean(scriptUrl) && script.isConnected && getComparableSeoPath(scriptUrl) === currentPath;
  });
}

function setStructuredData(structuredData: SEOConfig['structuredData'], canonicalPath: string): void {
  const absoluteUrl = toAbsoluteUrl(canonicalPath);
  const previousScripts = document.querySelectorAll<HTMLScriptElement>(CLIENT_STRUCTURED_DATA_SELECTOR);
  previousScripts.forEach((script) => script.remove());

  if (getCurrentServerStructuredDataScripts(absoluteUrl).length > 0) {
    return;
  }

  if (!structuredData) {
    return;
  }

  const items = Array.isArray(structuredData) ? structuredData : [structuredData];
  items.forEach((item) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.blinkSeo = 'structured-data';
    script.dataset.blinkSeoUrl = absoluteUrl;
    script.textContent = JSON.stringify(item);
    document.head.appendChild(script);
  });
}

export function applySEO(config: SEOConfig): void {
  if (typeof document === 'undefined') {
    return;
  }

  const ogImage = toAbsoluteUrl(config.image || DEFAULT_OG_IMAGE);
  const canonicalPath = config.path || '/';
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

  setStructuredData(config.structuredData, canonicalPath);
}
