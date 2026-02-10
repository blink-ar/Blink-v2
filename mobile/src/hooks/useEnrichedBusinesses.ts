import { useMemo } from 'react';
import { Business } from '../types';
import { hasOnlineBenefits } from '../utils/distance';

export const useEnrichedBusinesses = (
  businesses: Business[],
  options?: {
    onlineOnly?: boolean;
    minDiscount?: number;
    maxDistance?: number;
    availableDay?: string;
    network?: string;
    cardMode?: 'credit' | 'debit';
    hasInstallments?: boolean;
  }
) => {
  const {
    onlineOnly = false,
    minDiscount,
    maxDistance,
    hasInstallments,
  } = options || {};

  return useMemo(() => {
    let result = businesses.map((business) => ({
      ...business,
      hasOnline: hasOnlineBenefits(business),
    }));

    if (onlineOnly) {
      result = result.filter((b) => b.hasOnline);
    }

    if (maxDistance !== undefined) {
      result = result.filter((b) => {
        if (b.distance === undefined) return true;
        return b.distance <= maxDistance;
      });
    }

    if (minDiscount !== undefined) {
      result = result.filter((b) =>
        b.benefits.some((benefit) => {
          const match = benefit.rewardRate.match(/(\d+)%/);
          return match ? parseInt(match[1]) >= minDiscount : false;
        })
      );
    }

    if (hasInstallments !== undefined) {
      result = result.filter((b) =>
        b.benefits.some((benefit) => {
          if (hasInstallments) {
            return benefit.installments != null && benefit.installments > 0;
          }
          return !benefit.installments;
        })
      );
    }

    return result;
  }, [businesses, onlineOnly, minDiscount, maxDistance, hasInstallments]);
};
