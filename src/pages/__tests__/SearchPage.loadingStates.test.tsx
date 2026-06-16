import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SearchPage from '../SearchPage';
import { useBenefitsData } from '../../hooks/useBenefitsData';
import { useFallbackSearch } from '../../hooks/useFallbackSearch';
import { useEnrichedBusinesses } from '../../hooks/useEnrichedBusinesses';
import { trackSearchError } from '../../analytics/intentTracking';
import { type Business } from '../../types';

const queryMocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  useInfiniteQuery: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: queryMocks.useQuery,
  useInfiniteQuery: queryMocks.useInfiniteQuery,
}));

vi.mock('../../hooks/useBenefitsData', () => ({
  useBenefitsData: vi.fn(),
}));

vi.mock('../../hooks/useFallbackSearch', () => ({
  useFallbackSearch: vi.fn(),
}));

vi.mock('../../hooks/useEnrichedBusinesses', () => ({
  useEnrichedBusinesses: vi.fn(),
}));

vi.mock('../../hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    position: null,
    loading: false,
    permissionDenied: false,
    requestPermission: vi.fn(),
  }),
}));

vi.mock('../../components/neo/BottomNav', () => ({
  default: () => null,
}));

vi.mock('../../components/neo/BankFilterSheet', () => ({
  default: () => null,
}));

vi.mock('../../components/neo/CategoryFilterSheet', () => ({
  CATEGORY_OPTIONS: [
    { token: 'gastronomia', label: 'Gastronomia', emoji: '' },
  ],
  default: () => null,
}));

vi.mock('../../components/neo/UnifiedFilterSheet', () => ({
  DAY_OPTIONS: [],
  DISCOUNT_OPTIONS: [],
  default: () => null,
}));

vi.mock('../../components/BusinessResultCard', () => ({
  default: () => null,
}));

vi.mock('../../services/api', () => ({
  fetchBanks: vi.fn(),
  fetchBusinessesPaginated: vi.fn(),
  fetchBusinessById: vi.fn(),
}));

vi.mock('../../analytics/intentTracking', () => ({
  trackFilterApply: vi.fn(),
  trackNoResults: vi.fn(),
  trackSearchError: vi.fn(),
  trackSearchIntent: vi.fn(),
  trackSelectBusiness: vi.fn(),
}));

const renderSearchPage = (initialEntry = '/buscar?q=prune') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SearchPage />
    </MemoryRouter>,
  );

const mockBusiness: Business = {
  id: 'merchant_1',
  name: 'Prune Market',
  category: 'gastronomia',
  description: 'Market',
  rating: 4.5,
  location: [],
  image: '',
  benefits: [
    {
      bankName: 'Galicia',
      cardName: 'Visa',
      benefit: '20% OFF',
      rewardRate: '20%',
      color: '#000',
      icon: 'credit_card',
    },
  ],
};

describe('SearchPage loading states', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    window.scrollTo = vi.fn();
    window.IntersectionObserver = vi.fn(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
      takeRecords: vi.fn(() => []),
    })) as unknown as typeof IntersectionObserver;

    queryMocks.useQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isFetched: true,
      isError: false,
    });
    queryMocks.useInfiniteQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
    });

    vi.mocked(useBenefitsData).mockReturnValue({
      businesses: [],
      featuredBenefits: [],
      isLoading: false,
      isPrimarySearchLoading: false,
      isLoadingMore: false,
      error: null,
      primarySearchError: null,
      hasMore: false,
      loadMore: vi.fn(),
      refreshData: vi.fn(),
      totalBusinesses: 0,
      proximityUnavailable: false,
    });
    vi.mocked(useEnrichedBusinesses).mockReturnValue([]);
  });

  it('keeps the loader visible while fallback calls are still pending', () => {
    vi.mocked(useFallbackSearch).mockReturnValue({
      otherBanksBusinesses: [],
      resolvedTotalOtherBanks: 0,
      isOtherBanksLoading: false,
      isOtherBanksSearchLoading: false,
      relativeBusinesses: [],
      isRelativeLoading: true,
      isRelativeSearchLoading: true,
      isFallbackSearchLoading: true,
    });

    renderSearchPage();

    expect(screen.getByRole('status', { name: 'Cargando resultados' })).toBeInTheDocument();
    expect(screen.getByText('Buscando...')).toBeInTheDocument();
    expect(screen.queryByText(/No encontramos/)).not.toBeInTheDocument();
  });

  it('shows the not-found state only after fallback calls have settled', () => {
    vi.mocked(useFallbackSearch).mockReturnValue({
      otherBanksBusinesses: [],
      resolvedTotalOtherBanks: 0,
      isOtherBanksLoading: false,
      isOtherBanksSearchLoading: false,
      relativeBusinesses: [],
      isRelativeLoading: false,
      isRelativeSearchLoading: false,
      isFallbackSearchLoading: false,
    });

    renderSearchPage();

    expect(screen.queryByRole('status', { name: 'Cargando resultados' })).not.toBeInTheDocument();
    expect(screen.getByText('No encontramos "prune"')).toBeInTheDocument();
  });

  it('does not block the terminal state on unrelated featured-benefits loading', () => {
    vi.mocked(useBenefitsData).mockReturnValue({
      businesses: [],
      featuredBenefits: [],
      isLoading: true,
      isPrimarySearchLoading: false,
      isLoadingMore: false,
      error: null,
      primarySearchError: null,
      hasMore: false,
      loadMore: vi.fn(),
      refreshData: vi.fn(),
      totalBusinesses: 0,
      proximityUnavailable: false,
    });
    vi.mocked(useFallbackSearch).mockReturnValue({
      otherBanksBusinesses: [],
      resolvedTotalOtherBanks: 0,
      isOtherBanksLoading: false,
      isOtherBanksSearchLoading: false,
      relativeBusinesses: [],
      isRelativeLoading: false,
      isRelativeSearchLoading: false,
      isFallbackSearchLoading: false,
    });

    renderSearchPage();

    expect(screen.queryByRole('status', { name: 'Cargando resultados' })).not.toBeInTheDocument();
    expect(screen.getByText('No encontramos "prune"')).toBeInTheDocument();
  });

  it('renders a primary search error with retry and neutral suggestions', async () => {
    const refreshData = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useBenefitsData).mockReturnValue({
      businesses: [],
      featuredBenefits: [],
      isLoading: false,
      isPrimarySearchLoading: false,
      isLoadingMore: false,
      error: 'Search failed',
      primarySearchError: 'Search failed',
      hasMore: false,
      loadMore: vi.fn(),
      refreshData,
      totalBusinesses: 0,
      proximityUnavailable: false,
    });
    vi.mocked(useFallbackSearch).mockReturnValue({
      otherBanksBusinesses: [],
      resolvedTotalOtherBanks: 0,
      isOtherBanksLoading: false,
      isOtherBanksSearchLoading: false,
      relativeBusinesses: [],
      isRelativeLoading: true,
      isRelativeSearchLoading: true,
      isFallbackSearchLoading: true,
    });

    renderSearchPage();

    expect(screen.queryByRole('status', { name: 'Cargando resultados' })).not.toBeInTheDocument();
    expect(screen.getByText('No disponible')).toBeInTheDocument();
    expect(screen.getByText('No pudimos buscar ahora')).toBeInTheDocument();
    expect(screen.queryByText(/No encontramos/)).not.toBeInTheDocument();
    expect(screen.getByText(/interese/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }));

    expect(refreshData).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(vi.mocked(trackSearchError)).toHaveBeenCalledWith({
        source: 'search_page',
        searchTerm: 'prune',
        activeFilterCount: expect.any(Number),
        category: undefined,
        errorMessage: 'Search failed',
      });
    });
  });

  it('shows other-bank results without waiting for popular fallback suggestions', () => {
    vi.mocked(useFallbackSearch).mockReturnValue({
      otherBanksBusinesses: [mockBusiness],
      resolvedTotalOtherBanks: 1,
      isOtherBanksLoading: false,
      isOtherBanksSearchLoading: false,
      relativeBusinesses: [],
      isRelativeLoading: true,
      isRelativeSearchLoading: true,
      isFallbackSearchLoading: true,
    });

    renderSearchPage('/buscar?q=prune&bank=bbva');

    expect(screen.queryByRole('status', { name: 'Cargando resultados' })).not.toBeInTheDocument();
    expect(screen.getByText('No hay resultados para tus bancos')).toBeInTheDocument();
    expect(screen.getByText('1 opción')).toBeInTheDocument();
    expect(screen.queryByText(/No encontramos/)).not.toBeInTheDocument();
  });
});
