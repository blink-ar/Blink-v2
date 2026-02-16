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
  { value: 'today', label: 'HOY' },
  { value: 'monday', label: 'LUN' },
  { value: 'tuesday', label: 'MAR' },
  { value: 'wednesday', label: 'MIÉ' },
  { value: 'thursday', label: 'JUE' },
  { value: 'friday', label: 'VIE' },
  { value: 'saturday', label: 'SÁB' },
  { value: 'sunday', label: 'DOM' },
];

const NETWORK_OPTIONS = [
  { value: 'visa', label: 'VISA' },
  { value: 'mastercard', label: 'MASTERCARD' },
  { value: 'amex', label: 'AMEX' },
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
      className={`px-4 py-2 border-2 border-blink-ink font-mono text-sm font-bold uppercase transition-colors ${
        isActive
          ? 'bg-blink-ink text-white shadow-none'
          : 'bg-white text-blink-ink shadow-hard-sm hover:bg-primary/20'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[60] bg-blink-bg overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-blink-surface border-b-2 border-blink-ink z-10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl uppercase">Filtros</h2>
          {activeCount > 0 && (
            <span className="bg-blink-accent text-white font-mono text-xs px-2 py-0.5 border-2 border-blink-ink">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button onClick={handleClearAll} className="font-mono text-xs underline decoration-2 decoration-blink-accent font-bold">
              LIMPIAR
            </button>
          )}
          <button
            onClick={onClose}
            className="w-10 h-10 bg-blink-ink text-white flex items-center justify-center border-2 border-blink-ink"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* Distance */}
        <div>
          <h3 className="font-display text-sm uppercase mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">location_on</span>
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
          <h3 className="font-display text-sm uppercase mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">percent</span>
            Descuento Mínimo
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
          <h3 className="font-display text-sm uppercase mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">calendar_today</span>
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
          <h3 className="font-display text-sm uppercase mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">credit_card</span>
            Tipo de Tarjeta
          </h3>
          <div className="flex flex-wrap gap-2">
            {toggleBtn(cardMode === 'credit', () => onCardModeChange(cardMode === 'credit' ? undefined : 'credit'), 'CRÉDITO')}
            {toggleBtn(cardMode === 'debit', () => onCardModeChange(cardMode === 'debit' ? undefined : 'debit'), 'DÉBITO')}
          </div>
        </div>

        {/* Network */}
        <div>
          <h3 className="font-display text-sm uppercase mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">payments</span>
            Red de Pago
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
          <h3 className="font-display text-sm uppercase mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">language</span>
            Modalidad
          </h3>
          <div className="flex flex-wrap gap-2">
            {toggleBtn(onlineOnly, () => onOnlineChange(!onlineOnly), 'SOLO ONLINE')}
            {toggleBtn(
              hasInstallments === true,
              () => onHasInstallmentsChange(hasInstallments === true ? undefined : true),
              'CON CUOTAS S/INT',
            )}
          </div>
        </div>
      </div>

      {/* Apply button */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-blink-surface border-t-2 border-blink-ink">
        <button
          onClick={onClose}
          className="w-full bg-blink-ink text-white font-display uppercase tracking-wider py-4 border-2 border-white shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-lg"
        >
          Aplicar Filtros
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
