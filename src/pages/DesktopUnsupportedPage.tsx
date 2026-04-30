function DesktopUnsupportedPage() {
  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col items-center justify-center px-8 gap-6">
      <div className="w-24 h-24 border-2 border-blink-ink bg-blink-surface shadow-hard flex items-center justify-center">
        <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 48 }}>
          smartphone
        </span>
      </div>

      <div className="text-center max-w-xs">
        <h1 className="font-display text-2xl uppercase mb-2">Solo Mobile</h1>
        <p className="font-mono text-sm text-blink-muted leading-relaxed">
          Lo sentimos, Blink solo está disponible en dispositivos móviles por ahora.
        </p>
      </div>
    </div>
  );
}

export default DesktopUnsupportedPage;
