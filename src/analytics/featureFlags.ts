import {
  useActiveFeatureFlags,
  useFeatureFlagEnabled,
  useFeatureFlagPayload,
  useFeatureFlagVariantKey,
} from '@posthog/react';

export function useAnalyticsFeatureFlag(flagKey: string, defaultValue = false): boolean {
  return useFeatureFlagEnabled(flagKey, defaultValue);
}

export function useAnalyticsFeatureFlagVariant(flagKey: string): string | boolean | undefined {
  return useFeatureFlagVariantKey(flagKey);
}

export function useAnalyticsFeatureFlagPayload(flagKey: string): unknown {
  return useFeatureFlagPayload(flagKey);
}

export function useActiveAnalyticsFeatureFlags(): string[] {
  return useActiveFeatureFlags();
}
