import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFallbackSearch } from '../useFallbackSearch';
import { fetchBusinessesPaginated, type BusinessesApiResponse } from '../../services/api';

vi.mock('../../services/api', () => ({ fetchBusinessesPaginated: vi.fn() }));
vi.mock('../useGeolocation', () => ({ useGeolocation: () => ({ position: null, loading: false }) }));

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}
const response = (total: number): BusinessesApiResponse => ({
  success: true, businesses: [], pagination: { total, limit: 10, offset: 0, hasMore: false }, filters: {},
});

describe('fallback query lifecycle', () => {
  beforeEach(() => vi.resetAllMocks());

  it('cancels obsolete other-bank searches and keeps the latest response', async () => {
    let resolveOld!: (value: BusinessesApiResponse) => void;
    vi.mocked(fetchBusinessesPaginated)
      .mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }))
      .mockResolvedValueOnce(response(2));
    const { result, rerender } = renderHook(({ query }) => useFallbackSearch({
      shouldFetchOtherBanks: true, shouldFetchRelative: false,
      filters: { search: query, bank: 'lagaceta' }, searchIntentSignature: query,
    }), { initialProps: { query: 'café' }, wrapper: createWrapper() });
    await waitFor(() => expect(fetchBusinessesPaginated).toHaveBeenCalledTimes(1));
    const oldSignal = vi.mocked(fetchBusinessesPaginated).mock.calls[0][0]!.signal!;
    rerender({ query: 'heladerías' });
    await waitFor(() => expect(result.current.resolvedTotalOtherBanks).toBe(2));
    expect(oldSignal.aborted).toBe(true);
    await act(async () => resolveOld(response(9)));
    expect(result.current.resolvedTotalOtherBanks).toBe(2);
  });

  it('starts a fresh other-bank query when online-only changes without a new text intent', async () => {
    vi.mocked(fetchBusinessesPaginated).mockResolvedValueOnce(response(9)).mockResolvedValueOnce(response(2));
    const { result, rerender } = renderHook(({ online }) => useFallbackSearch({
      shouldFetchOtherBanks: true, shouldFetchRelative: false,
      filters: { search: 'café', bank: 'lagaceta', onlineOnly: online }, searchIntentSignature: 'café|all|lagaceta',
    }), { initialProps: { online: false }, wrapper: createWrapper() });
    await waitFor(() => expect(result.current.resolvedTotalOtherBanks).toBe(9));
    rerender({ online: true });
    await waitFor(() => expect(result.current.resolvedTotalOtherBanks).toBe(2));
    expect(fetchBusinessesPaginated).toHaveBeenCalledTimes(2);
    expect(fetchBusinessesPaginated).toHaveBeenLastCalledWith(expect.objectContaining({ online: true }));
  });
});
