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
});
