import React from 'react';

interface TickerProps {
  count: number;
}

const Ticker: React.FC<TickerProps> = ({ count }) => {
  const formattedCount = count.toLocaleString('es-AR');

  return (
    <div
      className="py-1.5 px-4 flex items-center justify-center gap-2"
      style={{
        background: 'linear-gradient(135deg, #EEF2FF 0%, #e0e7ff 100%)',
        borderBottom: '1px solid rgba(99,102,241,0.12)',
      }}
    >
      <span className="text-xs font-medium text-primary/80 tracking-wide">
        ✦ {formattedCount} beneficios activos
      </span>
    </div>
  );
};

export default Ticker;
