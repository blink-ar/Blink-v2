import React from 'react';

const DISTANCE_OPTIONS = [
  { value: 5, label: 'Cerca (< 5km)' },
  { value: 10, label: 'Mi área (< 10km)' },
  { value: 50, label: 'Mi ciudad (< 50km)' },
];

const DISCOUNT_OPTIONS = [
  { value: 10, label: '10%+' },
  { value: 20, label: '20%+' },
  { value: 30, label: '30%+' },
  { value: 50, label: '50%+' },
];

const DAY_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'monday', label: 'Lun' },
  { value: 'tuesday', label: 'Mar' },
  { value: 'wednesday', label: 'Mié' },
  { value: 'thursday', label: 'Jue' },
  { value: 'friday', label: 'Vie' },
  { value: 'saturday', label: 'Sáb' },
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
  onOnlineChange: (v: boolean) => void;
  maxDistance: number | undefined;
  onMaxDistanceChange: (v: number | undefined) => void;
  minDiscount: number | undefined;
  onMinDiscountChange: (v: number | undefined) => void;
  availableDay: string | undefined;
  onAvailableDayChange: (v: string | undefined) => void;
  cardMode: 'credit' | 'debit' | undefined;
  onCardModeChange: (v: 'credit' | 'debit' | undefined) => void;
  network: string | undefined;
  onNetworkChange: (v: string | undefined) => void;
  hasInstallments: boolean | undefined;
  onHasInstallmentsChange: (v: boolean | undefined) => void;
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

  const handleClearAll = () => {
    onOnlineChange(false);
    onMaxDistanceChange(undefined);
    onMinDiscountChange(undefined);
    onAvailableDayChange(undefined);
    onCardModeChange(undefined);
    onNetworkChange(undefined);
    onHasInstallmentsChange(undefined);
  };

  const activeCount = [
    onlineOnly,
    maxDistance !== undefined,
    minDiscount !== undefined,
    availableDay !== undefined,
    cardMode !== undefined,
    network !== undefined,
    hasInstallments !== undefined,
  ].filter(Boolean).length;

  const toggleBtn = (isActive: boolean, onClick: () => void, label: string, key?: string | number) => (
    <button
      key={key}
      onClick={onClick}
      className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 ${
        isActive
          ? 'bg-primary text-white shadow-soft'
          : 'bg-white text-blink-ink border border-blink-border hover:border-primary/30 hover:bg-primary/5'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[60] bg-blink-bg overflow-y-auto">
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E8E6E1',
        }}
      >
        <div className="flex items-center gap-2.5">
          <h2 className="font-semibold text-lg text-blink-ink">Filtros</h2>
          {activeCount > 0 && (
            <span className="bg-primary text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-primary font-medium hover:text-primary/70 transition-colors"
            >
              Limpiar
            </button>
          )}
          <button
            onClick={onClose}
            className="w-9 h-9 bg-blink-bg border border-blink-border rounded-xl flex items-center justify-center text-blink-ink hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-28">
        {/* Distance */}
        <div>
          <h3 className="text-sm font-semibold text-blink-muted uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">location_on</span>
            Ubicación
          </h3>
          <div className="flex flex-wrap gap-2">
            {DISTANCE_OPTIONS.map((opt) => toggleBtn(
              maxDistance === opt.value,
              () => onMaxDistanceChange(maxDistance === opt.value ? undefined : opt.value),
              opt.label,
              opt.value,
            ))}
          </div>
        </div>

        {/* Discount */}
        <div>
          <h3 className="text-sm font-semibold text-blink-muted uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">percent</span>
            Descuento mínimo
          </h3>
          <div className="flex flex-wrap gap-2">
            {DISCOUNT_OPTIONS.map((opt) => toggleBtn(
              minDiscount === opt.value,
              () => onMinDiscountChange(minDiscount === opt.value ? undefined : opt.value),
              opt.label,
              opt.value,
            ))}
          </div>
        </div>

        {/* Day */}
        <div>
          <h3 className="text-sm font-semibold text-blink-muted uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">calendar_today</span>
            Disponibilidad
          </h3>
          <div className="flex flex-wrap gap-2">
            {DAY_OPTIONS.map((opt) => toggleBtn(
              availableDay === opt.value,
              () => onAvailableDayChange(availableDay === opt.value ? undefined : opt.value),
              opt.label,
              opt.value,
            ))}
          </div>
        </div>

        {/* Card Mode */}
        <div>
          <h3 className="text-sm font-semibold text-blink-muted uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">credit_card</span>
            Tipo de tarjeta
          </h3>
          <div className="flex flex-wrap gap-2">
            {toggleBtn(cardMode === 'credit', () => onCardModeChange(cardMode === 'credit' ? undefined : 'credit'), 'Crédito')}
            {toggleBtn(cardMode === 'debit', () => onCardModeChange(cardMode === 'debit' ? undefined : 'debit'), 'Débito')}
          </div>
        </div>

        {/* Network */}
        <div>
          <h3 className="text-sm font-semibold text-blink-muted uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">payments</span>
            Red de pago
          </h3>
          <div className="flex flex-wrap gap-2">
            {NETWORK_OPTIONS.map((opt) => toggleBtn(
              network === opt.value,
              () => onNetworkChange(network === opt.value ? undefined : opt.value),
              opt.label,
              opt.value,
            ))}
          </div>
        </div>

        {/* Modality */}
        <div>
          <h3 className="text-sm font-semibold text-blink-muted uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">language</span>
            Modalidad
          </h3>
          <div className="flex flex-wrap gap-2">
            {toggleBtn(onlineOnly, () => onOnlineChange(!onlineOnly), 'Solo online')}
            {toggleBtn(
              hasInstallments === true,
              () => onHasInstallmentsChange(hasInstallments === true ? undefined : true),
              'Con cuotas s/int.',
            )}
          </div>
        </div>
      </div>

      {/* Apply button */}
      <div
        className="fixed bottom-0 left-0 w-full p-4"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid #E8E6E1',
        }}
      >
        <button
          onClick={onClose}
          className="w-full text-white font-semibold py-4 rounded-2xl text-base transition-all duration-200 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' }}
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
