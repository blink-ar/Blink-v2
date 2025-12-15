import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// Lazy load routes for code splitting
const Home = lazy(() => import("./pages/Home"));
const Benefit = lazy(() => import("./pages/Benefit"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
      <p className="text-gray-600 text-sm">Cargando...</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/benefit/:id/:benefitIndex" element={<Benefit />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
