import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  initializeGoogleAnalytics,
  setupGlobalEventTracking,
  trackPageView,
} from '../../analytics/googleAnalytics';
import {
  identifyPostHogUser,
  initializePostHog,
} from '../../analytics/posthogAnalytics';
import { useAuth } from '../../contexts/AuthContext';

function AnalyticsTracker() {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    initializeGoogleAnalytics();
    initializePostHog();
    const cleanup = setupGlobalEventTracking();
    return cleanup;
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isAuthenticated && user?.id) {
      identifyPostHogUser(user.id);
    }
  }, [isAuthenticated, isLoading, user?.id]);

  useEffect(() => {
    const path = `${location.pathname}${location.search}${location.hash}`;
    trackPageView(path);
  }, [location.hash, location.pathname, location.search]);

  return null;
}

export default AnalyticsTracker;
