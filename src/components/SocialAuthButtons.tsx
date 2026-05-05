function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="white" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  );
}

interface SocialAuthButtonsProps {
  label?: string;
}

export default function SocialAuthButtons({ label = 'Continuar' }: SocialAuthButtonsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-blink-border" />
        <span className="text-xs text-blink-muted font-medium">o continuá con</span>
        <div className="flex-1 h-px bg-blink-border" />
      </div>

      <a
        href="/api/auth/google"
        className="flex items-center justify-center gap-2.5 w-full rounded-xl font-semibold text-sm text-blink-ink transition-all duration-150 active:scale-[0.98]"
        style={{
          height: 48,
          background: '#FFFFFF',
          border: '1px solid #E8E6E1',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <GoogleIcon />
        {label} con Google
      </a>

      <a
        href="/api/auth/facebook"
        className="flex items-center justify-center gap-2.5 w-full rounded-xl font-semibold text-sm text-white transition-all duration-150 active:scale-[0.98]"
        style={{
          height: 48,
          background: '#1877F2',
          boxShadow: '0 2px 8px rgba(24,119,242,0.25)',
        }}
      >
        <FacebookIcon />
        {label} con Facebook
      </a>
    </div>
  );
}
