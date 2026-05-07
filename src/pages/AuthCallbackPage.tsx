import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

function AuthCallbackPage() {
  const { isLoading, isAuthenticated, error } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      navigate('/profile', { replace: true });
    } else if (error) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, error, navigate]);

  if (error) {
    return (
      <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col items-center justify-center gap-6 px-6">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
        >
          <span className="material-symbols-outlined text-red-500" style={{ fontSize: 36 }}>error</span>
        </div>
        <div className="text-center">
          <h2 className="font-bold text-lg text-blink-ink mb-1">Algo salió mal</h2>
          <p className="text-sm text-blink-muted">{error.message}</p>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="rounded-2xl flex items-center justify-center font-semibold text-base text-white px-8 transition-all duration-150 active:scale-[0.98]"
          style={{
            height: 52,
            background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
            boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
          }}
        >
          Volver al login
        </button>
      </div>
    );
  }

  return (
    <div className="bg-blink-bg min-h-screen flex flex-col items-center justify-center gap-4">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
          boxShadow: '0 8px 24px rgba(99,102,241,0.30)',
        }}
      >
        <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      </div>
      <p className="text-sm text-blink-muted font-medium">Iniciando sesión...</p>
    </div>
  );
}

export default AuthCallbackPage;
