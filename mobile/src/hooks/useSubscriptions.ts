import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBankSubscriptions, BankSubscription } from '../services/api';
import { queryKeys } from './useBenefitsData';

export function useSubscriptions() {
  const { data: subscriptions = [], isLoading, error } = useQuery({
    queryKey: queryKeys.subscriptions,
    queryFn: fetchBankSubscriptions,
    staleTime: 5 * 60 * 1000,
  });

  const subscriptionMap = useMemo(
    () => new Map((subscriptions as BankSubscription[]).map((s) => [s.id, s])),
    [subscriptions],
  );

  const getSubscriptionName = (id: string | null | undefined): string | null => {
    if (!id) return null;
    return subscriptionMap.get(id)?.name || null;
  };

  return {
    subscriptions: subscriptions as BankSubscription[],
    isLoading,
    error: error ? (error as Error).message : null,
    getSubscriptionName,
  };
}
