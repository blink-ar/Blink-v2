function DesktopUnsupportedPage() {
  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col items-center justify-center px-8 gap-8">
      <div className="w-28 h-28 rounded-full border-2 border-blink-ink bg-blink-accent shadow-hard flex items-center justify-center">
        <span className="material-symbols-outlined text-white" style={{ fontSize: 56 }}>
          smartphone
        </span>
      </div>

      <div className="text-center max-w-sm">
        <h1 className="font-display text-3xl uppercase tracking-tighter mb-3">
          Solo Mobile
        </h1>
        <p className="font-mono text-sm text-blink-muted leading-relaxed">
          Lo sentimos, esta página solo está disponible en dispositivos móviles por ahora.
        </p>
      </div>

      <div className="w-full max-w-xs bg-blink-warning p-4 border-2 border-blink-ink shadow-hard text-center">
        <p className="font-mono text-xs font-bold uppercase">
          Por favor abrí Blink desde tu celular
        </p>
      </div>
    </div>
  );
}

export default DesktopUnsupportedPage;
