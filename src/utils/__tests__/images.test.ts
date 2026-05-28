import { describe, expect, it } from 'vitest';
import { getOptimizedImageUrl, normalizeImageUrl } from '../images';

describe('image URL helpers', () => {
  it('upgrades insecure image URLs to HTTPS', () => {
    expect(normalizeImageUrl('http://example.com/image.png')).toBe('https://example.com/image.png');
  });

  it('adds compressed Pexels parameters for the requested display width', () => {
    const url = getOptimizedImageUrl('https://images.pexels.com/photos/123/photo.jpeg?w=400', { width: 96 });

    expect(url).toBe('https://images.pexels.com/photos/123/photo.jpeg?w=96&auto=compress&cs=tinysrgb');
  });

  it('keeps non-Pexels image URLs otherwise unchanged after normalization', () => {
    expect(getOptimizedImageUrl('http://cdn.example.com/logo.png?size=large', { width: 96 })).toBe(
      'https://cdn.example.com/logo.png?size=large',
    );
  });
});
