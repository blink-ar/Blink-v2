import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import AnalyticsTracker from './components/analytics/AnalyticsTracker';
import RouteSEO from './components/seo/RouteSEO';
import UpdatePrompt from './components/UpdatePrompt';
import { useResponsive } from './hooks/useResponsive';
import PhoneMirror from './components/PhoneMirror';
import { AuthProvider } from './contexts/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';

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
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));

const PageLoader = () => (
  <div className="min-h-screen bg-blink-bg flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-blink-ink border-t-primary animate-spin" />
  </div>
);

export function HomeRedirect() {
  const { search, hash } = useLocation();

  return (
    <Navigate
      to={{
        pathname: '/',
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
      <UpdatePrompt />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomeRedirect />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/comercios/:slugId" element={<BusinessDetailPage />} />
          <Route path="/business/:id" element={<BusinessDetailPage />} />
          <Route path="/benefit/:id/:benefitIndex?" element={<BenefitDetailPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/categorias/:category" element={<CategoryPage />} />
          <Route path="/categorias/:category/page/:page" element={<CategoryPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
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
        <FavoritesProvider>
          <AppContent />
        </FavoritesProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
