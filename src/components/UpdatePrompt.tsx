import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

const UpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-[90] flex justify-center px-4 pointer-events-none">
      <div
        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white pointer-events-auto w-full max-w-sm"
        style={{
          border: '1.5px solid rgba(99,102,241,0.2)',
          boxShadow: '0 4px 20px rgba(99,102,241,0.15)',
        }}
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <RefreshCw size={18} className="text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blink-ink leading-tight">Nueva versión disponible</p>
          <p className="text-xs text-blink-muted mt-0.5">Actualizá para obtener las últimas mejoras</p>
        </div>

        <button
          onClick={() => updateServiceWorker(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}
        >
          Actualizar
        </button>

        <button
          onClick={() => setNeedRefresh(false)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-blink-muted flex-shrink-0"
          aria-label="Cerrar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default UpdatePrompt;
