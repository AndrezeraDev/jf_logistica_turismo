import { useCurrentFrame } from 'remotion';
import { colors } from '../theme';

export const MePin: React.FC<{ size?: number }> = ({ size = 28 }) => {
  const frame = useCurrentFrame();
  const t = (frame % 54) / 54;
  const pulseScale = 0.75 + t * 1.55;
  const pulseOpacity = 0.7 - t * 0.7;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <div
        style={{
          position: 'absolute',
          inset: -size * 0.3,
          borderRadius: '50%',
          border: `2px solid rgba(10,132,255,${pulseOpacity})`,
          transform: `scale(${pulseScale})`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'white',
          border: `${size * 0.13}px solid ${colors.accent}`,
          boxShadow: `0 0 0 ${size * 0.25}px rgba(10,132,255,0.25), 0 6px 18px rgba(0,0,0,0.45)`,
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
};
