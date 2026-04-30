import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BenefitDetailPage from '../BenefitDetailPage';
import { Business } from '../../types';
import { fetchBusinessById, fetchBusinessesPaginated } from '../../services/api';

const routerMocks = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseLocation: vi.fn(),
  mockUseParams: vi.fn()
}));

vi.mock('../../services/api', () => ({
  fetchBusinessById: vi.fn(),
  fetchBusinessesPaginated: vi.fn()
}));

vi.mock('../../analytics/intentTracking', () => ({
  trackSaveBenefit: vi.fn(),
  trackShareBenefit: vi.fn(),
  trackStartNavigation: vi.fn(),
  trackUnsaveBenefit: vi.fn(),
  trackViewBenefit: vi.fn()
}));

vi.mock('../../hooks/useSEO', () => ({
  useSEO: vi.fn()
}));

vi.mock('../../hooks/useSubscriptions', () => ({
  useSubscriptions: () => ({
    subscriptions: [],
    isLoading: false,
    error: null,
    getSubscriptionById: vi.fn(() => null),
    getSubscriptionName: vi.fn(() => null),
    getSubscriptionsByBank: vi.fn(() => [])
  })
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useParams: routerMocks.mockUseParams,
    useNavigate: () => routerMocks.mockNavigate,
    useLocation: routerMocks.mockUseLocation
  };
});

const makeBusiness = (overrides: Partial<Business> = {}): Business => ({
  id: 'merchant_69a6f51cb7ff0ecb9e33bdf3',
  name: "McDonald's",
  category: 'gastronomia',
  description: 'Fast food',
  rating: 5,
  image: 'https://cdn.example.com/mcdonalds.jpg',
  location: [
    {
      lat: -34.614943,
      lng: -58.429508,
      formattedAddress: 'Av. Rivadavia 5108',
      source: 'address',
      provider: 'google',
      confidence: 1,
      raw: 'Av. Rivadavia 5108',
      updatedAt: '2026-04-30T00:00:00.000Z'
    }
  ],
  benefits: [
    {
      bankName: 'Naranja X',
      cardName: 'Visa',
      benefit: '25% reintegro',
      rewardRate: '25%',
      color: '#000000',
      icon: 'credit_card'
    },
    {
      bankName: 'Galicia',
      cardName: 'Mastercard',
      benefit: '30% OFF',
      rewardRate: '30%',
      color: '#000000',
      icon: 'credit_card'
    }
  ],
  ...overrides
});

describe('BenefitDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routerMocks.mockUseLocation.mockReturnValue({ state: null });
    routerMocks.mockUseParams.mockReturnValue({
      id: 'merchant_69a6f51cb7ff0ecb9e33bdf3',
      benefitIndex: '1'
    });
  });

  it('loads direct benefit URLs by exact merchant id when route state is missing', async () => {
    vi.mocked(fetchBusinessById).mockResolvedValue(makeBusiness());

    render(<BenefitDetailPage />);

    await waitFor(() => {
      expect(fetchBusinessById).toHaveBeenCalledWith('merchant_69a6f51cb7ff0ecb9e33bdf3');
    });
    expect(fetchBusinessesPaginated).not.toHaveBeenCalled();
    expect(await screen.findByText("McDonald's")).toBeInTheDocument();
    expect(screen.getByText('Galicia · Mastercard')).toBeInTheDocument();
    expect(screen.getByText('30% OFF')).toBeInTheDocument();
  });

  it('falls back to the legacy search lookup for non-merchant route ids', async () => {
    const legacyBusiness = makeBusiness({
      id: 'legacy-merchant',
      name: 'Legacy Merchant',
      benefits: [
        {
          bankName: 'BBVA',
          cardName: 'Visa',
          benefit: '10% OFF',
          rewardRate: '10%',
          color: '#000000',
          icon: 'credit_card'
        }
      ]
    });

    routerMocks.mockUseParams.mockReturnValue({
      id: 'legacy-merchant',
      benefitIndex: undefined
    });
    vi.mocked(fetchBusinessById).mockResolvedValue(null);
    vi.mocked(fetchBusinessesPaginated).mockResolvedValue({
      success: true,
      businesses: [legacyBusiness],
      pagination: {
        total: 1,
        limit: 1,
        offset: 0,
        hasMore: false
      },
      filters: {
        search: 'legacy merchant'
      }
    });

    render(<BenefitDetailPage />);

    await waitFor(() => {
      expect(fetchBusinessesPaginated).toHaveBeenCalledWith({
        search: 'legacy merchant',
        limit: 1
      });
    });
    expect(await screen.findByText('Legacy Merchant')).toBeInTheDocument();
  });
});
