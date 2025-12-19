import { Globe, MapPin, Percent, Calendar, CreditCard, Receipt } from "lucide-react";

export interface FilterMenuProps {
  // Online filter
  onlineOnly: boolean;
  onOnlineChange: (value: boolean) => void;

  // Distance filter
  maxDistance: number | undefined;
  onMaxDistanceChange: (value: number | undefined) => void;

  // Discount filter
  minDiscount: number | undefined;
  onMinDiscountChange: (value: number | undefined) => void;

  // Available day filter
  availableDay: string | undefined;
  onAvailableDayChange: (value: string | undefined) => void;

  // Card mode filter
  cardMode: 'credit' | 'debit' | undefined;
  onCardModeChange: (value: 'credit' | 'debit' | undefined) => void;

  // Network filter
  network: string | undefined;
  onNetworkChange: (value: string | undefined) => void;

  // Installments filter
  hasInstallments: boolean | undefined;
  onHasInstallmentsChange: (value: boolean | undefined) => void;

  // Close handler
  onClose: () => void;
}

const DISTANCE_OPTIONS = [
  { value: 5, label: "Cerca de mí (< 5km)" },
  { value: 10, label: "En mi área (< 10km)" },
  { value: 50, label: "En mi ciudad (< 50km)" },
];

const DISCOUNT_OPTIONS = [
  { value: 10, label: "10% o más" },
  { value: 20, label: "20% o más" },
  { value: 30, label: "30% o más" },
  { value: 50, label: "50% o más" },
];

const DAY_OPTIONS = [
  { value: "today", label: "Hoy" },
  { value: "monday", label: "Lunes" },
  { value: "tuesday", label: "Martes" },
  { value: "wednesday", label: "Miércoles" },
  { value: "thursday", label: "Jueves" },
  { value: "friday", label: "Viernes" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

const NETWORK_OPTIONS = [
  { value: "visa", label: "VISA" },
  { value: "mastercard", label: "Mastercard" },
  { value: "amex", label: "American Express" },
];

export function FilterMenu({
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
  onClose,
}: FilterMenuProps) {
  // Helper to calculate active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (onlineOnly) count++;
    if (maxDistance) count++;
    if (minDiscount) count++;
    if (availableDay) count++;
    if (cardMode) count++;
    if (network) count++;
    if (hasInstallments !== undefined) count++;
    return count;
  };

  const activeCount = getActiveFilterCount();

  // Helper to clear all filters
  const handleClearAll = () => {
    onOnlineChange(false);
    onMaxDistanceChange(undefined);
    onMinDiscountChange(undefined);
    onAvailableDayChange(undefined);
    onCardModeChange(undefined);
    onNetworkChange(undefined);
    onHasInstallmentsChange(undefined);
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-30 max-h-[calc(100vh-200px)] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-700">Filtros</h3>
          {activeCount > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Limpiar todo
          </button>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Ubicación Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-gray-600" />
            <h4 className="text-sm font-semibold text-gray-700">Ubicación</h4>
          </div>
          <div className="space-y-2">
            {DISTANCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onMaxDistanceChange(maxDistance === option.value ? undefined : option.value);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  maxDistance === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
            {maxDistance && !DISTANCE_OPTIONS.some(opt => opt.value === maxDistance) && (
              <button
                onClick={() => onMaxDistanceChange(undefined)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm bg-blue-500 text-white"
              >
                Todos
              </button>
            )}
            {!maxDistance && (
              <button
                className="w-full text-left px-3 py-2 rounded-lg text-sm bg-gray-50 text-gray-700"
              >
                Todos
              </button>
            )}
          </div>
        </div>

        {/* Descuento Mínimo Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Percent className="w-4 h-4 text-gray-600" />
            <h4 className="text-sm font-semibold text-gray-700">Descuento Mínimo</h4>
          </div>
          <div className="space-y-2">
            {DISCOUNT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onMinDiscountChange(minDiscount === option.value ? undefined : option.value);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  minDiscount === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Disponibilidad Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-gray-600" />
            <h4 className="text-sm font-semibold text-gray-700">Disponibilidad</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DAY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onAvailableDayChange(availableDay === option.value ? undefined : option.value);
                }}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  availableDay === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tipo de Tarjeta Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-gray-600" />
            <h4 className="text-sm font-semibold text-gray-700">Tipo de Tarjeta</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onCardModeChange(cardMode === 'credit' ? undefined : 'credit');
              }}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                cardMode === 'credit'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Crédito
            </button>
            <button
              onClick={() => {
                onCardModeChange(cardMode === 'debit' ? undefined : 'debit');
              }}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                cardMode === 'debit'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Débito
            </button>
          </div>
        </div>

        {/* Red de Pago Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-gray-600" />
            <h4 className="text-sm font-semibold text-gray-700">Red de Pago</h4>
          </div>
          <div className="space-y-2">
            {NETWORK_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onNetworkChange(network === option.value ? undefined : option.value);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  network === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modalidad Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-gray-600" />
            <h4 className="text-sm font-semibold text-gray-700">Modalidad</h4>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => {
                onOnlineChange(!onlineOnly);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                onlineOnly
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>Online</span>
              {onlineOnly && <span className="text-xs">✓</span>}
            </button>
            <button
              onClick={() => {
                onHasInstallmentsChange(hasInstallments === true ? undefined : true);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                hasInstallments === true
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                <span>Con cuotas sin interés</span>
              </div>
              {hasInstallments === true && <span className="text-xs">✓</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
