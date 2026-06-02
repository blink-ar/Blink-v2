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
});
