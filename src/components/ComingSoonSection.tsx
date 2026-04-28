import React from 'react';

const COMING_SOON_BANKS = [
  { name: 'Macro',         initials: 'MA', color: '#E8A200' },
  { name: 'HSBC',          initials: 'HS', color: '#DB0011' },
  { name: 'Supervielle',   initials: 'SV', color: '#FF6B35' },
  { name: 'Credicoop',     initials: 'CC', color: '#004F9F' },
  { name: 'Brubank',       initials: 'BR', color: '#1A1A2E' },
  { name: 'Mercado Pago',  initials: 'MP', color: '#00BCFF' },
  { name: 'Ualá',          initials: 'UA', color: '#5C2D8C' },
  { name: 'NaranjaX',      initials: 'NX', color: '#F15A22' },
];

const ComingSoonSection: React.FC = () => (
  <section className="px-4 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="font-semibold text-base text-blink-ink">Próximamente</h2>
        <span className="text-base">🏦</span>
      </div>
      <span
        className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
        style={{ background: '#EEF2FF', color: '#4338CA' }}
      >
        Novedades
      </span>
    </div>

    <div
      className="rounded-[24px] px-4 py-4"
      style={{
        background: 'linear-gradient(180deg, rgba(238,242,255,0.6) 0%, rgba(255,255,255,0.96) 100%)',
        border: '1px solid rgba(99,102,241,0.14)',
        boxShadow: '0 4px 16px rgba(99,102,241,0.06)',
      }}
    >
      <p className="text-center text-[13px] text-blink-muted mb-4 leading-snug">
        Más emisores se suman a Blink. ¡Avisanos si querés ver el tuyo antes!
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {COMING_SOON_BANKS.map((bank) => (
          <div
            key={bank.name}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #E8E6E1',
              opacity: 0.72,
            }}
          >
            {/* Avatar */}
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
              style={{ background: bank.color }}
            >
              {bank.initials}
            </span>
            <span className="text-sm font-medium text-blink-muted whitespace-nowrap">
              {bank.name}
            </span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-1"
              style={{ background: '#F3F4F6', color: '#9CA3AF' }}
            >
              Pronto
            </span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ComingSoonSection;
