import { useEffect, useMemo, useState } from 'react';
import type { BankFilterOption } from './BankFilterSheet';
import { CATEGORY_OPTIONS } from './CategoryFilterSheet';

export const DISCOUNT_OPTIONS = [
  { value: 10, label: '10%+' },
  { value: 20, label: '20%+' },
  { value: 30, label: '30%+' },
  { value: 50, label: '50%+' },
];

export const DAY_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'monday', label: 'Lun' },
  { value: 'tuesday', label: 'Mar' },
  { value: 'wednesday', label: 'Mié' },
  { value: 'thursday', label: 'Jue' },
  { value: 'friday', label: 'Vie' },
  { value: 'saturday', label: 'Sáb' },
  { value: 'sunday', label: 'Dom' },
];

export interface UnifiedFilterValues {
  selectedBanks: string[];
  selectedCategory: string;
  minDiscount: number | undefined;
  availableDay: string | undefined;
  cardMode: 'credit' | 'debit' | undefined;
  onlineOnly: boolean;
  hasInstallments: boolean | undefined;
  sortByDistance: boolean;
}

interface UnifiedFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bankOptions: BankFilterOption[];
  values: UnifiedFilterValues;
  onApply: (values: UnifiedFilterValues) => void;
}

const UnifiedFilterSheet = ({
  isOpen,
  onClose,
  bankOptions,
  values,
  onApply,
}: UnifiedFilterSheetProps) => {
  const [draft, setDraft] = useState<UnifiedFilterValues>(values);
  const [bankSearch, setBankSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setDraft(values);
    setBankSearch('');
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  const filteredBankOptions = useMemo(() => {
    const q = bankSearch.trim().toLowerCase();
    if (!q) return bankOptions;
    return bankOptions.filter((o) =>
      o.code.toLowerCase().includes(q) ||
      o.label.toLowerCase().includes(q) ||
      o.token.toLowerCase().includes(q),
    );
  }, [bankOptions, bankSearch]);

  const toggleBank = (token: string) => {
    setDraft((d) => ({
      ...d,
      selectedBanks: d.selectedBanks.includes(token)
        ? d.selectedBanks.filter((t) => t !== token)
        : [...d.selectedBanks, token],
    }));
  };

  const activeCount = [
    draft.selectedBanks.length > 0,
    !!draft.selectedCategory,
    draft.minDiscount !== undefined,
    draft.availableDay !== undefined,
    draft.cardMode !== undefined,
    draft.onlineOnly,
    draft.hasInstallments === true,
    draft.sortByDistance,
  ].filter(Boolean).length;

  const clearAll = () =>
    setDraft({
      selectedBanks: [],
      selectedCategory: '',
      minDiscount: undefined,
      availableDay: undefined,
      cardMode: undefined,
      onlineOnly: false,
      hasInstallments: undefined,
      sortByDistance: false,
    });

  if (!isOpen) return null;

  const SectionLabel = ({ icon, label }: { icon: string; label: string }) => (
    <div className="flex items-center gap-1.5 mb-3">
      <span className="material-symbols-outlined text-blink-muted" style={{ fontSize: 15 }}>{icon}</span>
      <h3 className="text-[11px] font-bold text-blink-muted uppercase tracking-wider">{label}</h3>
    </div>
  );

  const TogglePill = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 ${
        active
          ? 'bg-primary text-white'
          : 'bg-white text-blink-ink border border-blink-border hover:border-primary/30'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-end bg-black/40 backdrop-blur-sm">
      <button aria-label="Cerrar filtros" className="absolute inset-0" onClick={() => onApply(draft)} />

      <div
        className="w-full bg-white flex flex-col relative"
        style={{
          height: '92vh',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: '1px solid #E8E6E1' }}
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
                onClick={clearAll}
                className="text-sm text-primary font-medium hover:text-primary/70 transition-colors"
              >
                Limpiar
              </button>
            )}
            <button
              onClick={() => onApply(draft)}
              className="w-9 h-9 bg-blink-bg border border-blink-border rounded-xl flex items-center justify-center text-blink-ink hover:bg-gray-100 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-6">

            {/* Banks */}
            <div>
              <SectionLabel icon="account_balance" label="Banco" />
              <div className="relative mb-3">
                <input
                  className="w-full h-10 rounded-xl bg-blink-bg px-3 pr-9 text-sm text-blink-ink placeholder-blink-muted focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                  style={{ border: '1px solid #E8E6E1' }}
                  placeholder="Buscar banco..."
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                />
                <span
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-blink-muted"
                  style={{ fontSize: 16 }}
                >
                  search
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {filteredBankOptions.map((option) => {
                  const isSelected = draft.selectedBanks.includes(option.token);
                  return (
                    <button
                      key={option.token}
                      onClick={() => toggleBank(option.token)}
                      className={`py-3 relative rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 active:scale-95 ${
                        isSelected
                          ? 'bg-primary/10 ring-2 ring-primary/40'
                          : 'bg-blink-bg border border-blink-border hover:border-primary/30'
                      }`}
                    >
                      <span className={`font-bold text-base tracking-tight ${isSelected ? 'text-primary' : 'text-blink-ink'}`}>
                        {option.code}
                      </span>
                      <span className={`text-[9px] font-medium text-center leading-tight ${isSelected ? 'text-primary/80' : 'text-blink-muted'}`}>
                        {option.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-white" style={{ fontSize: 11 }}>check</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {draft.selectedBanks.length > 0 && (
                <button
                  onClick={() => setDraft((d) => ({ ...d, selectedBanks: [] }))}
                  className="mt-2.5 text-xs text-primary/70 font-medium hover:text-primary transition-colors"
                >
                  Quitar selección ({draft.selectedBanks.length})
                </button>
              )}
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #F1F0EC' }} />

            {/* Category */}
            <div>
              <SectionLabel icon="category" label="Categoría" />
              <div className="grid grid-cols-3 gap-2">
                {CATEGORY_OPTIONS.map((option) => {
                  const isSelected = draft.selectedCategory === option.token;
                  return (
                    <button
                      key={option.token}
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          selectedCategory: d.selectedCategory === option.token ? '' : option.token,
                        }))
                      }
                      className={`py-3 relative rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-150 active:scale-95 ${
                        isSelected
                          ? 'bg-primary/10 ring-2 ring-primary/40'
                          : 'bg-blink-bg border border-blink-border hover:border-primary/30'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined ${isSelected ? 'text-primary' : 'text-blink-muted'}`}
                        style={{ fontSize: 22 }}
                      >
                        {option.icon}
                      </span>
                      <span className={`text-[9px] font-semibold text-center leading-tight ${isSelected ? 'text-primary' : 'text-blink-ink'}`}>
                        {option.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-white" style={{ fontSize: 11 }}>check</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #F1F0EC' }} />

            {/* Discount */}
            <div>
              <SectionLabel icon="percent" label="Descuento mínimo" />
              <div className="flex flex-wrap gap-2">
                {DISCOUNT_OPTIONS.map((opt) => (
                  <TogglePill
                    key={opt.value}
                    active={draft.minDiscount === opt.value}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        minDiscount: d.minDiscount === opt.value ? undefined : opt.value,
                      }))
                    }
                  >
                    {opt.label}
                  </TogglePill>
                ))}
              </div>
            </div>

            {/* Day */}
            <div>
              <SectionLabel icon="calendar_today" label="Disponibilidad" />
              <div className="flex flex-wrap gap-2">
                {DAY_OPTIONS.map((opt) => (
                  <TogglePill
                    key={opt.value}
                    active={draft.availableDay === opt.value}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        availableDay: d.availableDay === opt.value ? undefined : opt.value,
                      }))
                    }
                  >
                    {opt.label}
                  </TogglePill>
                ))}
              </div>
            </div>

            {/* Card Mode */}
            <div>
              <SectionLabel icon="credit_card" label="Tipo de tarjeta" />
              <div className="flex gap-2">
                <TogglePill
                  active={draft.cardMode === 'credit'}
                  onClick={() =>
                    setDraft((d) => ({ ...d, cardMode: d.cardMode === 'credit' ? undefined : 'credit' }))
                  }
                >
                  Crédito
                </TogglePill>
                <TogglePill
                  active={draft.cardMode === 'debit'}
                  onClick={() =>
                    setDraft((d) => ({ ...d, cardMode: d.cardMode === 'debit' ? undefined : 'debit' }))
                  }
                >
                  Débito
                </TogglePill>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #F1F0EC' }} />

            {/* Más opciones */}
            <div>
              <SectionLabel icon="tune" label="Más opciones" />
              <div className="flex flex-wrap gap-2">
                <TogglePill
                  active={draft.onlineOnly}
                  onClick={() => setDraft((d) => ({ ...d, onlineOnly: !d.onlineOnly }))}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>language</span>
                    Solo online
                  </span>
                </TogglePill>
                <TogglePill
                  active={draft.hasInstallments === true}
                  onClick={() =>
                    setDraft((d) => ({ ...d, hasInstallments: d.hasInstallments === true ? undefined : true }))
                  }
                >
                  Cuotas sin interés
                </TogglePill>
                <TogglePill
                  active={draft.sortByDistance}
                  onClick={() => setDraft((d) => ({ ...d, sortByDistance: !d.sortByDistance }))}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>near_me</span>
                    Más cercanos
                  </span>
                </TogglePill>
              </div>
            </div>

            <div className="h-4" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default UnifiedFilterSheet;
