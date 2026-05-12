import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type ReactNode } from 'react';
import LandingPage from '../LandingPage';
import { Business } from '../../types';
import { useSEO } from '../../hooks/useSEO';
import { useQuery } from '@tanstack/react-query';

const routerMocks = vi.hoisted(() => ({
  mockUseLocation: vi.fn(),
  mockUseParams: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  fetchBusinessesPaginated: vi.fn(),
}));

vi.mock('../../hooks/useSEO', () => ({
  useSEO: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
      <a href={to} {...props}>{children}</a>
    ),
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
    useLocation: () => routerMocks.mockUseLocation(),
    useParams: () => routerMocks.mockUseParams(),
  };
});

const cotoBusiness: Business = {
  id: 'merchant_1',
  name: 'Coto',
  category: 'shopping',
  description: 'Supermercado',
  rating: 5,
  location: [],
  image: '',
  benefits: [
    {
      bankName: 'Banco Galicia',
      cardName: 'Visa',
      benefit: '25% OFF',
      rewardRate: '25%',
      color: '#000000',
      icon: 'credit_card',
    },
  ],
};

describe('LandingPage merchant SEO URLs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routerMocks.mockUseParams.mockReturnValue({ bank: 'galicia', category: 'shopping' });
    routerMocks.mockUseLocation.mockReturnValue({ pathname: '/descuentos/galicia/shopping' });
    vi.mocked(useQuery).mockReturnValue({
      data: [cotoBusiness],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useQuery>);
  });

  it('uses canonical merchant URLs in links and ItemList structured data', () => {
    render(<LandingPage />);

    expect(screen.getByRole('link', { name: /Coto/i })).toHaveAttribute(
      'href',
      '/comercios/coto--merchant_1',
    );

    const seoConfig = vi.mocked(useSEO).mock.calls.at(-1)?.[0];
    const structuredData = Array.isArray(seoConfig?.structuredData) ? seoConfig.structuredData : [];
    const itemList = structuredData.find((item) => item['@type'] === 'ItemList');

    expect(itemList?.itemListElement).toEqual([
      expect.objectContaining({
        name: 'Coto',
        url: expect.stringContaining('/comercios/coto--merchant_1'),
      }),
    ]);
  });
});
