import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, fontStack } from '../theme';

export const Logo: React.FC<{ size?: number; delay?: number }> = ({
  size = 80,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 180, mass: 0.8 },
  });
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: `linear-gradient(180deg, ${colors.accent} 0%, ${colors.accentDark} 100%)`,
        boxShadow: `0 ${size * 0.15}px ${size * 0.5}px rgba(10,132,255,0.55)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 700,
        fontSize: size * 0.42,
        fontFamily: fontStack,
        transform: `scale(${scale})`,
        letterSpacing: '-0.04em',
      }}
    >
      JE
    </div>
  );
};
