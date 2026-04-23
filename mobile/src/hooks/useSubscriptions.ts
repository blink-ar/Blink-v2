import { useQuery } from '@tanstack/react-query';
import { fetchBankSubscriptions, BankSubscription } from '../services/api';
import { queryKeys } from './useBenefitsData';

export function useSubscriptions() {
  const { data: subscriptions = [], isLoading, error } = useQuery({
    queryKey: queryKeys.subscriptions,
    queryFn: fetchBankSubscriptions,
    staleTime: 5 * 60 * 1000,
  });

  return {
    subscriptions: subscriptions as BankSubscription[],
    isLoading,
    error: error ? (error as Error).message : null,
  };
}
