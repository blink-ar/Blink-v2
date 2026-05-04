interface TodayDealsEntryPointProps {
  dealCount: number;
  topDiscount?: number;
  isLoading: boolean;
  onOpen: () => void;
}

function TodayDealsEntryPoint({
  dealCount,
  topDiscount,
  isLoading,
  onOpen,
}: TodayDealsEntryPointProps) {
  const countLabel = isLoading
    ? 'Buscando descuentos activos'
    : dealCount > 0
      ? `${dealCount} beneficios para ver uno por uno`
      : 'Explorá beneficios destacados';

  return (
    <section className="px-4">
      <button
        type="button"
        onClick={onOpen}
        className="group relative flex min-h-[148px] w-full overflow-hidden rounded-2xl bg-black p-5 text-left text-white shadow-soft-lg transition-transform duration-150 active:scale-[0.98]"
        aria-label="Abrir descuentos de hoy"
      >
        <div className="absolute right-5 top-5 rotate-[-5deg] rounded-[14px] bg-[#ff3b30] px-3.5 py-2 shadow-[0_14px_32px_rgba(255,59,48,0.24)]">
          <span className="text-xl font-black leading-none tracking-normal">
            {topDiscount ? `${topDiscount}% OFF` : 'HOY'}
          </span>
        </div>

        <div className="relative z-10 flex max-w-[70%] flex-col justify-between gap-8">
          <div>
            <div className="mb-3 inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 text-xs font-bold text-white/80">
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>
                swipe_vertical
              </span>
              Feed diario
            </div>
            <h2 className="text-2xl font-black leading-tight tracking-normal">Descuentos de hoy</h2>
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-white/70">
            <span>{countLabel}</span>
            <span className="material-symbols-outlined transition-transform duration-150 group-active:translate-x-1" aria-hidden="true" style={{ fontSize: 18 }}>
              arrow_forward
            </span>
          </div>
        </div>
      </button>
    </section>
  );
}

export default TodayDealsEntryPoint;
