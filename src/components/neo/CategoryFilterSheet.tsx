import { useEffect, useState } from 'react';

export interface CategoryOption {
  token: string;
  label: string;
  icon: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { token: 'gastronomia',     label: 'Gastronomía',     icon: 'restaurant' },
  { token: 'moda',            label: 'Moda',             icon: 'checkroom' },
  { token: 'viajes',          label: 'Viajes',           icon: 'flight' },
  { token: 'entretenimiento', label: 'Entretenimiento',  icon: 'movie' },
  { token: 'deportes',        label: 'Deportes',         icon: 'sports_soccer' },
  { token: 'belleza',         label: 'Belleza',          icon: 'face_retouching_natural' },
  { token: 'hogar',           label: 'Hogar',            icon: 'home' },
  { token: 'electro',         label: 'Electro',          icon: 'electrical_services' },
  { token: 'shopping',        label: 'Shopping',         icon: 'shopping_bag' },
  { token: 'automotores',     label: 'Automotores',      icon: 'directions_car' },
  { token: 'regalos',         label: 'Regalos',          icon: 'card_giftcard' },
  { token: 'jugueterias',     label: 'Jugueterías',      icon: 'toys' },
  { token: 'otros',           label: 'Otros',            icon: 'more_horiz' },
];

interface CategoryFilterSheetProps {
  isOpen: boolean;
  selected: string;
  onClose: () => void;
  onApply: (category: string) => void;
}

const CategoryFilterSheet = ({
  isOpen,
  selected,
  onClose,
  onApply,
}: CategoryFilterSheetProps) => {
  const [draft, setDraft] = useState(selected);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(selected);
  }, [isOpen, selected]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggle = (token: string) => {
    setDraft((current) => (current === token ? '' : token));
  };

  const activeOption = CATEGORY_OPTIONS.find((o) => o.token === draft);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-end bg-black/40 backdrop-blur-sm">
      {/* Backdrop */}
      <button aria-label="Cerrar selector de categorías" className="absolute inset-0" onClick={onClose} />

      {/* Sheet */}
      <div
        className="w-full h-[85vh] bg-white flex flex-col relative"
        style={{ borderRadius: '24px 24px 0 0', boxShadow: '0 -8px 40px rgba(0,0,0,0.12)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #E8E6E1' }}>
          <h2 className="font-semibold text-lg text-blink-ink">Categoría</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-blink-bg text-blink-muted hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-2.5">
            {CATEGORY_OPTIONS.map((option) => {
              const isSelected = draft === option.token;
              return (
                <button
                  key={option.token}
                  onClick={() => toggle(option.token)}
                  className={`aspect-square relative rounded-2xl flex flex-col items-center justify-center p-2 gap-1.5 transition-all duration-150 active:scale-95 ${
                    isSelected
                      ? 'bg-primary/10 ring-2 ring-primary/40'
                      : 'bg-blink-bg border border-blink-border hover:border-primary/30'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${isSelected ? 'text-primary' : 'text-blink-muted'}`}
                    style={{ fontSize: 26 }}
                  >
                    {option.icon}
                  </span>
                  <span
                    className={`text-[10px] font-semibold text-center leading-tight ${isSelected ? 'text-primary' : 'text-blink-ink'}`}
                  >
                    {option.label}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-white" style={{ fontSize: 12 }}>check</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Apply */}
        <div className="p-4 pt-0" style={{ borderTop: '1px solid #E8E6E1' }}>
          <button
            onClick={() => onApply(draft)}
            className="w-full text-white font-semibold py-4 rounded-2xl text-base transition-all duration-200 active:scale-[0.98] flex justify-between items-center px-5"
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
          >
            <span>Aplicar filtro</span>
            {activeOption && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.25)' }}
              >
                {activeOption.label}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryFilterSheet;
