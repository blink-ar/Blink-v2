import { useQueries } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/neo/BottomNav';
import MerchantCard from '../components/MerchantCard';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import { Business } from '../types';
import { fetchBusinessById } from '../services/api';
import { businessWithActiveBenefits } from '../utils/benefits';

function SavedPage() {
  const { favorites } = useFavorites();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const hasSavedSnapshots = favorites.length > 0;
  const favoriteQueries = useQueries({
    queries: favorites.map((business) => ({
      queryKey: ['saved-business', business.id],
      queryFn: () => fetchBusinessById(business.id),
      enabled: Boolean(business.id),
      staleTime: 1000 * 60 * 5,
    })),
  });

  const visibleFavorites = favorites
    .map((snapshot, index) => {
      const query = favoriteQueries[index];
      if (query?.status === 'success') {
        return query.data;
      }
      return businessWithActiveBenefits(snapshot);
    })
    .filter((business): business is Business => Boolean(business));

  const handleSelect = (business: Business) => {
    navigate(`/business/${business.id}`, { state: { business } });
  };

  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col overflow-x-hidden">
      <header
        className="sticky top-0 z-50 w-full lg:hidden"
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

      <main className="flex-1 flex flex-col pb-28 lg:mx-auto lg:w-full lg:max-w-5xl lg:px-8 lg:py-8 lg:pb-12">
        <div className="mb-6 hidden lg:block">
          <h1 className="text-3xl font-black tracking-tight text-blink-ink">Guardados</h1>
          <p className="mt-1 text-sm text-blink-muted">Tus comercios favoritos y beneficios activos.</p>
        </div>
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 py-16">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #C7D2FE 100%)' }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 40, color: '#6366F1', fontVariationSettings: "'FILL' 0" }}
              >
                lock_open
              </span>
            </div>
            <div className="text-center">
              <p className="font-semibold text-base text-blink-ink mb-1">
                Creá tu cuenta para guardar comercios
              </p>
              <p className="text-sm text-blink-muted max-w-xs">
                Iniciá sesión para guardar tus comercios favoritos y sincronizarlos en todos tus dispositivos.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="mt-2 h-11 px-6 rounded-xl font-semibold text-sm text-white transition-all duration-150 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
            >
              Iniciar sesión
            </button>
          </div>
        ) : visibleFavorites.length === 0 ? (
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
              <p className="font-semibold text-base text-blink-ink mb-1">
                {hasSavedSnapshots ? 'Sin beneficios activos guardados' : 'Todavía no guardaste nada'}
              </p>
              <p className="text-sm text-blink-muted">
                {hasSavedSnapshots
                  ? 'Tus comercios guardados no tienen beneficios activos ahora.'
                  : 'Tocá el corazón en cualquier comercio para guardarlo acá.'}
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
          <div className="flex flex-col gap-3 px-4 pt-4 lg:px-0 lg:pt-0">
            <p className="text-xs font-medium text-blink-muted px-1">
              {visibleFavorites.length} guardado{visibleFavorites.length !== 1 ? 's' : ''}
            </p>
            {visibleFavorites.map((business) => (
              <MerchantCard
                key={business.id}
                business={business}
                onClick={handleSelect}
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
