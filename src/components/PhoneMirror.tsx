import { ReactNode, useEffect, useState } from 'react';

interface PhoneMirrorProps {
  children: ReactNode;
}

const SHELL_HEIGHT = 864; // outer shell height in px (screen 844 + 10px padding × 2)

function PhoneMirror({ children }: PhoneMirrorProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)';
    return () => {
      document.body.style.background = prev;
    };
  }, []);

  useEffect(() => {
    const update = () => {
      // 64px total vertical padding (32px each side)
      setScale(Math.min(1, (window.innerHeight - 64) / SHELL_HEIGHT));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div
      style={{
        height: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '32px',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      }}
    >
      {/* Phone outer shell */}
      <div
        style={{
          width: '390px',
          height: `${SHELL_HEIGHT}px`,
          flexShrink: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          borderRadius: '52px',
          background: '#1a1a2e',
          padding: '10px',
          boxShadow:
            '0 0 0 1px #2a2a4a, 0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(99,102,241,0.08)',
          position: 'relative',
        }}
      >
        {/* Side buttons */}
        <div style={{ position: 'absolute', left: '-3px', top: '120px', width: '3px', height: '36px', background: '#2a2a4a', borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', left: '-3px', top: '168px', width: '3px', height: '64px', background: '#2a2a4a', borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', left: '-3px', top: '244px', width: '3px', height: '64px', background: '#2a2a4a', borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', right: '-3px', top: '160px', width: '3px', height: '80px', background: '#2a2a4a', borderRadius: '0 2px 2px 0' }} />

        {/* Screen area — transform: translateZ(0) makes position:fixed children
            (like BottomNav) anchor to this container instead of the viewport */}
        <div
          style={{
            borderRadius: '44px',
            overflow: 'hidden',
            background: '#ffffff',
            height: '844px',
            position: 'relative',
            transform: 'translateZ(0)',
          }}
        >
          {/* Dynamic island */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '120px',
              height: '34px',
              background: '#1a1a2e',
              borderRadius: '20px',
              zIndex: 50,
            }}
          />

          {/* Scrollable content area */}
          <div
            className="no-scrollbar"
            style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}
          >
            {/* Status bar spacer (sits behind dynamic island) */}
            <div style={{ height: '54px' }} />
            {/* Bottom padding so content isn't hidden under the nav */}
            <div style={{ paddingBottom: '72px' }}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhoneMirror;
