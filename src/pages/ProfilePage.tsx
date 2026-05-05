import { Link } from 'react-router-dom';
import BottomNav from '../components/neo/BottomNav';
import { useAuth } from '../contexts/AuthContext';

function ProfilePage() {
  const { user, isLoading, logout } = useAuth();

  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col overflow-x-hidden">
      {/* Header */}
      <header
        className="sticky top-0 z-50 w-full"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(232,230,225,0.8)',
        }}
      >
        <div className="h-14 flex items-center justify-center px-4">
          <span className="font-semibold text-base text-blink-ink">Perfil</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center pb-28 px-4 pt-8 gap-6">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)', boxShadow: '0 8px 24px rgba(99,102,241,0.30)' }}
            >
              <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            </div>
          </div>
        ) : user ? (
          <>
            {/* Avatar */}
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)', boxShadow: '0 8px 24px rgba(99,102,241,0.30)' }}
            >
              <span className="font-bold text-white text-4xl uppercase">
                {user.name.charAt(0)}
              </span>
            </div>

            {/* User info */}
            <div className="text-center">
              <h1 className="font-bold text-2xl text-blink-ink tracking-tight">{user.name}</h1>
              <p className="text-sm text-blink-muted mt-1">{user.email}</p>
            </div>

            {/* Account card */}
            <div
              className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ background: '#FFFFFF', border: '1px solid #E8E6E1', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
            >
              <div className="px-5 py-4 flex items-center gap-3 border-b border-blink-border">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(99,102,241,0.10)' }}
                >
                  <span className="material-symbols-outlined text-blink-accent" style={{ fontSize: 18 }}>person</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-blink-muted tracking-wide">CUENTA</p>
                  <p className="text-sm font-medium text-blink-ink truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-blink-bg transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(239,68,68,0.10)' }}
                >
                  <span className="material-symbols-outlined text-red-500" style={{ fontSize: 18 }}>logout</span>
                </div>
                <span className="text-sm font-semibold text-red-500">Cerrar sesión</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Guest icon */}
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)', border: '1px solid #E8E6E1' }}
            >
              <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 44 }}>person</span>
            </div>

            <div className="text-center">
              <h1 className="font-bold text-2xl text-blink-ink tracking-tight">Tu Perfil</h1>
              <p className="text-sm text-blink-muted mt-1 max-w-xs">
                Iniciá sesión para guardar beneficios y personalizar tu experiencia.
              </p>
            </div>

            {/* CTAs */}
            <div className="w-full max-w-sm flex flex-col gap-3">
              <Link
                to="/signup"
                className="w-full rounded-2xl flex items-center justify-center font-semibold text-base text-white transition-all duration-150 active:scale-[0.98]"
                style={{
                  height: 52,
                  background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                }}
              >
                Crear cuenta gratis
              </Link>
              <Link
                to="/login"
                className="w-full rounded-2xl flex items-center justify-center font-semibold text-base text-blink-ink transition-all duration-150 active:scale-[0.98]"
                style={{
                  height: 52,
                  background: '#FFFFFF',
                  border: '1px solid #E8E6E1',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
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
