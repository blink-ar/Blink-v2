import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BusinessDetailPage from '../BusinessDetailPage';
import { Business } from '../../types';
import { fetchBusinessById } from '../../services/api';
import { useSEO } from '../../hooks/useSEO';

const routerMocks = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseLocation: vi.fn(),
  mockUseParams: vi.fn()
}));

vi.mock('../../services/api', () => ({
  fetchBusinessById: vi.fn()
}));

vi.mock('../../analytics/intentTracking', () => ({
  trackSelectBusiness: vi.fn(),
  trackStartNavigation: vi.fn(),
  trackViewBenefit: vi.fn()
}));

vi.mock('../../hooks/useSEO', () => ({
  useSEO: vi.fn()
}));

vi.mock('../../context/FavoritesContext', () => ({
  useFavorites: () => ({
    isFavorite: vi.fn(() => false),
    toggleFavorite: vi.fn()
  })
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useParams: () => routerMocks.mockUseParams(),
    useNavigate: () => routerMocks.mockNavigate,
    useLocation: routerMocks.mockUseLocation
  };
});

const mockBusiness: Business = {
  id: 'merchant_69a6f741b7ff0ecb9e33cf58',
  name: 'Mostaza',
  category: 'gastronomia',
  description: 'Fast food',
  rating: 4.4,
  location: [
    {
      lat: -34.6,
      lng: -58.38,
      formattedAddress: 'Store 1',
      source: 'address',
      provider: 'google',
      confidence: 1,
      raw: 'Store 1',
      updatedAt: '2026-04-20T00:00:00.000Z'
    }
  ],
  image: 'https://cdn.example.com/mostaza.jpg',
  benefits: [
    {
      bankName: 'BBVA',
      cardName: 'Visa',
      benefit: '20% OFF',
      rewardRate: '20%',
      color: '#000000',
      icon: 'credit_card'
    }
  ]
};

describe('BusinessDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routerMocks.mockUseParams.mockReturnValue({ id: 'merchant_69a6f741b7ff0ecb9e33cf58' });
    routerMocks.mockUseLocation.mockReturnValue({
      state: null,
      pathname: '/business/merchant_69a6f741b7ff0ecb9e33cf58'
    });
  });

  it('loads the business by exact merchant id when route state is missing', async () => {
    vi.mocked(fetchBusinessById).mockResolvedValue(mockBusiness);

    render(<BusinessDetailPage />);

    await waitFor(() => {
      expect(fetchBusinessById).toHaveBeenCalledWith(
        'merchant_69a6f741b7ff0ecb9e33cf58',
        { includeExpired: true },
      );
    });
    expect(await screen.findByText('Mostaza')).toBeInTheDocument();
    expect(screen.getByText('gastronomia')).toBeInTheDocument();
    await waitFor(() => {
      expect(routerMocks.mockNavigate).toHaveBeenCalledWith(
        '/comercios/mostaza--merchant_69a6f741b7ff0ecb9e33cf58',
        { replace: true, state: { business: mockBusiness } },
      );
    });
  });

  it('loads canonical merchant URLs by parsed merchant id without redirecting', async () => {
    vi.mocked(fetchBusinessById).mockResolvedValue(mockBusiness);
    routerMocks.mockUseParams.mockReturnValue({
      slugId: 'mostaza--merchant_69a6f741b7ff0ecb9e33cf58'
    });
    routerMocks.mockUseLocation.mockReturnValue({
      state: null,
      pathname: '/comercios/mostaza--merchant_69a6f741b7ff0ecb9e33cf58'
    });

    render(<BusinessDetailPage />);

    await waitFor(() => {
      expect(fetchBusinessById).toHaveBeenCalledWith(
        'merchant_69a6f741b7ff0ecb9e33cf58',
        { includeExpired: true },
      );
    });
    expect(await screen.findByText('Mostaza')).toBeInTheDocument();
    expect(routerMocks.mockNavigate).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(vi.mocked(useSEO)).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/comercios/mostaza--merchant_69a6f741b7ff0ecb9e33cf58'
        }),
      );
    });
  });

  it('renders a not found state when the business id does not resolve', async () => {
    vi.mocked(fetchBusinessById).mockResolvedValue(null);

    render(<BusinessDetailPage />);

    expect(await screen.findByText('Comercio no encontrado')).toBeInTheDocument();
  });

  it('shows previous benefits when the merchant has no active benefits', async () => {
    vi.mocked(fetchBusinessById).mockResolvedValue({
      ...mockBusiness,
      benefits: [
        {
          ...mockBusiness.benefits[0],
          validUntil: '2020-01-01',
        },
      ],
    });
    routerMocks.mockUseParams.mockReturnValue({
      slugId: 'mostaza--merchant_69a6f741b7ff0ecb9e33cf58'
    });
    routerMocks.mockUseLocation.mockReturnValue({
      state: null,
      pathname: '/comercios/mostaza--merchant_69a6f741b7ff0ecb9e33cf58'
    });

    render(<BusinessDetailPage />);

    expect(await screen.findByText('No hay descuentos activos ahora')).toBeInTheDocument();
    expect(screen.getByText('Beneficios anteriores')).toBeInTheDocument();
    expect(screen.getByText('Venció: 2020-01-01')).toBeInTheDocument();
  });
});
