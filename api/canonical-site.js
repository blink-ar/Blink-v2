const BLINK_APEX_HOST = 'blinkapp.com.ar';
const BLINK_CANONICAL_HOST = 'www.blinkapp.com.ar';

export const DEFAULT_CANONICAL_SITE_URL = `https://${BLINK_CANONICAL_HOST}`;

function cleanSiteUrlValue(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';

  const firstChar = trimmed[0];
  const lastChar = trimmed[trimmed.length - 1];
  const hasMatchingQuotes =
    (firstChar === '"' || firstChar === "'") && lastChar === firstChar;
  const unquoted = hasMatchingQuotes ? trimmed.slice(1, -1).trim() : trimmed;

  if (!unquoted || /["'<>]/.test(unquoted)) return '';

  return unquoted;
}

export function normalizeSiteUrl(value) {
  const trimmed = cleanSiteUrlValue(value);
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

export function resolveCanonicalSiteUrl(...candidates) {
  for (const candidate of candidates) {
    const normalized = normalizeSiteUrl(candidate);
    if (normalized) return normalized;
  }

  return DEFAULT_CANONICAL_SITE_URL;
}
