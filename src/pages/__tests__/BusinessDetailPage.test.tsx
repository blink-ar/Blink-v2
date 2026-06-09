import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BusinessDetailPage from '../BusinessDetailPage';
import { Business } from '../../types';
import { fetchBusinessById } from '../../services/api';
import { useSEO } from '../../hooks/useSEO';

const TEST_SYSTEM_TIME = new Date('2026-05-15T12:00:00.000Z');
const EXPIRED_VALID_UNTIL = '2020-01-01';
const ACTIVE_VALID_UNTIL = '2026-06-30';
const EARLIER_ACTIVE_VALID_UNTIL = '2026-05-31';

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
    toggleFavorite: vi.fn(),
    favorites: [],
    requiresAuth: false
  })
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 'test-user', name: 'Test', email: 'test@example.com' }
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
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(TEST_SYSTEM_TIME);
    vi.clearAllMocks();
    routerMocks.mockUseParams.mockReturnValue({ id: 'merchant_69a6f741b7ff0ecb9e33cf58' });
    routerMocks.mockUseLocation.mockReturnValue({
      state: null,
      pathname: '/business/merchant_69a6f741b7ff0ecb9e33cf58'
    });
  });

  afterEach(() => {
    vi.useRealTimers();
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
          validUntil: EXPIRED_VALID_UNTIL,
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
    expect(screen.getByText(`Venció: ${EXPIRED_VALID_UNTIL}`)).toBeInTheDocument();
  });

  it('shows lower-installment rows from the same bank when validity differs', async () => {
    vi.mocked(fetchBusinessById).mockResolvedValue({
      ...mockBusiness,
      benefits: [
        {
          bankName: 'Naranja X',
          cardName: 'Mastercard',
          benefit: '12 cuotas sin interés',
          rewardRate: '12 cuotas s/int',
          color: '#000000',
          icon: 'credit_card',
          installments: 12,
          cuando: 'Lunes, Martes',
          validUntil: ACTIVE_VALID_UNTIL
        },
        {
          bankName: 'Naranja X',
          cardName: 'Mastercard',
          benefit: '10 cuotas sin interés',
          rewardRate: '10 cuotas s/int',
          color: '#000000',
          icon: 'credit_card',
          installments: 10,
          cuando: 'Lunes, Martes, Miercoles, Jueves, Viernes, Sabado, Domingo',
          validUntil: EARLIER_ACTIVE_VALID_UNTIL
        },
      ],
    });

    render(<BusinessDetailPage />);

    expect(await screen.findByText('hasta 12 cuotas sin interés')).toBeInTheDocument();
    expect(screen.getByText('hasta 10 cuotas sin interés')).toBeInTheDocument();
  });

  it('renders multi-bank MODO installment benefits with a compact provider label', async () => {
    const longBankName = 'Banco Nación, Galicia, NaranjaX';
    vi.mocked(fetchBusinessById).mockResolvedValue({
      ...mockBusiness,
      benefits: [
        {
          id: 'modo-promos-raw-1',
          bankName: longBankName,
          cardName: 'Tarjeta de credito',
          benefit: '6 cuotas sin interés',
          rewardRate: '6 cuotas s/int',
          color: '#000000',
          icon: 'credit_card',
          installments: 6,
          cuando: 'Lunes, Martes, Miercoles, Jueves, Viernes, Sabado, Domingo',
          eligibilities: [
            {
              bank: 'nacion',
              bankDisplayName: 'Banco Nación',
              cardTypes: [],
              cardResolutionStatus: 'not_required',
              subscription: null,
              subscriptionResolutionStatus: 'not_required',
            },
            {
              bank: 'galicia',
              bankDisplayName: 'Galicia',
              cardTypes: [],
              cardResolutionStatus: 'not_required',
              subscription: null,
              subscriptionResolutionStatus: 'not_required',
            },
            {
              bank: 'naranjax',
              bankDisplayName: 'NaranjaX',
              cardTypes: [],
              cardResolutionStatus: 'not_required',
              subscription: null,
              subscriptionResolutionStatus: 'not_required',
            },
          ],
        },
      ],
    });

    render(<BusinessDetailPage />);

    expect(await screen.findByText('hasta 6 cuotas sin interés')).toBeInTheDocument();
    expect(screen.getAllByAltText('Modo').length).toBeGreaterThan(0);
    expect(screen.getByText('3 bancos adheridos')).toBeInTheDocument();
    expect(screen.queryByText(longBankName)).not.toBeInTheDocument();
  });
});
