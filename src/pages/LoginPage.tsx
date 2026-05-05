import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SocialAuthButtons from '../components/SocialAuthButtons';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/profile', { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Error al iniciar sesión. Intentá de nuevo.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col">
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
        <div className="h-14 flex items-center px-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-blink-muted hover:bg-blink-bg transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span className="flex-1 text-center font-semibold text-base text-blink-ink">Iniciar sesión</span>
          <div className="w-9" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8 gap-6">
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)', boxShadow: '0 8px 24px rgba(99,102,241,0.30)' }}
        >
          <span className="material-symbols-outlined text-white" style={{ fontSize: 36 }}>lock_open</span>
        </div>

        <div className="text-center">
          <h1 className="font-bold text-2xl text-blink-ink tracking-tight">Bienvenido de vuelta</h1>
          <p className="text-sm text-blink-muted mt-1">Ingresá para ver tus beneficios guardados</p>
        </div>

        {/* Form card */}
        <div
          className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
        >
          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm text-red-700"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-blink-muted tracking-wide">EMAIL</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full rounded-xl px-4 py-3 text-sm text-blink-ink bg-blink-bg focus:outline-none focus:ring-2 focus:ring-blink-accent/30 transition-shadow"
                style={{ border: '1px solid #E8E6E1' }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-blink-muted tracking-wide">CONTRASEÑA</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                className="w-full rounded-xl px-4 py-3 text-sm text-blink-ink bg-blink-bg focus:outline-none focus:ring-2 focus:ring-blink-accent/30 transition-shadow"
                style={{ border: '1px solid #E8E6E1' }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl flex items-center justify-center font-semibold text-base text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                height: 52,
              }}
            >
              {isLoading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <SocialAuthButtons label="Iniciar sesión" />
        </div>

        <p className="text-sm text-blink-muted text-center">
          ¿No tenés cuenta?{' '}
          <Link to="/signup" className="font-semibold text-blink-accent">
            Registrate gratis
          </Link>
        </p>
      </main>
    </div>
  );
}

export default LoginPage;
