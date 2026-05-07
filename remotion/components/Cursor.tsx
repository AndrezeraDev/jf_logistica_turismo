import { interpolate, useCurrentFrame } from 'remotion';

interface Keyframe {
  frame: number;
  x: number;
  y: number;
}

/** Cursor estilizado que se move por keyframes. Click flash em frames específicos. */
export const Cursor: React.FC<{
  keyframes: Keyframe[];
  clickFrames?: number[];
  z?: number;
}> = ({ keyframes, clickFrames = [], z = 9999 }) => {
  const frame = useCurrentFrame();
  const sortedXs = keyframes.map((k) => k.x);
  const sortedYs = keyframes.map((k) => k.y);
  const frames = keyframes.map((k) => k.frame);

  const x = interpolate(frame, frames, sortedXs, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => t * t * (3 - 2 * t), // smoothstep
  });
  const y = interpolate(frame, frames, sortedYs, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => t * t * (3 - 2 * t),
  });

  // Pulse no momento do click
  const clickPulse = clickFrames.reduce((max, cf) => {
    const dist = Math.abs(frame - cf);
    if (dist > 12) return max;
    const t = 1 - dist / 12;
    return Math.max(max, t);
  }, 0);

  return (
    <>
      {/* Halo do click */}
      {clickPulse > 0 && (
        <div
          style={{
            position: 'absolute',
            left: x - 28,
            top: y - 28,
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: `3px solid rgba(10,132,255,${clickPulse * 0.85})`,
            transform: `scale(${0.6 + clickPulse * 0.6})`,
            pointerEvents: 'none',
            zIndex: z,
          }}
        />
      )}
      {/* Cursor seta SVG */}
      <svg
        width={28}
        height={28}
        viewBox="0 0 28 28"
        style={{
          position: 'absolute',
          left: x,
          top: y,
          zIndex: z + 1,
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))',
        }}
      >
        <path
          d="M 4 2 L 4 22 L 10 17 L 14 25 L 17 23 L 13 16 L 21 16 Z"
          fill="white"
          stroke="black"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
};
