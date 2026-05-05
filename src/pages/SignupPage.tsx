import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SocialAuthButtons from '../components/SocialAuthButtons';

function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await signup(name, email, password);
      navigate('/profile', { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Error al crear la cuenta. Intentá de nuevo.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b-2 border-blink-ink bg-blink-surface">
        <div className="h-12 flex items-center justify-center px-4">
          <span className="font-display text-lg tracking-tighter uppercase">Crear cuenta</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blink-accent shadow-hard flex items-center justify-center">
              <span className="material-symbols-outlined text-white" style={{ fontSize: 32 }}>
                person_add
              </span>
            </div>
            <h1 className="font-display text-2xl uppercase tracking-tight">Bienvenido a Blink</h1>
            <p className="font-mono text-xs text-blink-muted mt-1">Creá tu cuenta para guardar beneficios</p>
          </div>

          {error && (
            <div className="mb-4 p-3 border-2 border-blink-ink bg-red-50 text-red-700 font-mono text-xs rounded-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs font-bold uppercase tracking-wider">Nombre</label>
              <input
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full border-2 border-blink-ink bg-blink-surface px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blink-accent rounded-sm"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs font-bold uppercase tracking-wider">Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full border-2 border-blink-ink bg-blink-surface px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blink-accent rounded-sm"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-xs font-bold uppercase tracking-wider">Contraseña</label>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full border-2 border-blink-ink bg-blink-surface px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blink-accent rounded-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full bg-blink-accent text-white font-display uppercase tracking-wider py-3 border-2 border-blink-ink shadow-hard disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
            >
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-4">
            <SocialAuthButtons label="Registrarse" />
          </div>

          <p className="mt-6 text-center font-mono text-xs text-blink-muted">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-blink-accent font-bold underline">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default SignupPage;
