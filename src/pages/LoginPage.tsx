import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function PasskeyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M17 1a5 5 0 1 0 0 10A5 5 0 0 0 17 1zm0 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM1 23v-2a7 7 0 0 1 7-7h4.5a8.46 8.46 0 0 0-.5 3H8a5 5 0 0 0-5 5v2H1zm16-9a2 2 0 0 0-2 2v1h-1a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-1v-1a2 2 0 0 0-2-2zm0 2a.5.5 0 0 1 .5.5V17h-1v-.5a.5.5 0 0 1 .5-.5z"/>
    </svg>
  );
}

function LoginPage() {
  const { loginWithGoogle, loginWithApple, loginWithEmail, loginWithPasskey } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    loginWithEmail(email.trim());
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
          <span className="flex-1 text-center font-semibold text-base text-blink-ink">Accedé a Blink</span>
          <div className="w-9" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8 gap-6">
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
            boxShadow: '0 8px 24px rgba(99,102,241,0.30)',
          }}
        >
          <span className="material-symbols-outlined text-white" style={{ fontSize: 36 }}>lock_open</span>
        </div>

        <div className="text-center">
          <h1 className="font-bold text-2xl text-blink-ink tracking-tight">Bienvenido</h1>
          <p className="text-sm text-blink-muted mt-1">Ingresá o creá tu cuenta para continuar</p>
        </div>

        <div
          className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
        >
          {/* Email OTP */}
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-blink-muted tracking-wide">CORREO ELECTRÓNICO</label>
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
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full rounded-2xl flex items-center justify-center font-semibold text-base text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
              style={{
                height: 52,
                background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
              }}
            >
              {isLoading ? 'Redirigiendo...' : 'Continuar con email'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-blink-border" />
            <span className="text-xs text-blink-muted font-medium">o continuá con</span>
            <div className="flex-1 h-px bg-blink-border" />
          </div>

          {/* Social + Passkey buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={loginWithGoogle}
              className="flex items-center justify-center gap-2.5 w-full rounded-xl font-semibold text-sm text-blink-ink transition-all duration-150 active:scale-[0.98]"
              style={{ height: 48, background: '#FFFFFF', border: '1px solid #E8E6E1', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <GoogleIcon />
              Continuar con Google
            </button>

            <button
              onClick={loginWithApple}
              className="flex items-center justify-center gap-2.5 w-full rounded-xl font-semibold text-sm text-white transition-all duration-150 active:scale-[0.98]"
              style={{ height: 48, background: '#000000', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
            >
              <AppleIcon />
              Continuar con Apple
            </button>

            <button
              onClick={loginWithPasskey}
              className="flex items-center justify-center gap-2.5 w-full rounded-xl font-semibold text-sm text-blink-ink transition-all duration-150 active:scale-[0.98]"
              style={{ height: 48, background: '#F3F4F6', border: '1px solid #E8E6E1' }}
            >
              <PasskeyIcon />
              Usar Passkey
            </button>
          </div>
        </div>

        <p className="text-xs text-blink-muted text-center max-w-xs">
          Al continuar aceptás nuestros{' '}
          <span className="text-blink-accent font-semibold">Términos de uso</span>
          {' '}y{' '}
          <span className="text-blink-accent font-semibold">Política de privacidad</span>
        </p>
      </main>
    </div>
  );
}

export default LoginPage;
