import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/neo/BottomNav';
import BusinessCard from '../components/BusinessCard';
import { useFavorites } from '../context/FavoritesContext';

function SavedPage() {
  const { favorites } = useFavorites();
  const navigate = useNavigate();

  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col overflow-x-hidden">
      <header
        className="sticky top-0 z-50 w-full"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(232,230,225,0.8)',
        }}
      >
        <div className="h-14 flex items-center px-4">
          <h1 className="font-bold text-xl tracking-tight text-blink-ink">Guardados</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col pb-28">
        {favorites.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 py-16">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)' }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 40, color: '#EF4444', fontVariationSettings: "'FILL' 0" }}
              >
                favorite
              </span>
            </div>
            <div className="text-center">
              <p className="font-semibold text-base text-blink-ink mb-1">Todavía no guardaste nada</p>
              <p className="text-sm text-blink-muted">
                Tocá el corazón en cualquier comercio para guardarlo acá.
              </p>
            </div>
            <button
              onClick={() => navigate('/search')}
              className="mt-2 h-11 px-6 rounded-xl font-semibold text-sm text-white transition-all duration-150 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
            >
              Explorar comercios
            </button>
          </div>
        ) : (
          <div className="px-4 pt-4 flex flex-col gap-3">
            <p className="text-xs font-medium text-blink-muted px-1">
              {favorites.length} guardado{favorites.length !== 1 ? 's' : ''}
            </p>
            {favorites.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                onClick={(id) => navigate(`/business/${id}`, { state: { business } })}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export default SavedPage;
