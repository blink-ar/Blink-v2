import { useMemo } from 'react';
import { Business } from '../types';
import { hasOnlineBenefits } from '../utils/distance';

/**
 * Enriches businesses with online information and applies filters
 * Note: Distance calculation and sorting by proximity are now handled by the backend
 */
export const useEnrichedBusinesses = (
  businesses: Business[],
  options?: {
    onlineOnly?: boolean; // Filter to show only online
    minDiscount?: number; // Minimum discount percentage
    maxDistance?: number; // Maximum distance in km
    availableDay?: string; // Specific day of the week
    network?: string; // Payment network (VISA, Mastercard, etc.)
    cardMode?: 'credit' | 'debit'; // Card type
    hasInstallments?: boolean; // Filter for installment availability
  }
) => {
  const {
    onlineOnly = false,
    minDiscount,
    maxDistance,
    availableDay,
    network,
    cardMode,
    hasInstallments,
  } = options || {};

  const enrichedBusinesses = useMemo(() => {
    // Add hasOnline flag to each business
    let result = businesses.map((business) => {
      // Check if has online benefits
      const hasOnline = hasOnlineBenefits(business);

      return {
        ...business,
        hasOnline,
      };
    });

    // Apply online filter if requested
    if (onlineOnly) {
      result = result.filter((b) => b.hasOnline);
    }

    // Apply distance filter (only if distance is available)
    if (maxDistance !== undefined) {
      result = result.filter((b) => {
        if (b.distance === undefined) return true; // Include businesses without distance info
        return b.distance <= maxDistance;
      });
    }

    // Apply minimum discount filter
    if (minDiscount !== undefined) {
      result = result.filter((b) => {
        // Check if any benefit meets the minimum discount
        return b.benefits.some((benefit) => {
          // Extract percentage from rewardRate (e.g., "20%" -> 20)
          const percentageMatch = benefit.rewardRate.match(/(\d+)%/);
          if (percentageMatch) {
            const percentage = parseInt(percentageMatch[1]);
            return percentage >= minDiscount;
          }
          return false;
        });
      });
    }

    // Apply available day filter
    if (availableDay !== undefined) {
      result = result.filter((b) => {
        // For "today", we need to check current day of week
        let dayToCheck = availableDay;
        if (availableDay === 'today') {
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const today = new Date().getDay();
          dayToCheck = days[today];
        }

        // Check if any benefit is available on this day
        // Note: availableDays field is not on BankBenefit, so we'll check if the business
        // has benefits (if no availableDays, assume it's available all days)
        // This filter might need backend support to work properly
        return true; // For now, allow all until we have proper data structure
      });
    }

    // Apply network filter
    if (network !== undefined) {
      result = result.filter((b) => {
        // Check if any benefit matches the network
        // Note: BankBenefit doesn't have network field, this would need backend support
        return true; // For now, allow all until we have proper data structure
      });
    }

    // Apply card mode filter (credit/debit)
    if (cardMode !== undefined) {
      result = result.filter((b) => {
        // Check if any benefit supports the card mode
        // Note: BankBenefit doesn't have cardMode field, this would need backend support
        return true; // For now, allow all until we have proper data structure
      });
    }

    // Apply installments filter
    if (hasInstallments !== undefined) {
      result = result.filter((b) => {
        // Check if any benefit has installments
        return b.benefits.some((benefit) => {
          if (hasInstallments) {
            // User wants benefits with installments
            return benefit.installments !== undefined && benefit.installments !== null && benefit.installments > 0;
          } else {
            // User wants benefits without installments
            return benefit.installments === undefined || benefit.installments === null || benefit.installments === 0;
          }
        });
      });
    }

    // Backend already sorts by distance, so we preserve that order
    return result;
  }, [businesses, onlineOnly, minDiscount, maxDistance, availableDay, network, cardMode, hasInstallments]);

  return enrichedBusinesses;
};
