export const MERCHANT_SEO_PATH_PREFIX = '/comercios';
const MERCHANT_SEO_DELIMITER = '--';

export interface MerchantSeoIdentity {
  id: string;
  name?: string | null;
}

export interface ParsedMerchantSeoParam {
  slug: string;
  merchantId: string;
}

export function slugifyMerchantName(value: unknown): string {
  const slug = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s+/g, '-');

  return slug || 'comercio';
}

export function getMerchantSeoPath(merchant: MerchantSeoIdentity): string {
  const merchantId = String(merchant.id || '').trim();
  if (!merchantId) {
    throw new Error('Merchant SEO path requires an id');
  }

  const slug = slugifyMerchantName(merchant.name);
  return `${MERCHANT_SEO_PATH_PREFIX}/${slug}${MERCHANT_SEO_DELIMITER}${encodeURIComponent(merchantId)}`;
}

export function parseMerchantSeoParam(param: string | undefined): ParsedMerchantSeoParam | null {
  if (!param) return null;

  const delimiterIndex = param.lastIndexOf(MERCHANT_SEO_DELIMITER);
  if (delimiterIndex <= 0 || delimiterIndex + MERCHANT_SEO_DELIMITER.length >= param.length) {
    return null;
  }

  const slug = param.slice(0, delimiterIndex);
  const rawMerchantId = param.slice(delimiterIndex + MERCHANT_SEO_DELIMITER.length);
  let merchantId: string;

  try {
    merchantId = decodeURIComponent(rawMerchantId).trim();
  } catch {
    return null;
  }

  if (!slug || !merchantId) {
    return null;
  }

  return { slug, merchantId };
}
