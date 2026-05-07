import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, fontStack } from '../theme';
import { Logo } from '../components/Logo';

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame, fps, config: { damping: 14, stiffness: 140 } });
  const sub = interpolate(frame, [12, 30], [0, 1], { extrapolateRight: 'clamp' });
  const subY = interpolate(frame, [12, 30], [20, 0], { extrapolateRight: 'clamp' });

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
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, rgba(10,132,255,0.30), transparent 60%)`,
          filter: 'blur(40px)',
        }}
      />
      <div style={{ position: 'relative', textAlign: 'center', transform: `scale(${t})` }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <Logo size={160} />
        </div>
        <div
          style={{
            fontSize: 88,
            fontWeight: 600,
            color: colors.ink100,
            letterSpacing: '-0.03em',
          }}
        >
          JE Hoffman
        </div>
        <div
          style={{
            fontSize: 24,
            color: colors.ink300,
            marginTop: 16,
            opacity: sub,
            transform: `translateY(${subY}px)`,
          }}
        >
          Turismo · Logística · Otimização inteligente
        </div>
      </div>
    </div>
  );
};
