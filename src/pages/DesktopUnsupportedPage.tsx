function DesktopUnsupportedPage() {
  return (
    <div className="bg-blink-bg text-blink-ink font-body min-h-screen flex flex-col items-center justify-center px-6 gap-8">
      <div className="font-bold text-2xl tracking-tight text-blink-ink">Blink</div>

      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
          boxShadow: '0 8px 28px rgba(99,102,241,0.35)',
        }}
      >
        <span className="material-symbols-outlined text-white" style={{ fontSize: 48 }}>
          smartphone
        </span>
      </div>

      <div className="text-center max-w-xs">
        <h1 className="text-[2rem] font-bold leading-tight text-blink-ink mb-3">
          Mucho mejor<br />
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
          >
            desde el celular 📱
          </span>
        </h1>
        <p className="text-blink-muted text-sm leading-relaxed">
          Blink está hecho para que encuentres tus descuentos en el momento justo, desde tu celu.
        </p>
      </div>
    </div>
  );
}

export default DesktopUnsupportedPage;
