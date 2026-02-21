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

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const presets = [5000, 10000, 15000, 25000];

  const { savings, total, cappedSavings } = useMemo(() => {
    const raw = Math.round((amount * discountPercentage) / 100);
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
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'linear-gradient(135deg, #F7F6F4 0%, #FFFFFF 100%)',
        border: '1px solid #E8E6E1',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-sm text-blink-ink">Simulación de ahorro</h3>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' }}
        >
          <span className="material-symbols-outlined text-primary text-base">calculate</span>
        </div>
      </div>

      {/* Amount selection */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {isEditing ? (
          <div
            className="flex-shrink-0 flex items-center rounded-xl overflow-hidden"
            style={{ border: '1.5px solid #6366f1', background: '#fff' }}
          >
            <span className="pl-3 text-xs font-medium text-blink-muted">$</span>
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
              className="w-24 px-1 py-2 text-sm font-semibold bg-transparent focus:outline-none text-blink-ink"
              placeholder="Monto"
            />
            <button
              onClick={() => { if (customInput) setIsEditing(false); }}
              className="px-2 py-2 text-primary"
            >
              <span className="material-symbols-outlined text-sm">check</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setIsEditing(true); setCustomInput(''); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
              customInput
                ? 'bg-primary text-white'
                : 'bg-blink-bg text-blink-ink border border-blink-border hover:border-primary/30'
            }`}
          >
            {customInput ? formatCurrency(amount) : 'Tu monto'}
            <span className="material-symbols-outlined text-xs">edit</span>
          </button>
        )}

        {presets.map((p) => (
          <button
            key={p}
            onClick={() => { setAmount(p); setCustomInput(''); setIsEditing(false); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 ${
              amount === p && !customInput
                ? 'bg-primary text-white shadow-soft'
                : 'bg-blink-bg text-blink-ink border border-blink-border hover:border-primary/30'
            }`}
          >
            {formatCurrency(p)}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-blink-muted">Consumo estimado</span>
          <span className="font-medium text-blink-muted line-through">
            {formatCurrency(amount)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-blink-positive font-medium">Descuento ({discountPercentage}%)</span>
          <span className="font-semibold text-blink-positive">−{formatCurrency(cappedSavings)}</span>
        </div>
        {maxCap && savings > cappedSavings && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-blink-muted">Tope aplicado</span>
            <span className="text-xs text-blink-muted">{maxCap}</span>
          </div>
        )}

        <div className="h-px bg-blink-border my-1" />

        <div
          className="flex justify-between items-center p-3 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' }}
        >
          <span className="font-semibold text-blink-ink">Total a pagar</span>
          <span className="font-bold text-lg text-primary">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SavingsSimulator;
