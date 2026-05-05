import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ERROR_MESSAGES: Record<string, string> = {
  acceso_denegado: 'Cancelaste el inicio de sesión.',
  error_de_servidor: 'Ocurrió un error. Intentá de nuevo.',
};

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const err = params.get('error');

    if (token) {
      localStorage.setItem('blink_auth_token', token);
      window.location.replace('/profile');
    } else {
      setError(ERROR_MESSAGES[err || ''] || 'Error desconocido.');
    }
  }, [navigate]);

  if (error) {
    return (
      <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col items-center justify-center gap-6 px-8">
        <div className="w-16 h-16 rounded-full border-2 border-blink-ink bg-red-50 flex items-center justify-center">
          <span className="material-symbols-outlined text-red-600" style={{ fontSize: 32 }}>error</span>
        </div>
        <p className="font-mono text-sm text-center">{error}</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 border-2 border-blink-ink bg-blink-surface shadow-hard font-display uppercase tracking-wider text-sm rounded-sm"
        >
          Volver al login
        </button>
      </div>
    );
  }

  return (
    <div className="bg-blink-bg min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blink-ink border-t-blink-accent animate-spin rounded-full" />
    </div>
  );
}

export default AuthCallbackPage;
