import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBenefitsData } from '../useBenefitsData';
import { fetchBusinessesPaginated } from '../../services/api';
import { getRawBenefits } from '../../services/rawBenefitsApi';

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
});
