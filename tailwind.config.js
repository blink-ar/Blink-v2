/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#00F0FF',
        'blink-bg': '#F2F0EB',
        'blink-ink': '#0F0F0F',
        'blink-accent': '#FF3366',
        'blink-warning': '#FFD600',
        'blink-surface': '#FFFFFF',
        'blink-muted': '#9CA3AF',
      },
      fontFamily: {
        display: ['Archivo Black', 'sans-serif'],
        body: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'hard': '4px 4px 0px 0px #0F0F0F',
        'hard-sm': '2px 2px 0px 0px #0F0F0F',
      },
      borderRadius: {
        'none': '0px',
        'DEFAULT': '0px',
        'pill': '9999px',
        'full': '9999px',
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
        'marquee-reverse': 'marquee-reverse 25s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0%)' },
        },
      },
    },
  },
  plugins: [],
};
