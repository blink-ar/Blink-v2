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
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-end bg-black/60 backdrop-blur-sm">
      <button
        aria-label="Cerrar selector de bancos"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="w-full h-[85vh] bg-blink-surface border-t-2 border-blink-ink flex flex-col shadow-hard relative">
        <div className="flex items-center justify-between p-4 border-b-2 border-blink-ink bg-blink-warning">
          <h2 className="font-display text-xl sm:text-2xl uppercase tracking-tight whitespace-nowrap">
            Seleccionar Bancos
          </h2>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center border-2 border-blink-ink bg-white"
          >
            <span className="material-symbols-outlined font-bold text-4xl text-blink-ink">close</span>
          </button>
        </div>

        <div className="p-4 border-b-2 border-blink-ink bg-blink-bg space-y-3">
          <div className="relative h-12 w-full">
            <input
              className="w-full h-full border-2 border-blink-ink px-4 pr-10 font-mono text-sm bg-white focus:ring-0 focus:outline-none placeholder-gray-500 shadow-hard-sm"
              placeholder="Buscar banco..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-blink-ink">search</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="font-mono text-xs font-bold text-gray-500 uppercase">
              {filteredOptions.length} Entidades Disponibles
            </span>
            <button
              onClick={toggleSelectAll}
              className="text-xs font-display underline decoration-2 underline-offset-2 uppercase whitespace-nowrap hover:text-blink-accent"
            >
              {allFilteredSelected ? 'Limpiar Todos' : 'Seleccionar Todos'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-white">
          <div className="grid grid-cols-3 gap-3">
            {filteredOptions.map((option) => {
              const isSelected = draftTokens.includes(option.token);
              return (
                <button
                  key={option.token}
                  onClick={() => toggleToken(option.token)}
                  className="aspect-square relative cursor-pointer group"
                >
                  <div
                    className={`absolute inset-0 border-2 border-blink-ink shadow-hard-sm flex flex-col items-center justify-center p-2 transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                      isSelected ? 'bg-primary' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-display text-2xl text-blink-ink uppercase tracking-tighter">{option.code}</span>
                    <span className="font-mono text-[10px] font-bold mt-1 uppercase text-center">{option.label}</span>
                    <div
                      className={`absolute top-1 right-1 w-7 h-7 border-2 border-blink-ink flex items-center justify-center ${
                        isSelected ? 'bg-blink-ink text-primary' : 'bg-white text-transparent'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">check</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="h-20" />
        </div>

        <div className="p-4 border-t-2 border-blink-ink bg-blink-bg">
          <button
            onClick={() => onApply(draftTokens)}
            className="w-full bg-blink-ink text-white font-display text-lg py-4 border-2 border-blink-ink shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all uppercase flex justify-between px-6 items-center"
          >
            <span>Aplicar Filtros</span>
            <span className="bg-primary text-blink-ink text-xs font-mono font-bold px-2 py-1 border border-blink-ink whitespace-nowrap">
              {draftTokens.length} Seleccionados
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BankFilterSheet;
