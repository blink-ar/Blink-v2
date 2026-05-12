import { useEffect, useState } from 'react';

export interface CategoryOption {
  token: string;
  label: string;
  icon: string;
  emoji: string;
  bg: string;
  color: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { token: 'gastronomia',     label: 'Gastronomía',     icon: 'restaurant',             emoji: '🍕', bg: '#EEF2FF', color: '#4338CA' },
  { token: 'moda',            label: 'Moda',             icon: 'checkroom',              emoji: '👗', bg: '#FCE7F3', color: '#9D174D' },
  { token: 'viajes',          label: 'Viajes',           icon: 'flight',                 emoji: '✈️', bg: '#DBEAFE', color: '#1E40AF' },
  { token: 'entretenimiento', label: 'Entretenimiento',  icon: 'movie',                  emoji: '🎮', bg: '#EDE9FE', color: '#4C1D95' },
  { token: 'deportes',        label: 'Deportes',         icon: 'sports_soccer',          emoji: '⚽', bg: '#D1FAE5', color: '#065F46' },
  { token: 'belleza',         label: 'Belleza',          icon: 'face_retouching_natural', emoji: '💄', bg: '#FDF2F8', color: '#831843' },
  { token: 'hogar',           label: 'Hogar',            icon: 'home',                   emoji: '🏠', bg: '#ECFDF5', color: '#064E3B' },
  { token: 'electro',         label: 'Electro',          icon: 'electrical_services',    emoji: '💻', bg: '#EEF2FF', color: '#312E81' },
  { token: 'shopping',        label: 'Supermercado',     icon: 'shopping_bag',           emoji: '🛒', bg: '#F0FDF4', color: '#14532D' },
  { token: 'automotores',     label: 'Automotores',      icon: 'directions_car',         emoji: '🚗', bg: '#F3F4F6', color: '#374151' },
  { token: 'regalos',         label: 'Regalos',          icon: 'card_giftcard',          emoji: '🎁', bg: '#FEE2E2', color: '#991B1B' },
  { token: 'jugueterias',     label: 'Jugueterías',      icon: 'toys',                   emoji: '🧸', bg: '#FEF3C7', color: '#92400E' },
  { token: 'otros',           label: 'Otros',            icon: 'more_horiz',             emoji: '📦', bg: '#F8FAFC', color: '#475569' },
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
      <button aria-label="Cerrar selector de categorías" className="absolute inset-0" onClick={() => onApply(draft)} />

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
            onClick={() => onApply(draft)}
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
                  className="aspect-square relative rounded-2xl flex flex-col items-center justify-center p-2 gap-1.5 transition-all duration-150 active:scale-95"
                  style={isSelected ? {
                    backgroundColor: option.bg,
                    outline: `2px solid ${option.color}60`,
                    outlineOffset: '0px',
                  } : {
                    backgroundColor: option.bg,
                    border: `1px solid ${option.color}20`,
                  }}
                >
                  {/* Emoji icon */}
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{option.emoji}</span>

                  <span
                    className="text-[10px] font-semibold text-center leading-tight"
                    style={{ color: option.color }}
                  >
                    {option.label}
                  </span>

                  {isSelected && (
                    <div
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: option.color }}
                    >
                      <span className="material-symbols-outlined text-white" style={{ fontSize: 12 }}>check</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CategoryFilterSheet;
