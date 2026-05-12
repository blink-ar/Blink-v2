import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { InstallSheet } from '../components/NotificationBanner';
import BottomNav from '../components/neo/BottomNav';

function isIOSBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  if (!/iphone|ipad|ipod/i.test(navigator.userAgent)) return false;
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
  return !standalone;
}

interface StoredNotification {
  _id: string;
  title: string;
  body: string;
  url: string;
  sentAt: string;
}

function groupByDay(notifications: StoredNotification[]): { label: string; items: StoredNotification[] }[] {
  const map = new Map<string, StoredNotification[]>();

  for (const n of notifications) {
    const date = new Date(n.sentAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let label: string;
    if (date.toDateString() === today.toDateString()) {
      label = 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = 'Ayer';
    } else {
      label = date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
      label = label.charAt(0).toUpperCase() + label.slice(1);
    }

    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(n);
  }

  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

function timeLabel(sentAt: string): string {
  return new Date(sentAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { isSupported, permission, isSubscribed, isLoading, subscribe } = usePushNotifications();
  const showBanner = isSupported && !isSubscribed && permission !== 'denied';

  const [iosNotInstalled] = useState<boolean>(isIOSBrowser);
  const [showInstallSheet, setShowInstallSheet] = useState(false);

  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch('/api/notifications/history')
      .then((r) => r.json())
      .then((data) => setNotifications(data.notifications ?? []))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const groups = groupByDay(notifications);

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
        <div className="h-14 flex items-center gap-3 px-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-blink-muted hover:bg-blink-bg transition-colors"
            aria-label="Volver"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <h1 className="font-bold text-lg tracking-tight text-blink-ink flex-1">Notificaciones</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col pb-32">
        {/* Subscribe banner */}
        {showBanner && (
          <div className="mx-4 mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 flex gap-3 items-start">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-900 leading-snug">
                No te pierdas ninguna notificación
              </p>
              <p className="text-xs text-blue-700 mt-0.5 leading-snug">
                Activá las notificaciones y recibilas en tu teléfono cuando se envíen.
              </p>
              <button
                onClick={subscribe}
                disabled={isLoading}
                className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 transition-colors"
              >
                {isLoading ? 'Activando...' : 'Activar notificaciones'}
              </button>
            </div>
          </div>
        )}

        {/* iOS install notification */}
        {iosNotInstalled && (
          <div className="px-4 mt-4">
            <p className="text-xs font-semibold text-blink-muted uppercase tracking-wide mb-2 px-1">Hoy</p>
            <button
              onClick={() => setShowInstallSheet(true)}
              className="w-full text-left rounded-2xl bg-white border border-gray-100 px-4 py-3 flex items-start gap-3 active:scale-[0.98] transition-transform"
              style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
              >
                <span className="material-symbols-outlined text-white" style={{ fontSize: 18 }}>install_mobile</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-blink-ink">Instalá la app de Blink</p>
                  <span className="text-[11px] text-blink-muted flex-shrink-0">Ahora</span>
                </div>
                <p className="text-xs text-blink-muted mt-0.5 line-clamp-2">
                  Para recibir notificaciones en tu teléfono, instalá Blink en tu pantalla de inicio. Tocá para ver cómo.
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Content */}
        {fetching ? (
          <div className="flex-1 flex flex-col gap-3 px-4 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center py-20">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-semibold text-blink-ink">Sin notificaciones aún</p>
            <p className="text-sm text-blink-muted">Cuando se envíen notificaciones aparecerán acá.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 px-4 mt-6">
            {groups.map(({ label, items }) => (
              <section key={label}>
                <p className="text-xs font-semibold text-blink-muted uppercase tracking-wide mb-2 px-1">
                  {label}
                </p>
                <div className="flex flex-col gap-2">
                  {items.map((n) => (
                    <button
                      key={n._id}
                      onClick={() => navigate(n.url.startsWith('/') ? n.url : '/')}
                      className="w-full text-left rounded-2xl bg-white border border-gray-100 px-4 py-3 flex items-start gap-3 active:scale-[0.98] transition-transform"
                      style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
                      >
                        <Bell className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-blink-ink truncate">{n.title}</p>
                          <span className="text-[11px] text-blink-muted flex-shrink-0">{timeLabel(n.sentAt)}</span>
                        </div>
                        {n.body && (
                          <p className="text-xs text-blink-muted mt-0.5 line-clamp-2">{n.body}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
      {showInstallSheet && <InstallSheet onClose={() => setShowInstallSheet(false)} />}
    </div>
  );
}
