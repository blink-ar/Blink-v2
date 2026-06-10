import { useState, useEffect, useRef, type FormEvent } from 'react';
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

function PasskeyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M17 1a5 5 0 1 0 0 10A5 5 0 0 0 17 1zm0 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM1 23v-2a7 7 0 0 1 7-7h4.5a8.46 8.46 0 0 0-.5 3H8a5 5 0 0 0-5 5v2H1zm16-9a2 2 0 0 0-2 2v1h-1a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-1v-1a2 2 0 0 0-2-2zm0 2a.5.5 0 0 1 .5.5V17h-1v-.5a.5.5 0 0 1 .5-.5z"/>
    </svg>
  );
}

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative cursor-text" onClick={() => inputRef.current?.focus()}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        className="absolute opacity-0 inset-0 w-full h-full"
        style={{ caretColor: 'transparent' }}
      />
      <div className="flex gap-2 justify-center pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="w-12 h-14 rounded-xl flex items-center justify-center text-2xl font-bold text-blink-ink transition-all"
            style={{
              background: '#F9F9F8',
              border: `1.5px solid ${value.length === i ? '#6366F1' : value.length > i ? '#C7D2FE' : '#E8E6E1'}`,
              boxShadow: value.length === i ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
            }}
          >
            {value[i] ?? ''}
          </div>
        ))}
      </div>
    </div>
  );
}

type Step = 'email' | 'otp';

function LoginPage() {
  const { loginWithGoogle, loginWithPasskey, initiateEmailOTP, verifyEmailOTP, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const preview = new URLSearchParams(window.location.search).get('preview');
  const [step, setStep] = useState<Step>(preview === 'otp' ? 'otp' : 'email');
  const [email, setEmail] = useState(preview === 'otp' ? 'preview@ejemplo.com' : '');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (isAuthenticated) navigate('/profile', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  function goBack() {
    if (step === 'otp') {
      setStep('email');
      setOtp('');
      setError('');
    } else {
      navigate(-1);
    }
  }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      await initiateEmailOTP(email.trim());
      setStep('otp');
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el código');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOtpSubmit(e: FormEvent) {
    e.preventDefault();
    if (otp.length < 6) return;
    setIsLoading(true);
    setError('');
    try {
      await verifyEmailOTP(email, otp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código incorrecto');
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError('');
    try {
      await initiateEmailOTP(email);
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reenviar');
    }
  }

  async function handleGoogleLogin() {
    setIsLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch {
      // user closed popup
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePasskeyLogin() {
    setIsLoading(true);
    setError('');
    try {
      await loginWithPasskey();
    } catch {
      // user closed popup
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col">
      {/* Header */}
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
          <button
            onClick={goBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-blink-muted hover:bg-blink-bg transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span className="flex-1 text-center font-semibold text-base text-blink-ink">
            {step === 'email' ? 'Accedé a Blink' : 'Verificá tu email'}
          </span>
          <div className="w-9" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center gap-6 px-4 py-8 lg:mx-auto lg:w-full lg:max-w-3xl lg:py-12">
        {step === 'email' ? (
          <>
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)', boxShadow: '0 8px 24px rgba(99,102,241,0.30)' }}
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
                {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full rounded-2xl flex items-center justify-center font-semibold text-base text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
                  style={{ height: 52, background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}
                >
                  {isLoading ? 'Enviando...' : 'Continuar con email'}
                </button>
              </form>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-blink-border" />
                <span className="text-xs text-blink-muted font-medium">o continuá con</span>
                <div className="flex-1 h-px bg-blink-border" />
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2.5 w-full rounded-xl font-semibold text-sm text-blink-ink transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
                  style={{ height: 48, background: '#FFFFFF', border: '1px solid #E8E6E1', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                >
                  <GoogleIcon />
                  Continuar con Google
                </button>

                <button
                  onClick={handlePasskeyLogin}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2.5 w-full rounded-xl font-semibold text-sm text-blink-ink transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
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
          </>
        ) : (
          <>
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)', boxShadow: '0 8px 24px rgba(99,102,241,0.30)' }}
            >
              <span className="material-symbols-outlined text-white" style={{ fontSize: 36 }}>mark_email_unread</span>
            </div>

            <div className="text-center">
              <h1 className="font-bold text-2xl text-blink-ink tracking-tight">Revisá tu email</h1>
              <p className="text-sm text-blink-muted mt-2 max-w-xs">
                Enviamos un código de 6 dígitos a{' '}
                <span className="font-semibold text-blink-ink">{email}</span>
              </p>
            </div>

            <div
              className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-5"
              style={{ background: '#FFFFFF', border: '1px solid #E8E6E1', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
            >
              <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
                <OtpInput value={otp} onChange={(v) => { setOtp(v); setError(''); }} />
                {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                <button
                  type="submit"
                  disabled={isLoading || otp.length < 6}
                  className="w-full rounded-2xl flex items-center justify-center font-semibold text-base text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
                  style={{ height: 52, background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}
                >
                  {isLoading ? 'Verificando...' : 'Verificar código'}
                </button>
              </form>

              <div className="flex items-center justify-center">
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="text-sm font-semibold transition-colors"
                  style={{ color: resendCooldown > 0 ? '#A8A49E' : '#6366F1' }}
                >
                  {resendCooldown > 0 ? `Reenviar código en ${resendCooldown}s` : 'Reenviar código'}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default LoginPage;
