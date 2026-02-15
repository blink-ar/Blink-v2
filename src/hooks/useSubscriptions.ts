import { useQuery } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { BankSubscription } from '../types/mongodb';
import { fetchBankSubscriptions } from '../services/api';

// Query key for cache management
export const subscriptionsQueryKey = ['bankSubscriptions'] as const;

interface UseSubscriptionsReturn {
    subscriptions: BankSubscription[];
    isLoading: boolean;
    error: string | null;
    getSubscriptionById: (id: string | null | undefined) => BankSubscription | null;
    getSubscriptionName: (id: string | null | undefined) => string | null;
    getSubscriptionsByBank: (bank: string) => BankSubscription[];
}

/**
 * Hook for accessing bank subscriptions data
 * Provides lookup functionality to resolve subscription IDs to names
 */
export function useSubscriptions(): UseSubscriptionsReturn {
    const {
        data: subscriptions = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: subscriptionsQueryKey,
        queryFn: fetchBankSubscriptions,
        staleTime: 1000 * 60 * 30, // 30 minutes - subscriptions rarely change
    });

    // Create a lookup map for O(1) access
    const subscriptionMap = useMemo(() => {
        return new Map(subscriptions.map(sub => [sub.id, sub]));
    }, [subscriptions]);

    // Create a bank-indexed map for filtering
    const subscriptionsByBank = useMemo(() => {
        const map = new Map<string, BankSubscription[]>();
        subscriptions.forEach(sub => {
            const existing = map.get(sub.bank) || [];
            existing.push(sub);
            map.set(sub.bank, existing);
        });
        return map;
    }, [subscriptions]);

    const getSubscriptionById = useCallback((id: string | null | undefined): BankSubscription | null => {
        if (!id) return null;
        return subscriptionMap.get(id) || null;
    }, [subscriptionMap]);

    const getSubscriptionName = useCallback((id: string | null | undefined): string | null => {
        if (!id) return null;
        const subscription = subscriptionMap.get(id);
        return subscription?.name || null;
    }, [subscriptionMap]);

    const getSubscriptionsByBank = useCallback((bank: string): BankSubscription[] => {
        return subscriptionsByBank.get(bank.toLowerCase()) || [];
    }, [subscriptionsByBank]);

    return {
        subscriptions,
        isLoading,
        error: error ? (error as Error).message : null,
        getSubscriptionById,
        getSubscriptionName,
        getSubscriptionsByBank,
    };
}
