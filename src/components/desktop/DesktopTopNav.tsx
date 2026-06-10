import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { label: 'Buscar', path: '/search', icon: 'search', match: ['/search', '/descuentos'] },
  { label: 'Mapa', path: '/map', icon: 'map', match: ['/map'] },
  { label: 'Guardados', path: '/saved', icon: 'favorite', match: ['/saved'] },
  { label: 'Notificaciones', path: '/notifications', icon: 'notifications', match: ['/notifications'] },
];

function DesktopTopNav() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const isActive = (matches: string[]) =>
    matches.some((match) => location.pathname === match || location.pathname.startsWith(`${match}/`));

  return (
    <nav
      className="sticky top-0 z-[80] hidden h-16 border-b border-blink-border bg-white/95 backdrop-blur-xl lg:block"
      aria-label="Navegacion principal"
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-8">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-xl px-2 py-1 text-xl font-black tracking-tight text-blink-ink transition-colors hover:text-primary"
          aria-label="Blink inicio"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-indigo text-white shadow-soft">
            B
          </span>
          Blink
        </Link>

        <div className="flex items-center gap-1.5">
          {navItems.map((item) => {
            const active = isActive(item.match);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-blink-muted hover:bg-blink-bg hover:text-blink-ink'
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 19, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>

        <Link
          to={isAuthenticated ? '/profile' : '/login'}
          className={`flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors ${
            location.pathname.startsWith('/profile') || location.pathname.startsWith('/login')
              ? 'bg-primary/10 text-primary'
              : 'text-blink-muted hover:bg-blink-bg hover:text-blink-ink'
          }`}
        >
          <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gradient-indigo text-xs font-bold text-white">
            {user?.picture ? (
              <img src={user.picture} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              (user?.name || 'P').charAt(0).toUpperCase()
            )}
          </span>
          {isAuthenticated ? 'Perfil' : 'Ingresar'}
        </Link>
      </div>
    </nav>
  );
}

export default DesktopTopNav;
