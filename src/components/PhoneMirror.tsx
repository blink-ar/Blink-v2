import { ReactNode, useEffect } from 'react';

interface PhoneMirrorProps {
  children: ReactNode;
}

function PhoneMirror({ children }: PhoneMirrorProps) {
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)';
    return () => {
      document.body.style.background = prev;
    };
  }, []);

  return (
    <div
      className="min-h-screen flex items-start justify-center"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
        paddingTop: '32px',
        paddingBottom: '32px',
      }}
    >
      {/* Phone outer shell */}
      <div
        style={{
          width: '390px',
          minHeight: '844px',
          borderRadius: '52px',
          background: '#1a1a2e',
          padding: '10px',
          boxShadow:
            '0 0 0 1px #2a2a4a, 0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(99,102,241,0.08)',
          position: 'relative',
        }}
      >
        {/* Side buttons */}
        <div
          style={{
            position: 'absolute',
            left: '-3px',
            top: '120px',
            width: '3px',
            height: '36px',
            background: '#2a2a4a',
            borderRadius: '2px 0 0 2px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '-3px',
            top: '168px',
            width: '3px',
            height: '64px',
            background: '#2a2a4a',
            borderRadius: '2px 0 0 2px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '-3px',
            top: '244px',
            width: '3px',
            height: '64px',
            background: '#2a2a4a',
            borderRadius: '2px 0 0 2px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '-3px',
            top: '160px',
            width: '3px',
            height: '80px',
            background: '#2a2a4a',
            borderRadius: '0 2px 2px 0',
          }}
        />

        {/* Screen area */}
        <div
          style={{
            borderRadius: '44px',
            overflow: 'hidden',
            background: '#ffffff',
            position: 'relative',
            minHeight: '824px',
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

          {/* Status bar spacer */}
          <div style={{ height: '54px' }} />

          {/* App content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhoneMirror;
