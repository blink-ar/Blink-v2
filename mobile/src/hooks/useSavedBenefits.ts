import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Business, BankBenefit } from '../types';

const SAVED_BENEFITS_KEY = 'blink.savedBenefits';

export interface SavedBenefitEntry {
  businessId: string;
  benefitIndex: number;
  business: Business;
  benefit: BankBenefit;
  savedAt: number;
}

export function useSavedBenefits() {
  const [saved, setSaved] = useState<SavedBenefitEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SAVED_BENEFITS_KEY)
      .then((raw) => {
        if (raw) setSaved(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const persist = useCallback(async (entries: SavedBenefitEntry[]) => {
    setSaved(entries);
    await AsyncStorage.setItem(SAVED_BENEFITS_KEY, JSON.stringify(entries));
  }, []);

  const isSaved = useCallback(
    (businessId: string, benefitIndex: number) =>
      saved.some((e) => e.businessId === businessId && e.benefitIndex === benefitIndex),
    [saved],
  );

  const saveBenefit = useCallback(
    async (business: Business, benefitIndex: number) => {
      const benefit = business.benefits[benefitIndex];
      if (!benefit) return;
      if (isSaved(business.id, benefitIndex)) return;
      const entry: SavedBenefitEntry = {
        businessId: business.id,
        benefitIndex,
        business,
        benefit,
        savedAt: Date.now(),
      };
      await persist([entry, ...saved]);
    },
    [saved, isSaved, persist],
  );

  const unsaveBenefit = useCallback(
    async (businessId: string, benefitIndex: number) => {
      await persist(saved.filter((e) => !(e.businessId === businessId && e.benefitIndex === benefitIndex)));
    },
    [saved, persist],
  );

  const toggleBenefit = useCallback(
    async (business: Business, benefitIndex: number) => {
      if (isSaved(business.id, benefitIndex)) {
        await unsaveBenefit(business.id, benefitIndex);
      } else {
        await saveBenefit(business, benefitIndex);
      }
    },
    [isSaved, saveBenefit, unsaveBenefit],
  );

  return { saved, isLoading, isSaved, saveBenefit, unsaveBenefit, toggleBenefit };
}
