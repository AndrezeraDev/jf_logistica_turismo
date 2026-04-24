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
        ink: {
          50: '#f7f7f8',
          100: '#ededef',
          200: '#d9d9de',
          300: '#b7b7bf',
          400: '#8a8a93',
          500: '#5e5e66',
          600: '#3f3f46',
          700: '#2a2a2f',
          800: '#18181b',
          900: '#0b0b0d',
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
