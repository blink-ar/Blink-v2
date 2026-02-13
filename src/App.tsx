import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const BusinessDetailPage = lazy(() => import('./pages/BusinessDetailPage'));
const BenefitDetailPage = lazy(() => import('./pages/BenefitDetailPage'));
const SavedPage = lazy(() => import('./pages/SavedPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MapPage = lazy(() => import('./pages/MapPage'));

const PageLoader = () => (
  <div className="min-h-screen bg-blink-bg flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-blink-ink border-t-primary animate-spin" />
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/business/:id" element={<BusinessDetailPage />} />
          <Route path="/benefit/:id/:benefitIndex?" element={<BenefitDetailPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/map" element={<MapPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
