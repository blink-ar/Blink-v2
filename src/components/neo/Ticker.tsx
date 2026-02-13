import React from 'react';

interface TickerProps {
  count: number;
}

const Ticker: React.FC<TickerProps> = ({ count }) => {
  const formattedCount = count.toLocaleString('es-AR');
  const items = [
    `⚡ ${formattedCount} BENEFICIOS ACTIVOS ⚡`,
    'NO TE DUERMAS',
    `⚡ ${formattedCount} BENEFICIOS ACTIVOS ⚡`,
    'AHORRÁ HOY',
    `⚡ ${formattedCount} BENEFICIOS ACTIVOS ⚡`,
    'NO TE DUERMAS',
  ];

  return (
    <div className="bg-blink-warning border-t-2 border-blink-ink py-1 overflow-hidden whitespace-nowrap relative">
      <div className="inline-flex animate-marquee">
        {items.map((text, i) => (
          <span key={i} className="text-sm font-bold font-mono mx-4">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Ticker;
