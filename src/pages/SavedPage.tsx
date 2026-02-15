import BottomNav from '../components/neo/BottomNav';

function SavedPage() {
  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col overflow-x-hidden">
      <header className="sticky top-0 z-50 w-full border-b-2 border-blink-ink bg-blink-surface">
        <div className="h-12 flex items-center justify-center px-4">
          <div className="font-display text-lg tracking-tighter uppercase">Guardados</div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 pb-24 px-8">
        <div className="w-24 h-24 border-2 border-blink-ink bg-blink-surface shadow-hard flex items-center justify-center">
          <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 48 }}>
            favorite
          </span>
        </div>
        <div className="text-center">
          <h1 className="font-display text-2xl uppercase mb-2">Próximamente</h1>
          <p className="font-mono text-sm text-blink-muted">
            Guardá tus beneficios favoritos para accederlos rápido.
          </p>
        </div>
        <div className="w-full max-w-xs bg-blink-warning p-3 border-2 border-blink-ink shadow-hard text-center">
          <p className="font-mono text-xs font-bold">
            ESTA FUNCIÓN ESTÁ EN DESARROLLO
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

export default SavedPage;
