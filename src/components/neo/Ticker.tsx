import React from 'react';

interface TickerProps {
  count: number;
}

const Ticker: React.FC<TickerProps> = ({ count }) => {
  const formattedCount = count.toLocaleString('es-AR');
  const items = [
    `✦ ${formattedCount} beneficios activos`,
    'Ahorrá hoy',
    `✦ ${formattedCount} beneficios activos`,
    'Descubrí ofertas',
    `✦ ${formattedCount} beneficios activos`,
    'Ahorrá hoy',
  ];

  return (
    <div
      className="overflow-hidden whitespace-nowrap relative py-1.5"
      style={{
        background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
        borderBottom: '1px solid rgba(99,102,241,0.12)',
      }}
    >
      <div className="inline-flex animate-marquee">
        {items.map((text, i) => (
          <span
            key={i}
            className="text-xs font-medium mx-5 text-primary/80 tracking-wide"
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Ticker;
