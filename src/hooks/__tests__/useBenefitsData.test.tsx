import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBenefitsData } from '../useBenefitsData';
import { fetchBusinessesPaginated } from '../../services/api';
import { getRawBenefits } from '../../services/rawBenefitsApi';
import { type Business } from '../../types';

vi.mock('../../services/api', () => ({
  fetchBusinessesPaginated: vi.fn(),
}));

vi.mock('../../services/rawBenefitsApi', () => ({
  getRawBenefits: vi.fn(),
}));

vi.mock('../useGeolocation', () => ({
  useGeolocation: () => ({
    position: null,
    loading: false,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

const mockBusiness: Business = {
  id: 'merchant_1',
  name: 'Cafe Market',
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

describe('useBenefitsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getRawBenefits).mockResolvedValue([]);
  });

  it('surfaces unsuccessful business responses as primary search errors', async () => {
    vi.mocked(fetchBusinessesPaginated).mockResolvedValue({
      success: false,
      businesses: [],
      pagination: {
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false,
      },
      filters: {},
    });

    const { result } = renderHook(() => useBenefitsData({ search: 'prune' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.primarySearchError).toBe('Business search failed');
    });

    expect(result.current.error).toBe('Business search failed');
    expect(result.current.businesses).toEqual([]);
    expect(fetchBusinessesPaginated).toHaveBeenCalledWith(expect.objectContaining({ view: 'summary' }));
  });

  it('requests the full payload when a client-side benefit filter needs every benefit', async () => {
    vi.mocked(fetchBusinessesPaginated).mockResolvedValue({
      success: true,
      businesses: [mockBusiness],
      pagination: { total: 1, limit: 20, offset: 0, hasMore: false },
      filters: {},
    });

    renderHook(() => useBenefitsData({ network: 'visa' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(fetchBusinessesPaginated).toHaveBeenCalledWith(expect.objectContaining({ view: 'full' }));
    });
  });

  it('stops pagination without surfacing a primary error when a later page fails', async () => {
    vi.mocked(fetchBusinessesPaginated)
      .mockResolvedValueOnce({
        success: true,
        businesses: [mockBusiness],
        pagination: {
          total: 40,
          limit: 20,
          offset: 0,
          hasMore: true,
        },
        filters: {},
      })
      .mockResolvedValueOnce({
        success: false,
        businesses: [],
        pagination: {
          total: 0,
          limit: 20,
          offset: 20,
          hasMore: true,
        },
        filters: {},
      });

    const { result } = renderHook(() => useBenefitsData({ search: 'cafe' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.businesses).toEqual([mockBusiness]);
      expect(result.current.hasMore).toBe(true);
    });

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(fetchBusinessesPaginated).toHaveBeenCalledTimes(2);
      expect(result.current.isLoadingMore).toBe(false);
    });

    expect(result.current.primarySearchError).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.businesses).toEqual([mockBusiness]);
    expect(result.current.hasMore).toBe(false);
  });

  it('aborts an obsolete query and keeps late responses from replacing the latest results', async () => {
    let resolveOld!: (value: Awaited<ReturnType<typeof fetchBusinessesPaginated>>) => void;
    const response = (business: Business) => ({ success: true, businesses: [business], pagination: { total: 1, limit: 20, offset: 0, hasMore: false }, filters: {} });
    const latest = { ...mockBusiness, id: 'blue-bell', name: 'Blue Bell' };
    vi.mocked(fetchBusinessesPaginated)
      .mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }))
      .mockResolvedValueOnce(response(latest));
    const { result, rerender } = renderHook(({ query }) => useBenefitsData({ search: query }), { initialProps: { query: 'café' }, wrapper: createWrapper() });
    await waitFor(() => expect(fetchBusinessesPaginated).toHaveBeenCalledTimes(1));
    const oldSignal = vi.mocked(fetchBusinessesPaginated).mock.calls[0][0]!.signal!;
    expect(oldSignal.aborted).toBe(false);
    rerender({ query: 'heladerías' });
    await waitFor(() => expect(result.current.businesses).toEqual([latest]));
    expect(oldSignal.aborted).toBe(true);
    await act(async () => { resolveOld(response(mockBusiness)); });
    expect(result.current.businesses).toEqual([latest]);
    expect(result.current.primarySearchError).toBeNull();
  });
});
