import posthog, { type PostHog, type Properties } from 'posthog-js';

type AnalyticsParamValue = string | number | boolean;
type AnalyticsProperties = Record<string, AnalyticsParamValue>;

const POSTHOG_PROJECT_TOKEN = (import.meta.env.VITE_POSTHOG_PROJECT_TOKEN ?? '').trim();
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com').trim() || 'https://us.i.posthog.com';
const POSTHOG_IDENTIFIED_USER_STORAGE_KEY = 'blink.analytics.posthog.identified_user_id';

let isInitialized = false;
let isUnavailable = false;
let identifiedUserId: string | null = null;

function getStoredIdentifiedUserId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(POSTHOG_IDENTIFIED_USER_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeIdentifiedUserId(userId: string): void {
  try {
    window.localStorage.setItem(POSTHOG_IDENTIFIED_USER_STORAGE_KEY, userId);
  } catch {
    // Analytics persistence should not affect product flows.
  }
}

function clearStoredIdentifiedUserId(): void {
  try {
    window.localStorage.removeItem(POSTHOG_IDENTIFIED_USER_STORAGE_KEY);
  } catch {
    // Analytics persistence should not affect product flows.
  }
}

function getKnownIdentifiedUserId(): string | null {
  return identifiedUserId ?? getStoredIdentifiedUserId();
}

export function isPostHogConfigured(): boolean {
  return POSTHOG_PROJECT_TOKEN.length > 0;
}

export function initializePostHog(): PostHog | null {
  if (typeof window === 'undefined' || !isPostHogConfigured() || isUnavailable) {
    return null;
  }

  if (isInitialized) {
    return posthog;
  }

  try {
    posthog.init(POSTHOG_PROJECT_TOKEN, {
      api_host: POSTHOG_HOST,
      defaults: '2026-01-30',
      autocapture: true,
      capture_pageview: 'history_change',
      capture_pageleave: 'if_capture_pageview',
      capture_exceptions: {
        capture_unhandled_errors: true,
        capture_unhandled_rejections: true,
        capture_console_errors: false,
      },
      person_profiles: 'identified_only',
      disable_surveys: false,
      disable_surveys_automatic_display: false,
    });

    isInitialized = true;
    return posthog;
  } catch {
    isUnavailable = true;
    return null;
  }
}

export function getPostHogClient(): PostHog | null {
  return initializePostHog();
}

export function capturePostHogEvent(eventName: string, properties: AnalyticsProperties): void {
  const client = initializePostHog();
  if (!client) {
    return;
  }

  try {
    client.capture(eventName, properties);
  } catch {
    // Analytics must never break product flows.
  }
}

export function identifyPostHogUser(userId: string | undefined): void {
  const normalizedUserId = userId?.trim();
  if (!normalizedUserId || normalizedUserId === identifiedUserId) {
    return;
  }

  const client = initializePostHog();
  if (!client) {
    return;
  }

  try {
    const knownIdentifiedUserId = getKnownIdentifiedUserId();

    if (knownIdentifiedUserId && knownIdentifiedUserId !== normalizedUserId) {
      client.reset();
      identifiedUserId = null;
      clearStoredIdentifiedUserId();
    }

    client.identify(normalizedUserId);
    identifiedUserId = normalizedUserId;
    storeIdentifiedUserId(normalizedUserId);
  } catch {
    // Analytics must never break auth flows.
  }
}

export function resetPostHogUser(): void {
  if (!getKnownIdentifiedUserId()) {
    return;
  }

  const client = initializePostHog();
  if (!client) {
    identifiedUserId = null;
    clearStoredIdentifiedUserId();
    return;
  }

  try {
    client.reset();
  } catch {
    // Analytics must never break logout flows.
  } finally {
    identifiedUserId = null;
    clearStoredIdentifiedUserId();
  }
}

export function capturePostHogException(error: unknown, properties?: Properties): void {
  const client = initializePostHog();
  if (!client) {
    return;
  }

  try {
    client.captureException(error, properties);
  } catch {
    // Ignore secondary analytics failures while reporting the original error.
  }
}

export function isPostHogFeatureEnabled(flagKey: string, defaultValue = false): boolean {
  const client = initializePostHog();
  if (!client) {
    return defaultValue;
  }

  return client.isFeatureEnabled(flagKey) ?? defaultValue;
}

export function getPostHogFeatureFlag(flagKey: string): string | boolean | undefined {
  return initializePostHog()?.getFeatureFlag(flagKey);
}

export function getPostHogFeatureFlagPayload(flagKey: string): unknown {
  return initializePostHog()?.getFeatureFlagPayload(flagKey);
}
