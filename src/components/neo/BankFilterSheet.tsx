import { useEffect, useMemo, useState } from 'react';

export interface BankFilterOption {
  token: string;
  code: string;
  label: string;
}

interface BankFilterSheetProps {
  isOpen: boolean;
  options: BankFilterOption[];
  selectedTokens: string[];
  onClose: () => void;
  onApply: (tokens: string[]) => void;
}

const BankFilterSheet = ({
  isOpen,
  options,
  selectedTokens,
  onClose,
  onApply,
}: BankFilterSheetProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [draftTokens, setDraftTokens] = useState<string[]>(selectedTokens);

  useEffect(() => {
    if (!isOpen) return;
    setSearchTerm('');
    setDraftTokens(selectedTokens);
  }, [isOpen, selectedTokens]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => {
      return (
        option.code.toLowerCase().includes(query) ||
        option.label.toLowerCase().includes(query) ||
        option.token.toLowerCase().includes(query)
      );
    });
  }, [options, searchTerm]);

  const allFilteredSelected =
    filteredOptions.length > 0 &&
    filteredOptions.every((option) => draftTokens.includes(option.token));

  const toggleToken = (token: string) => {
    setDraftTokens((current) =>
      current.includes(token)
        ? current.filter((value) => value !== token)
        : [...current, token],
    );
  };

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredSet = new Set(filteredOptions.map((option) => option.token));
      setDraftTokens((current) => current.filter((token) => !filteredSet.has(token)));
      return;
    }

    setDraftTokens((current) => {
      const next = new Set(current);
      filteredOptions.forEach((option) => next.add(option.token));
      return Array.from(next);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-end bg-black/40 backdrop-blur-sm">
      {/* Backdrop tap to close */}
      <button
        aria-label="Cerrar selector de bancos"
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="w-full h-[85vh] bg-white flex flex-col relative"
        style={{
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #E8E6E1' }}>
          <h2 className="font-semibold text-lg text-blink-ink">Seleccionar bancos</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-blink-bg text-blink-muted hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Search & Controls */}
        <div className="px-4 pt-3 pb-2 space-y-2.5" style={{ borderBottom: '1px solid #E8E6E1' }}>
          <div className="relative">
            <input
              className="w-full h-11 rounded-xl bg-blink-bg px-4 pr-10 text-sm text-blink-ink placeholder-blink-muted focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
              style={{ border: '1px solid #E8E6E1' }}
              placeholder="Buscar banco..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-blink-muted text-lg">search</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-blink-muted font-medium">
              {filteredOptions.length} entidades disponibles
            </span>
            <button
              onClick={toggleSelectAll}
              className="text-xs font-semibold text-primary hover:text-primary/70 transition-colors"
            >
              {allFilteredSelected ? 'Limpiar todos' : 'Seleccionar todos'}
            </button>
          </div>
        </div>

        {/* Bank Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-2.5">
            {filteredOptions.map((option) => {
              const isSelected = draftTokens.includes(option.token);
              return (
                <button
                  key={option.token}
                  onClick={() => toggleToken(option.token)}
                  className={`aspect-square relative rounded-2xl flex flex-col items-center justify-center p-2 transition-all duration-150 active:scale-95 ${
                    isSelected
                      ? 'bg-primary/10 ring-2 ring-primary/40'
                      : 'bg-blink-bg border border-blink-border hover:border-primary/30'
                  }`}
                >
                  <span
                    className={`font-bold text-lg tracking-tight ${isSelected ? 'text-primary' : 'text-blink-ink'}`}
                  >
                    {option.code}
                  </span>
                  <span className={`text-[10px] font-medium mt-0.5 text-center leading-tight ${isSelected ? 'text-primary/80' : 'text-blink-muted'}`}>
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
          <div className="h-20" />
        </div>

        {/* Apply Button */}
        <div className="p-4" style={{ borderTop: '1px solid #E8E6E1' }}>
          <button
            onClick={() => onApply(draftTokens)}
            className="w-full text-white font-semibold py-4 rounded-2xl text-base transition-all duration-200 active:scale-[0.98] flex justify-between items-center px-5"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' }}
          >
            <span>Aplicar filtros</span>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.25)' }}
            >
              {draftTokens.length} sel.
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BankFilterSheet;
