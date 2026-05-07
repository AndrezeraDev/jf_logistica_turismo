import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, fontStack } from '../theme';
import { Logo } from '../components/Logo';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [10, 25], [20, 0], { extrapolateRight: 'clamp' });
  const subOpacity = interpolate(frame, [18, 33], [0, 1], { extrapolateRight: 'clamp' });
  const tag = spring({ frame: frame - 28, fps, config: { damping: 12 } });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: colors.bg,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fontStack,
      }}
    >
      {/* Aurora atrás */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 30% 30%, rgba(10,132,255,0.45), transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(52,199,89,0.30), transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(180,80,255,0.22), transparent 50%)
          `,
          filter: 'blur(60px)',
          opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      />
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Logo size={140} />
        </div>
        <div
          style={{
            fontSize: 16,
            letterSpacing: '0.3em',
            color: colors.ink400,
            textTransform: 'uppercase',
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            marginBottom: 12,
          }}
        >
          JE Hoffman Turismo
        </div>
        <div
          style={{
            fontSize: 80,
            fontWeight: 600,
            color: colors.ink100,
            letterSpacing: '-0.03em',
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          Logística inteligente
        </div>
        <div
          style={{
            fontSize: 22,
            color: colors.ink300,
            marginTop: 16,
            opacity: subOpacity,
            transform: `scale(${0.9 + tag * 0.1})`,
          }}
        >
          Rotas otimizadas pra transporte turístico
        </div>
      </div>
    </div>
  );
};
