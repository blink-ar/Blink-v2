import React, { useState, useMemo, useRef, useEffect } from 'react';

interface SavingsSimulatorProps {
  discountPercentage: number;
  maxCap?: string | null;
}

const SavingsSimulator: React.FC<SavingsSimulatorProps> = ({ discountPercentage, maxCap }) => {
  const [amount, setAmount] = useState(12000);
  const [customInput, setCustomInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const presets = [5000, 10000, 15000, 25000];

  const { savings, total, cappedSavings } = useMemo(() => {
    const raw = Math.round((amount * discountPercentage) / 100);
    // Parse cap if provided (e.g., "$4.500" -> 4500)
    let cap = Infinity;
    if (maxCap) {
      const numStr = String(maxCap).replace(/[^0-9]/g, '');
      if (numStr) cap = parseInt(numStr, 10);
    }
    const capped = Math.min(raw, cap);
    return { savings: raw, total: amount - capped, cappedSavings: capped };
  }, [amount, discountPercentage, maxCap]);

  const formatCurrency = (n: number) =>
    `$${n.toLocaleString('es-AR')}`;

  return (
    <div className="bg-blink-bg border-2 border-blink-ink shadow-hard p-4">
      <div className="flex justify-between items-center mb-3 border-b-2 border-blink-ink pb-2">
        <h3 className="font-bold uppercase text-sm tracking-wide">Simulación de Ahorro</h3>
        <span className="material-symbols-outlined text-lg">calculate</span>
      </div>

      {/* Amount selection row */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {/* Custom amount toggle/input */}
        {isEditing ? (
          <div className="flex-shrink-0 flex items-center border-2 border-blink-ink bg-white">
            <span className="pl-2 font-mono text-xs font-bold text-blink-muted">$</span>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoFocus
              value={customInput}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '');
                setCustomInput(raw);
                if (raw) setAmount(parseInt(raw, 10));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customInput) setIsEditing(false);
              }}
              onBlur={() => {
                if (!customInput) { setIsEditing(false); }
              }}
              className="w-20 px-1 py-1 font-mono text-xs font-bold bg-transparent focus:outline-none"
              placeholder="Monto"
            />
            <button
              onClick={() => { if (customInput) setIsEditing(false); }}
              className="px-2 py-1 text-blink-ink hover:bg-primary/20"
            >
              <span className="material-symbols-outlined text-sm">check</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setIsEditing(true); setCustomInput(''); }}
            className={`flex-shrink-0 px-3 py-1 border-2 border-blink-ink font-mono text-xs font-bold transition-colors flex items-center gap-1.5 ${
              customInput
                ? 'bg-blink-ink text-white'
                : 'bg-white text-blink-ink hover:bg-primary/20'
            }`}
          >
            {customInput ? formatCurrency(amount) : 'Tu monto'}
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
        )}

        {/* Preset amounts */}
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => { setAmount(p); setCustomInput(''); setIsEditing(false); }}
            className={`flex-shrink-0 px-3 py-1 border-2 border-blink-ink font-mono text-xs font-bold transition-colors ${
              amount === p && !customInput
                ? 'bg-blink-ink text-white'
                : 'bg-white text-blink-ink hover:bg-primary/20'
            }`}
          >
            {formatCurrency(p)}
          </button>
        ))}
      </div>

      <div className="space-y-3 font-mono text-sm">
        <div className="flex justify-between items-center">
          <span className="text-blink-muted">Consumo estimado:</span>
          <span className="font-bold line-through decoration-2 decoration-blink-accent">
            {formatCurrency(amount)}
          </span>
        </div>
        <div className="flex justify-between items-center text-blink-accent">
          <span>Descuento ({discountPercentage}%):</span>
          <span className="font-bold">-{formatCurrency(cappedSavings)}</span>
        </div>
        {maxCap && savings > cappedSavings && (
          <div className="flex justify-between items-center text-xs text-blink-muted">
            <span>Tope aplicado:</span>
            <span>{maxCap}</span>
          </div>
        )}
        <div className="w-full border-t-2 border-dashed border-blink-muted/40 my-2" />
        <div className="flex justify-between items-center text-lg">
          <span className="font-bold">TOTAL A PAGAR:</span>
          <span className="bg-primary px-2 py-1 border-2 border-blink-ink font-bold">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SavingsSimulator;
