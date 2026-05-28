type ImageOptimizationOptions = {
  width?: number;
};

export function normalizeImageUrl(src: string | null | undefined): string {
  const trimmed = src?.trim() ?? '';
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('http://')) {
    return `https://${trimmed.slice('http://'.length)}`;
  }

  return trimmed;
}

export function getOptimizedImageUrl(
  src: string | null | undefined,
  options: ImageOptimizationOptions = {},
): string {
  const normalized = normalizeImageUrl(src);
  if (!normalized) {
    return '';
  }

  try {
    const url = new URL(normalized);

    if (url.hostname === 'images.pexels.com') {
      url.searchParams.set('auto', 'compress');
      url.searchParams.set('cs', 'tinysrgb');

      if (options.width && options.width > 0) {
        url.searchParams.set('w', String(Math.round(options.width)));
      }
    }

    return url.toString();
  } catch {
    return normalized;
  }
}
