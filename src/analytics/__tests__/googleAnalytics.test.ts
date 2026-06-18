import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const GA_SCRIPT_SRC = 'https://www.googletagmanager.com/gtag/js?id=G-TEST';
const posthogMock = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  captureException: vi.fn(),
  isFeatureEnabled: vi.fn(),
  getFeatureFlag: vi.fn(),
  getFeatureFlagPayload: vi.fn(),
}));

vi.mock('posthog-js', () => ({
  default: posthogMock,
}));

describe('googleAnalytics', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST');
    vi.stubEnv('VITE_POSTHOG_PROJECT_TOKEN', '');
    vi.stubEnv('VITE_POSTHOG_HOST', 'https://us.i.posthog.com');
    posthogMock.init.mockReset();
    posthogMock.capture.mockReset();
    posthogMock.identify.mockReset();
    posthogMock.reset.mockReset();
    posthogMock.captureException.mockReset();
    posthogMock.isFeatureEnabled.mockReset();
    posthogMock.getFeatureFlag.mockReset();
    posthogMock.getFeatureFlagPayload.mockReset();
    document.head.innerHTML = '';
    window.dataLayer = [];
    delete window.gtag;
    Object.defineProperty(window, 'requestIdleCallback', {
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    document.head.innerHTML = '';
    window.dataLayer = [];
    delete window.gtag;
    vi.clearAllMocks();
  });

  it('queues analytics config immediately but defers loading gtag.js', async () => {
    const { initializeGoogleAnalytics } = await import('../googleAnalytics');

    expect(initializeGoogleAnalytics()).toBe(true);
    expect(document.querySelector(`script[src="${GA_SCRIPT_SRC}"]`)).toBeNull();
    expect(window.dataLayer).toHaveLength(2);

    vi.advanceTimersByTime(1499);
    expect(document.querySelector(`script[src="${GA_SCRIPT_SRC}"]`)).toBeNull();

    vi.advanceTimersByTime(1);
    const script = document.querySelector<HTMLScriptElement>(`script[src="${GA_SCRIPT_SRC}"]`);
    expect(script).not.toBeNull();
    expect(script?.async).toBe(true);
  });

  it('sends normalized events to both GA4 and PostHog when both are configured', async () => {
    vi.stubEnv('VITE_POSTHOG_PROJECT_TOKEN', 'phc_test');
    const { trackEvent } = await import('../googleAnalytics');

    trackEvent('Signup Completed!', {
      source: 'home_page',
      empty_value: undefined,
      long_text: 'x'.repeat(120),
    });

    expect(posthogMock.init).toHaveBeenCalledWith('phc_test', expect.objectContaining({
      api_host: 'https://us.i.posthog.com',
      autocapture: true,
      capture_pageview: 'history_change',
      capture_pageleave: 'if_capture_pageview',
      person_profiles: 'always',
    }));
    expect(posthogMock.capture).toHaveBeenCalledWith('signup_completed', {
      source: 'home_page',
      long_text: 'x'.repeat(100),
    });

    const eventCall = Array.from(window.dataLayer[window.dataLayer.length - 1] as IArguments);
    expect(eventCall).toEqual([
      'event',
      'signup_completed',
      {
        source: 'home_page',
        long_text: 'x'.repeat(100),
      },
    ]);
  });

  it('keeps PostHog capture working when GA4 is not configured', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '');
    vi.stubEnv('VITE_POSTHOG_PROJECT_TOKEN', 'phc_test');
    const { trackEvent } = await import('../googleAnalytics');

    trackEvent('search', { source: 'search_page' });

    expect(posthogMock.capture).toHaveBeenCalledWith('search', { source: 'search_page' });
    expect(window.gtag).toBeUndefined();
    expect(window.dataLayer).toHaveLength(0);
  });

  it('keeps GA4 capture working when PostHog is not configured', async () => {
    const { trackEvent } = await import('../googleAnalytics');

    trackEvent('search', { source: 'search_page' });

    expect(posthogMock.init).not.toHaveBeenCalled();
    expect(posthogMock.capture).not.toHaveBeenCalled();

    const eventCall = Array.from(window.dataLayer[window.dataLayer.length - 1] as IArguments);
    expect(eventCall).toEqual([
      'event',
      'search',
      { source: 'search_page' },
    ]);
  });

  it('keeps GA4 capture working if PostHog initialization fails', async () => {
    vi.stubEnv('VITE_POSTHOG_PROJECT_TOKEN', 'phc_test');
    posthogMock.init.mockImplementationOnce(() => {
      throw new Error('PostHog blocked');
    });
    const { trackEvent } = await import('../googleAnalytics');

    expect(() => trackEvent('search', { source: 'search_page' })).not.toThrow();
    expect(posthogMock.capture).not.toHaveBeenCalled();

    const eventCall = Array.from(window.dataLayer[window.dataLayer.length - 1] as IArguments);
    expect(eventCall).toEqual([
      'event',
      'search',
      { source: 'search_page' },
    ]);
  });
});
