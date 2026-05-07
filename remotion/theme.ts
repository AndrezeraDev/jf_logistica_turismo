// Tokens visuais — espelham os do Tailwind config da aplicação
export const colors = {
  bg: '#0b0b0d',
  ink100: '#ededef',
  ink200: '#d9d9de',
  ink300: '#b7b7bf',
  ink400: '#8a8a93',
  ink500: '#5e5e66',
  accent: '#0A84FF',
  accentDark: '#0060DF',
  emerald: '#34C759',
  red: '#FF453A',
  amber: '#FF9F0A',
};

export const fontStack =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, system-ui, sans-serif';

export const glassStyle: React.CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(28,28,32,0.72) 0%, rgba(22,22,26,0.62) 100%)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'saturate(160%) blur(24px)',
  boxShadow:
    '0 1px 0 rgba(255,255,255,0.04) inset, 0 30px 90px rgba(0,0,0,0.55)',
  borderRadius: 20,
};
