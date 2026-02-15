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

    // Apply available day filter using benefit.cuando field
    if (availableDay !== undefined) {
      const dayMap: Record<string, string[]> = {
        monday: ['lunes', 'lun'],
        tuesday: ['martes', 'mar'],
        wednesday: ['miércoles', 'miercoles', 'mié', 'mie'],
        thursday: ['jueves', 'jue'],
        friday: ['viernes', 'vie'],
        saturday: ['sábado', 'sabado', 'sáb', 'sab'],
        sunday: ['domingo', 'dom'],
      };

      let dayToCheck = availableDay;
      if (availableDay === 'today') {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        dayToCheck = days[new Date().getDay()];
      }

      const keywords = dayMap[dayToCheck] || [];

      result = result.filter((b) =>
        b.benefits.some((benefit) => {
          if (!benefit.cuando) return true; // No schedule info = assume always available
          const cuando = benefit.cuando.toLowerCase();
          // "todos los días" means every day
          if (cuando.includes('todos los d') || cuando.includes('todos los dias')) return true;
          return keywords.some((kw) => cuando.includes(kw));
        }),
      );
    }

    // Apply network filter using benefit.cardName field
    if (network !== undefined) {
      const networkLower = network.toLowerCase();
      result = result.filter((b) =>
        b.benefits.some((benefit) => {
          const card = (benefit.cardName || '').toLowerCase();
          const desc = (benefit.description || '').toLowerCase();
          const cond = (benefit.condicion || '').toLowerCase();
          return card.includes(networkLower) || desc.includes(networkLower) || cond.includes(networkLower);
        }),
      );
    }

    // Apply card mode filter (credit/debit) using benefit.cardName field
    if (cardMode !== undefined) {
      const creditKeywords = ['crédito', 'credito', 'credit'];
      const debitKeywords = ['débito', 'debito', 'debit'];
      const keywords = cardMode === 'credit' ? creditKeywords : debitKeywords;

      result = result.filter((b) =>
        b.benefits.some((benefit) => {
          const card = (benefit.cardName || '').toLowerCase();
          const cond = (benefit.condicion || '').toLowerCase();
          return keywords.some((kw) => card.includes(kw) || cond.includes(kw));
        }),
      );
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
