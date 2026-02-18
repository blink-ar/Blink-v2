import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  initializeGoogleAnalytics,
  setupGlobalEventTracking,
  trackPageView,
} from '../../analytics/googleAnalytics';

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    initializeGoogleAnalytics();
    const cleanup = setupGlobalEventTracking();
    return cleanup;
  }, []);

  useEffect(() => {
    const path = `${location.pathname}${location.search}${location.hash}`;
    trackPageView(path);
  }, [location.hash, location.pathname, location.search]);

  return null;
}

export default AnalyticsTracker;
