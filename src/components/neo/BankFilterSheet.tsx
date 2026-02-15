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
    <div className="fixed inset-0 z-[70]">
      <button
        aria-label="Cerrar selector de bancos"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
      />

      <div className="absolute inset-x-0 top-[16dvh] bottom-0 bg-blink-bg border-t-2 border-blink-ink flex flex-col">
        <div className="bg-blink-warning border-b-2 border-blink-ink px-4 py-6 flex items-center justify-between">
          <h2 className="font-display text-2xl sm:text-4xl uppercase tracking-tight whitespace-nowrap">
            Seleccionar Bancos
          </h2>
          <button
            onClick={onClose}
            className="w-14 h-14 border-2 border-blink-ink bg-white flex items-center justify-center shadow-hard-sm"
          >
            <span className="material-symbols-outlined text-4xl text-blink-ink">close</span>
          </button>
        </div>

        <div className="px-4 py-5 border-b-2 border-blink-ink">
          <div className="h-16 bg-white border-2 border-blink-ink shadow-hard-sm flex items-center px-4">
            <input
              className="flex-1 h-full bg-transparent font-mono text-2xl text-blink-ink placeholder:text-slate-500 focus:outline-none"
              placeholder="Buscar banco..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <span className="material-symbols-outlined text-4xl text-blink-ink">search</span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="font-mono text-lg sm:text-xl text-slate-500 uppercase font-bold">
              {filteredOptions.length} Entidades Disponibles
            </span>
            <button
              onClick={toggleSelectAll}
              className="font-display text-xl sm:text-2xl uppercase underline decoration-2 decoration-blink-ink whitespace-nowrap"
            >
              {allFilteredSelected ? 'Limpiar Todos' : 'Seleccionar Todos'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {filteredOptions.map((option) => {
              const isSelected = draftTokens.includes(option.token);
              return (
                <button
                  key={option.token}
                  onClick={() => toggleToken(option.token)}
                  className={`relative h-36 sm:h-40 border-2 border-blink-ink shadow-hard-sm px-2 py-4 flex flex-col justify-center items-center transition-colors ${
                    isSelected ? 'bg-primary' : 'bg-blink-bg'
                  }`}
                >
                  <span className="font-display text-3xl sm:text-5xl leading-none tracking-tight">{option.code}</span>
                  <span className="mt-2 sm:mt-3 font-mono text-base sm:text-xl leading-none uppercase text-center">
                    {option.label}
                  </span>
                  <span
                    className={`absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 border-2 border-blink-ink flex items-center justify-center ${
                      isSelected ? 'bg-blink-ink text-primary' : 'bg-white text-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl sm:text-2xl">check</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t-2 border-blink-ink bg-blink-bg">
          <button
            onClick={() => onApply(draftTokens)}
            className="w-full h-20 bg-blink-ink text-white border-2 border-blink-ink shadow-hard flex items-center justify-between px-4 sm:px-6"
          >
            <span className="font-display text-lg sm:text-4xl uppercase tracking-tight">Aplicar Filtros</span>
            <span className="bg-primary text-blink-ink border-2 border-blink-ink px-2 sm:px-3 py-1 font-display text-lg sm:text-3xl uppercase tracking-tight whitespace-nowrap">
              {draftTokens.length} Seleccionados
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BankFilterSheet;
