import React from 'react';

const DISCOUNT_OPTIONS = [
  { value: 10, label: '10%+' },
  { value: 20, label: '20%+' },
  { value: 30, label: '30%+' },
  { value: 50, label: '50%+' },
];

const DISTANCE_OPTIONS = [
  { value: 2, label: '2 km' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
];

const DAY_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'monday', label: 'Lun' },
  { value: 'tuesday', label: 'Mar' },
  { value: 'wednesday', label: 'Mie' },
  { value: 'thursday', label: 'Jue' },
  { value: 'friday', label: 'Vie' },
  { value: 'saturday', label: 'Sab' },
  { value: 'sunday', label: 'Dom' },
];

const NETWORK_OPTIONS = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'amex', label: 'Amex' },
];

export interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onlineOnly: boolean;
  onOnlineChange: (value: boolean) => void;
  maxDistance: number | undefined;
  onMaxDistanceChange: (value: number | undefined) => void;
  minDiscount: number | undefined;
  onMinDiscountChange: (value: number | undefined) => void;
  availableDay: string | undefined;
  onAvailableDayChange: (value: string | undefined) => void;
  cardMode: 'credit' | 'debit' | undefined;
  onCardModeChange: (value: 'credit' | 'debit' | undefined) => void;
  network: string | undefined;
  onNetworkChange: (value: string | undefined) => void;
  hasInstallments: boolean | undefined;
  onHasInstallmentsChange: (value: boolean | undefined) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  onlineOnly,
  onOnlineChange,
  maxDistance,
  onMaxDistanceChange,
  minDiscount,
  onMinDiscountChange,
  availableDay,
  onAvailableDayChange,
  cardMode,
  onCardModeChange,
  network,
  onNetworkChange,
  hasInstallments,
  onHasInstallmentsChange,
}) => {
  if (!isOpen) return null;

  const activeCount = [
    onlineOnly,
    maxDistance !== undefined,
    minDiscount !== undefined,
    availableDay !== undefined,
    cardMode !== undefined,
    network !== undefined,
    hasInstallments === true,
  ].filter(Boolean).length;

  const handleClearAll = () => {
    onOnlineChange(false);
    onMaxDistanceChange(undefined);
    onMinDiscountChange(undefined);
    onAvailableDayChange(undefined);
    onCardModeChange(undefined);
    onNetworkChange(undefined);
    onHasInstallmentsChange(undefined);
  };

  const ToggleButton = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-150 active:scale-95 ${
        active
          ? 'bg-primary text-white shadow-soft'
          : 'border border-blink-border bg-white text-blink-ink hover:border-primary/30 hover:bg-primary/5'
      }`}
    >
      {children}
    </button>
  );

  const SectionLabel = ({ icon, label }: { icon: string; label: string }) => (
    <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blink-muted">
      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
        {icon}
      </span>
      {label}
    </h3>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/40 backdrop-blur-sm lg:items-center lg:justify-center lg:p-6">
      <button aria-label="Cerrar filtros" className="absolute inset-0" onClick={onClose} />

      <div
        className="relative flex max-h-[92vh] w-full flex-col rounded-t-[24px] bg-white lg:max-h-[82vh] lg:max-w-2xl lg:rounded-2xl"
        style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.12)' }}
      >
        <div className="flex justify-center pb-1 pt-3 lg:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        <div className="flex items-center justify-between border-b border-blink-border px-5 py-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold text-blink-ink">Filtros</h2>
            {activeCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                {activeCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-sm font-semibold text-primary transition-colors hover:text-primary/70"
              >
                Limpiar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-blink-border bg-blink-bg text-blink-ink transition-colors hover:bg-gray-100"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-6">
            <section>
              <SectionLabel icon="tune" label="Modo" />
              <div className="flex flex-wrap gap-2">
                <ToggleButton active={onlineOnly} onClick={() => onOnlineChange(!onlineOnly)}>
                  Solo online
                </ToggleButton>
                <ToggleButton
                  active={hasInstallments === true}
                  onClick={() => onHasInstallmentsChange(hasInstallments === true ? undefined : true)}
                >
                  Cuotas sin interes
                </ToggleButton>
              </div>
            </section>

            <section>
              <SectionLabel icon="percent" label="Descuento minimo" />
              <div className="flex flex-wrap gap-2">
                {DISCOUNT_OPTIONS.map((option) => (
                  <ToggleButton
                    key={option.value}
                    active={minDiscount === option.value}
                    onClick={() => onMinDiscountChange(minDiscount === option.value ? undefined : option.value)}
                  >
                    {option.label}
                  </ToggleButton>
                ))}
              </div>
            </section>

            <section>
              <SectionLabel icon="near_me" label="Distancia" />
              <div className="flex flex-wrap gap-2">
                {DISTANCE_OPTIONS.map((option) => (
                  <ToggleButton
                    key={option.value}
                    active={maxDistance === option.value}
                    onClick={() => onMaxDistanceChange(maxDistance === option.value ? undefined : option.value)}
                  >
                    {option.label}
                  </ToggleButton>
                ))}
              </div>
            </section>

            <section>
              <SectionLabel icon="calendar_today" label="Disponibilidad" />
              <div className="flex flex-wrap gap-2">
                {DAY_OPTIONS.map((option) => (
                  <ToggleButton
                    key={option.value}
                    active={availableDay === option.value}
                    onClick={() => onAvailableDayChange(availableDay === option.value ? undefined : option.value)}
                  >
                    {option.label}
                  </ToggleButton>
                ))}
              </div>
            </section>

            <section>
              <SectionLabel icon="credit_card" label="Tarjeta" />
              <div className="flex flex-wrap gap-2">
                <ToggleButton
                  active={cardMode === 'credit'}
                  onClick={() => onCardModeChange(cardMode === 'credit' ? undefined : 'credit')}
                >
                  Credito
                </ToggleButton>
                <ToggleButton
                  active={cardMode === 'debit'}
                  onClick={() => onCardModeChange(cardMode === 'debit' ? undefined : 'debit')}
                >
                  Debito
                </ToggleButton>
                {NETWORK_OPTIONS.map((option) => (
                  <ToggleButton
                    key={option.value}
                    active={network === option.value}
                    onClick={() => onNetworkChange(network === option.value ? undefined : option.value)}
                  >
                    {option.label}
                  </ToggleButton>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="border-t border-blink-border bg-white/95 p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-gradient-indigo py-4 text-base font-semibold text-white transition-all duration-200 active:scale-[0.98]"
          >
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
