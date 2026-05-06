import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/neo/BottomNav';
import BusinessCard from '../components/BusinessCard';
import { useFavorites } from '../context/FavoritesContext';

function SavedPage() {
  const { favorites } = useFavorites();
  const navigate = useNavigate();

  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col overflow-x-hidden">
      <header className="sticky top-0 z-50 w-full border-b-2 border-blink-ink bg-blink-surface">
        <div className="h-12 flex items-center justify-center px-4">
          <div className="font-display text-lg tracking-tighter uppercase">Guardados</div>
        </div>
      </header>

      <main className="flex-1 flex flex-col pb-24">
        {favorites.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
            <div className="w-24 h-24 border-2 border-blink-ink bg-blink-surface shadow-hard flex items-center justify-center">
              <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 48 }}>
                favorite
              </span>
            </div>
            <div className="text-center">
              <h1 className="font-display text-2xl uppercase mb-2">Sin guardados</h1>
              <p className="font-mono text-sm text-blink-muted">
                Tocá el corazón en cualquier comercio para guardarlo acá.
              </p>
            </div>
          </div>
        ) : (
          <div className="px-4 pt-4 flex flex-col gap-3">
            <p className="font-mono text-xs text-blink-muted uppercase tracking-widest">
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
