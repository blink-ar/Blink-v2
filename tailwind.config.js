/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Minimalist Bento Grid palette
        primary: '#6366F1',          // Soft indigo - primary accent
        'blink-bg': '#F7F6F4',       // Warm off-white background
        'blink-ink': '#1C1C1E',      // Soft deep (not pure black)
        'blink-accent': '#6366F1',   // Indigo accent
        'blink-positive': '#10B981', // Emerald for discounts/savings
        'blink-warning': '#F59E0B',  // Warm amber (replaces harsh yellow)
        'blink-surface': '#FFFFFF',
        'blink-muted': '#9CA3AF',
        'blink-border': '#E8E6E1',   // Soft warm border
        // Soft category colors for color-coding
        'cat-food': '#FEF3C7',
        'cat-food-text': '#92400E',
        'cat-fashion': '#FCE7F3',
        'cat-fashion-text': '#9D174D',
        'cat-travel': '#DBEAFE',
        'cat-travel-text': '#1E40AF',
        'cat-sport': '#D1FAE5',
        'cat-sport-text': '#065F46',
        'cat-tech': '#EDE9FE',
        'cat-tech-text': '#4C1D95',
        'cat-home': '#FEE2E2',
        'cat-home-text': '#991B1B',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'soft-md': '0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
        'soft-lg': '0 16px 40px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06)',
        'inner-soft': 'inset 0 1px 3px rgba(0,0,0,0.06)',
        // Keep for any legacy references (non-destructive override)
        'hard': '0 4px 16px rgba(99,102,241,0.15)',
        'hard-sm': '0 2px 8px rgba(99,102,241,0.10)',
      },
      borderRadius: {
        'none': '0px',
        'DEFAULT': '12px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        'pill': '9999px',
        'full': '9999px',
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'marquee-reverse': 'marquee-reverse 30s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
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
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-subtle': 'linear-gradient(135deg, #F7F6F4 0%, #FFFFFF 100%)',
        'gradient-indigo': 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
        'gradient-emerald': 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
        'gradient-amber': 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)',
        'gradient-card': 'linear-gradient(145deg, #FFFFFF 0%, #F7F6F4 100%)',
      },
    },
  },
  plugins: [],
};
