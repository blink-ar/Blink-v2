import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('posthogAnalytics', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_POSTHOG_PROJECT_TOKEN', 'phc_test');
    vi.stubEnv('VITE_POSTHOG_HOST', 'https://us.i.posthog.com');
    posthogMock.init.mockReset();
    posthogMock.capture.mockReset();
    posthogMock.identify.mockReset();
    posthogMock.reset.mockReset();
    posthogMock.captureException.mockReset();
    posthogMock.isFeatureEnabled.mockReset();
    posthogMock.getFeatureFlag.mockReset();
    posthogMock.getFeatureFlagPayload.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('initializes PostHog once with replay, autocapture, surveys, and error tracking enabled', async () => {
    const { initializePostHog } = await import('../posthogAnalytics');

    expect(initializePostHog()).toBe(posthogMock);
    expect(initializePostHog()).toBe(posthogMock);

    expect(posthogMock.init).toHaveBeenCalledTimes(1);
    expect(posthogMock.init).toHaveBeenCalledWith('phc_test', expect.objectContaining({
      api_host: 'https://us.i.posthog.com',
      defaults: '2026-01-30',
      autocapture: true,
      capture_pageview: 'history_change',
      capture_pageleave: 'if_capture_pageview',
      capture_exceptions: {
        capture_unhandled_errors: true,
        capture_unhandled_rejections: true,
        capture_console_errors: false,
      },
      person_profiles: 'always',
      disable_surveys: false,
      disable_surveys_automatic_display: false,
    }));
  });

  it('skips initialization when the project token is missing', async () => {
    vi.stubEnv('VITE_POSTHOG_PROJECT_TOKEN', '');
    const { initializePostHog, capturePostHogEvent } = await import('../posthogAnalytics');

    expect(initializePostHog()).toBeNull();
    capturePostHogEvent('search', { source: 'search_page' });

    expect(posthogMock.init).not.toHaveBeenCalled();
    expect(posthogMock.capture).not.toHaveBeenCalled();
  });

  it('does not throw or retry captures after initialization fails', async () => {
    posthogMock.init.mockImplementationOnce(() => {
      throw new Error('PostHog blocked');
    });
    const { initializePostHog, capturePostHogEvent } = await import('../posthogAnalytics');

    expect(initializePostHog()).toBeNull();
    expect(() => capturePostHogEvent('search', { source: 'search_page' })).not.toThrow();

    expect(posthogMock.init).toHaveBeenCalledTimes(1);
    expect(posthogMock.capture).not.toHaveBeenCalled();
  });

  it('captures events through the guarded wrapper', async () => {
    const { capturePostHogEvent } = await import('../posthogAnalytics');

    capturePostHogEvent('view_benefit', { benefit_id: 'benefit-1', position: 1 });

    expect(posthogMock.capture).toHaveBeenCalledWith('view_benefit', {
      benefit_id: 'benefit-1',
      position: 1,
    });
  });

  it('identifies with only the stable user id', async () => {
    const { identifyPostHogUser } = await import('../posthogAnalytics');

    identifyPostHogUser(' auth0|user-1 ');
    identifyPostHogUser('auth0|user-1');

    expect(posthogMock.identify).toHaveBeenCalledTimes(1);
    expect(posthogMock.identify).toHaveBeenCalledWith('auth0|user-1');
    expect(posthogMock.identify.mock.calls[0]).toHaveLength(1);
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'blink.analytics.posthog.identified_user_id',
      'auth0|user-1',
    );
  });

  it('resets before identifying a different user in the same session', async () => {
    const { identifyPostHogUser } = await import('../posthogAnalytics');

    identifyPostHogUser('auth0|user-1');
    identifyPostHogUser('auth0|user-2');

    expect(posthogMock.reset).toHaveBeenCalledTimes(1);
    expect(posthogMock.identify).toHaveBeenNthCalledWith(1, 'auth0|user-1');
    expect(posthogMock.identify).toHaveBeenNthCalledWith(2, 'auth0|user-2');
    expect(posthogMock.reset.mock.invocationCallOrder[0]).toBeLessThan(
      posthogMock.identify.mock.invocationCallOrder[1],
    );
  });

  it('does not reset anonymous visitors', async () => {
    const { resetPostHogUser } = await import('../posthogAnalytics');

    resetPostHogUser();

    expect(posthogMock.reset).not.toHaveBeenCalled();
  });

  it('resets known identified state once', async () => {
    const { identifyPostHogUser, resetPostHogUser } = await import('../posthogAnalytics');

    identifyPostHogUser('auth0|user-1');
    posthogMock.reset.mockClear();

    resetPostHogUser();
    resetPostHogUser();

    expect(posthogMock.reset).toHaveBeenCalledTimes(1);
    expect(window.localStorage.removeItem).toHaveBeenCalledWith(
      'blink.analytics.posthog.identified_user_id',
    );
  });

  it('resets persisted identified state even when no user was identified in this JS session', async () => {
    const storageKey = 'blink.analytics.posthog.identified_user_id';
    let storedUserId: string | null = 'auth0|stored-user';
    vi.mocked(window.localStorage.getItem).mockImplementation((key) => (
      key === storageKey ? storedUserId : null
    ));
    vi.mocked(window.localStorage.removeItem).mockImplementation((key) => {
      if (key === storageKey) {
        storedUserId = null;
      }
    });
    const { resetPostHogUser } = await import('../posthogAnalytics');

    resetPostHogUser();
    resetPostHogUser();

    expect(posthogMock.reset).toHaveBeenCalledTimes(1);
  });

  it('falls back for feature flags when PostHog is disabled', async () => {
    vi.stubEnv('VITE_POSTHOG_PROJECT_TOKEN', '');
    const { isPostHogFeatureEnabled, getPostHogFeatureFlag } = await import('../posthogAnalytics');

    expect(isPostHogFeatureEnabled('new-search', true)).toBe(true);
    expect(getPostHogFeatureFlag('new-search')).toBeUndefined();
    expect(posthogMock.isFeatureEnabled).not.toHaveBeenCalled();
  });
});
