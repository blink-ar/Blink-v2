import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import AnalyticsTracker from './components/analytics/AnalyticsTracker';
import RouteSEO from './components/seo/RouteSEO';
import { useResponsive } from './hooks/useResponsive';
import PhoneMirror from './components/PhoneMirror';
import { AuthProvider } from './contexts/AuthContext';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // SearchPage manages its own scroll (restoration + reset on fresh mount)
    if (pathname === '/search') return;
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const HomePage = lazy(() => import('./pages/HomePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const BusinessDetailPage = lazy(() => import('./pages/BusinessDetailPage'));
const BenefitDetailPage = lazy(() => import('./pages/BenefitDetailPage'));
const SavedPage = lazy(() => import('./pages/SavedPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));

const PageLoader = () => (
  <div className="min-h-screen bg-blink-bg flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-blink-ink border-t-primary animate-spin" />
  </div>
);

export function RootRedirect() {
  const { search, hash } = useLocation();

  return (
    <Navigate
      to={{
        pathname: '/home',
        search,
        hash,
      }}
      replace
    />
  );
}

function AppContent() {
  const { isDesktop } = useResponsive();

  const mobileContent = (
    <>
      <ScrollToTop />
      <AnalyticsTracker />
      <RouteSEO />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/business/:id" element={<BusinessDetailPage />} />
          <Route path="/benefit/:id/:benefitIndex?" element={<BenefitDetailPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/descuentos/:bank/:category" element={<LandingPage />} />
          <Route path="/descuentos/:bank/:category/:city" element={<LandingPage />} />
        </Routes>
      </Suspense>
    </>
  );

  if (isDesktop) {
    return <PhoneMirror>{mobileContent}</PhoneMirror>;
  }

  return mobileContent;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
