import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AnalyticsTracker from '../AnalyticsTracker';

const authState = vi.hoisted(() => ({
  current: {
    isAuthenticated: false,
    isLoading: false,
    user: null as { id: string } | null,
  },
}));

const googleAnalyticsMock = vi.hoisted(() => ({
  initializeGoogleAnalytics: vi.fn(),
  setupGlobalEventTracking: vi.fn(() => vi.fn()),
  trackPageView: vi.fn(),
}));

const posthogAnalyticsMock = vi.hoisted(() => ({
  identifyPostHogUser: vi.fn(),
  initializePostHog: vi.fn(),
  resetPostHogUser: vi.fn(),
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => authState.current,
}));

vi.mock('../../../analytics/googleAnalytics', () => googleAnalyticsMock);

vi.mock('../../../analytics/posthogAnalytics', () => posthogAnalyticsMock);

function renderTracker() {
  return render(
    <MemoryRouter>
      <AnalyticsTracker />
    </MemoryRouter>,
  );
}

describe('AnalyticsTracker', () => {
  beforeEach(() => {
    authState.current = {
      isAuthenticated: false,
      isLoading: false,
      user: null,
    };
    vi.clearAllMocks();
    googleAnalyticsMock.setupGlobalEventTracking.mockReturnValue(vi.fn());
  });

  it('does not rotate PostHog identity for an anonymous visitor after auth resolves', () => {
    renderTracker();

    expect(posthogAnalyticsMock.resetPostHogUser).not.toHaveBeenCalled();
    expect(posthogAnalyticsMock.identifyPostHogUser).not.toHaveBeenCalled();
  });

  it('identifies authenticated users', () => {
    authState.current = {
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'auth0|user-1' },
    };

    renderTracker();

    expect(posthogAnalyticsMock.identifyPostHogUser).toHaveBeenCalledWith('auth0|user-1');
  });
});
