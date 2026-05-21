import React, { useState, useMemo, useRef, useEffect } from 'react';

interface InstallmentSimulatorProps {
  installments: number;
}

const InstallmentSimulator: React.FC<InstallmentSimulatorProps> = ({ installments }) => {
  const [amount, setAmount] = useState(60000);
  const [customInput, setCustomInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const presets = [30000, 60000, 100000, 150000];

  const { perInstallment, remainder } = useMemo(() => {
    if (installments <= 0) return { perInstallment: amount, remainder: 0 };
    const base = Math.floor(amount / installments);
    return { perInstallment: base, remainder: amount - base * installments };
  }, [amount, installments]);

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
        <h3 className="font-semibold text-sm text-blink-ink">Simulación de cuotas</h3>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' }}
        >
          <span className="material-symbols-outlined text-primary text-base">calendar_month</span>
        </div>
      </div>

      {/* Amount selection */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {isEditing ? (
          <div
            className="flex-shrink-0 flex items-center rounded-xl overflow-hidden"
            style={{ border: '1.5px solid #6366F1', background: '#fff' }}
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
          <span className="text-blink-muted">Monto total</span>
          <span className="font-medium text-blink-ink">{formatCurrency(amount)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-blink-positive font-medium">{installments} cuotas sin interés</span>
          <span className="font-semibold text-blink-positive">$0 de interés</span>
        </div>
        {remainder > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-blink-muted">Última cuota</span>
            <span className="text-xs text-blink-muted">
              {formatCurrency(perInstallment + remainder)}
            </span>
          </div>
        )}

        <div className="h-px bg-blink-border my-1" />

        <div
          className="flex justify-between items-center p-3 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' }}
        >
          <span className="font-semibold text-blink-ink">{installments} cuotas de</span>
          <span className="font-bold text-lg text-primary">
            {formatCurrency(perInstallment)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default InstallmentSimulator;
