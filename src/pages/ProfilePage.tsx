import { Link } from 'react-router-dom';
import BottomNav from '../components/neo/BottomNav';
import { useAuth } from '../contexts/AuthContext';

function ProfilePage() {
  const { user, isLoading, logout } = useAuth();

  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col overflow-x-hidden">
      <header className="sticky top-0 z-50 w-full border-b-2 border-blink-ink bg-blink-surface">
        <div className="h-12 flex items-center justify-center px-4">
          <div className="font-display text-lg tracking-tighter uppercase">Perfil</div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 pb-24 px-8">
        {isLoading ? (
          <div className="w-10 h-10 border-4 border-blink-ink border-t-blink-accent animate-spin rounded-full" />
        ) : user ? (
          <>
            <div className="w-24 h-24 rounded-full border-2 border-blink-ink bg-blink-accent shadow-hard flex items-center justify-center">
              <span className="font-display text-white text-4xl uppercase">
                {user.name.charAt(0)}
              </span>
            </div>
            <div className="text-center">
              <h1 className="font-display text-2xl uppercase mb-1">{user.name}</h1>
              <p className="font-mono text-sm text-blink-muted">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="w-full max-w-xs border-2 border-blink-ink bg-blink-surface shadow-hard py-3 font-display uppercase tracking-wider text-sm hover:bg-blink-bg transition-colors rounded-sm"
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <div className="w-24 h-24 rounded-full border-2 border-blink-ink bg-blink-surface shadow-hard flex items-center justify-center">
              <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 48 }}>
                person
              </span>
            </div>
            <div className="text-center">
              <h1 className="font-display text-2xl uppercase mb-2">Tu Perfil</h1>
              <p className="font-mono text-sm text-blink-muted">
                Iniciá sesión para guardar beneficios y personalizar tu experiencia.
              </p>
            </div>
            <div className="w-full max-w-xs flex flex-col gap-3">
              <Link
                to="/signup"
                className="w-full bg-blink-accent text-white font-display uppercase tracking-wider py-3 border-2 border-blink-ink shadow-hard text-center block rounded-sm"
              >
                Crear cuenta
              </Link>
              <Link
                to="/login"
                className="w-full bg-blink-surface font-display uppercase tracking-wider py-3 border-2 border-blink-ink shadow-hard text-center block rounded-sm"
              >
                Iniciar sesión
              </Link>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export default ProfilePage;
