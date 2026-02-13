import { useNavigate } from 'react-router-dom';

function MapPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col overflow-x-hidden">
      <header className="sticky top-0 z-50 w-full border-b-2 border-blink-ink bg-blink-surface">
        <div className="h-12 flex items-center gap-3 px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 bg-white border-2 border-blink-ink shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <span className="material-symbols-outlined text-blink-ink" style={{ fontSize: 24 }}>arrow_back</span>
          </button>
          <div className="font-display text-lg tracking-tighter uppercase">Mapa</div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
        <div className="w-32 h-32 border-2 border-blink-ink bg-primary shadow-hard flex items-center justify-center">
          <span className="material-symbols-outlined text-blink-ink" style={{ fontSize: 64 }}>
            map
          </span>
        </div>
        <div className="text-center">
          <h1 className="font-display text-2xl uppercase mb-2">Mapa</h1>
          <p className="font-mono text-sm text-blink-muted">
            Visualización de ubicaciones próximamente.
          </p>
        </div>
      </main>
    </div>
  );
}

export default MapPage;
