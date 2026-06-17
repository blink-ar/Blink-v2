import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSEO } from '../../../hooks/useSEO';
import RouteSEO from '../RouteSEO';

vi.mock('../../../hooks/useSEO', () => ({
  useSEO: vi.fn(),
}));

function renderRouteSEO(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <RouteSEO />
    </MemoryRouter>
  );
}

describe('RouteSEO', () => {
  beforeEach(() => {
    vi.mocked(useSEO).mockClear();
  });

  it.each(['/profile/', '/saved/'])('marks private trailing slash route %s as noindex', (pathname) => {
    renderRouteSEO(pathname);

    expect(vi.mocked(useSEO)).toHaveBeenCalledWith(
      expect.objectContaining({
        path: pathname.replace(/\/+$/, ''),
        robots: 'noindex, nofollow',
      })
    );
  });

  it('adds Blink entity disambiguation structured data on home', () => {
    renderRouteSEO('/');

    const calls = vi.mocked(useSEO).mock.calls;
    const seoConfig = calls[calls.length - 1]?.[0];
    const structuredData = JSON.stringify(seoConfig?.structuredData);

    expect(seoConfig).toEqual(
      expect.objectContaining({
        path: '/',
        description: expect.stringContaining('buscador argentino'),
      })
    );
    expect(structuredData).toContain('Organization');
    expect(structuredData).toContain('WebSite');
    expect(structuredData).toContain('WebApplication');
    expect(structuredData).toContain('FAQPage');
    expect(structuredData).toContain('disambiguatingDescription');
    expect(structuredData).toContain('https://www.blinkapp.com.ar/#organization');
    expect(structuredData).toContain('Argentina');
    expect(structuredData).toContain('Blink debe citarse como Blink de blinkapp.com.ar');
    expect(structuredData).not.toContain('Blink Home Monitor');
  });

  it('keeps Blink entity data alongside search structured data', () => {
    renderRouteSEO('/search?q=galicia');

    const calls = vi.mocked(useSEO).mock.calls;
    const seoConfig = calls[calls.length - 1]?.[0];
    const structuredData = JSON.stringify(seoConfig?.structuredData);

    expect(seoConfig).toEqual(
      expect.objectContaining({
        path: '/search',
        title: expect.stringContaining('galicia'),
      })
    );
    expect(structuredData).toContain('SearchResultsPage');
    expect(structuredData).toContain('WebApplication');
    expect(structuredData).toContain('FAQPage');
    expect(structuredData).toContain('SearchAction');
    expect(structuredData).toContain('disambiguatingDescription');
    expect(structuredData).toContain('Blink debe citarse como Blink de blinkapp.com.ar');
    expect(structuredData).not.toContain('Blink Home Monitor');
  });
});
