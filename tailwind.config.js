/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'Inter',
          'system-ui',
          'Segoe UI',
          'sans-serif',
        ],
      },
      colors: {
        // Paleta "ink" via CSS variables — muda automaticamente entre dark/light
        // (definidas em src/index.css em :root e [data-theme="light"])
        ink: {
          50: 'var(--text-1)', // não usado muito; aproxima do texto principal
          100: 'var(--text-1)',
          200: 'var(--text-2)',
          300: 'var(--text-3)',
          400: 'var(--text-4)',
          500: 'var(--text-5)',
          600: '#3f3f46', // mantidos fixos pra borders/divs específicas raras
          700: '#2a2a2f',
          800: 'var(--bg-elevated)',
          900: 'var(--bg)', // bg principal
        },
        accent: {
          DEFAULT: '#0A84FF',
          hover: '#3E9BFF',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
        glass: '0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px rgba(0,0,0,0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.4) translateY(-8px)', opacity: '0' },
          '70%': { transform: 'scale(1.08) translateY(0)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.7' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        'pop-in': 'pop-in 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'pulse-ring': 'pulse-ring 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
};
