import { useCurrentFrame } from 'remotion';

interface Keyframe {
  frame: number;
  x: number;
  y: number;
}

/** ease-out cubic — começa rápido, termina suave (como mouse humano). */
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** ease-in-out — pra trechos longos onde queremos aceleração + desaceleração. */
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Cursor humano com easing por segmento, jitter sutil, dwell nos clicks
 *  e "press down" vertical no momento do click. */
export const Cursor: React.FC<{
  keyframes: Keyframe[];
  clickFrames?: number[];
  z?: number;
}> = ({ keyframes, clickFrames = [], z = 9999 }) => {
  const frame = useCurrentFrame();
  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);

  // Posição base via interpolação por segmento com easing
  let baseX = sorted[0].x;
  let baseY = sorted[0].y;
  if (frame >= sorted[sorted.length - 1].frame) {
    baseX = sorted[sorted.length - 1].x;
    baseY = sorted[sorted.length - 1].y;
  } else if (frame > sorted[0].frame) {
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      if (frame >= a.frame && frame <= b.frame) {
        const span = b.frame - a.frame;
        const localT = span > 0 ? (frame - a.frame) / span : 1;
        // Trechos curtos (<8 frames) = ease-out; longos = ease-in-out
        const eased = span >= 14 ? easeInOut(localT) : easeOutCubic(localT);
        baseX = lerp(a.x, b.x, eased);
        baseY = lerp(a.y, b.y, eased);
        break;
      }
    }
  }

  // Jitter humano sutil (~1.5px de oscilação combinada)
  const jitterX = Math.sin(frame * 0.31) * 1.1 + Math.sin(frame * 0.73 + 1.7) * 0.6;
  const jitterY = Math.cos(frame * 0.41) * 0.9 + Math.cos(frame * 0.51 + 2.4) * 0.5;

  // "Press down" no momento do click (cursor vai 4px pra baixo e volta)
  const pressY = clickFrames.reduce((acc, cf) => {
    const d = frame - cf;
    if (d < -2 || d > 6) return acc;
    if (d <= 0) return acc + ((d + 2) / 2) * 4;
    return acc + (1 - d / 6) * 4;
  }, 0);

  const x = baseX + jitterX;
  const y = baseY + jitterY + pressY;

  // Halo de click — quick attack, slower decay (mais natural)
  const clickPulse = clickFrames.reduce((max, cf) => {
    const d = frame - cf;
    let t = 0;
    if (d >= -2 && d < 0) t = (d + 2) / 2 * 0.5;
    else if (d >= 0 && d <= 2) t = 0.5 + (d / 2) * 0.5;
    else if (d > 2 && d <= 18) t = 1 - (d - 2) / 16;
    return Math.max(max, t);
  }, 0);

  return (
    <>
      {clickPulse > 0 && (
        <>
          {/* anel maior que se expande */}
          <div
            style={{
              position: 'absolute',
              left: x - 38,
              top: y - 38,
              width: 76,
              height: 76,
              borderRadius: '50%',
              border: `3px solid rgba(10,132,255,${clickPulse * 0.7})`,
              transform: `scale(${0.5 + (1 - clickPulse) * 1.0})`,
              pointerEvents: 'none',
              zIndex: z,
            }}
          />
          {/* halo interno */}
          <div
            style={{
              position: 'absolute',
              left: x - 24,
              top: y - 24,
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(10,132,255,${clickPulse * 0.4}) 0%, transparent 70%)`,
              pointerEvents: 'none',
              zIndex: z,
            }}
          />
        </>
      )}
      {/* Cursor seta SVG — leve rotação na direção do movimento opcional */}
      <svg
        width={26}
        height={26}
        viewBox="0 0 28 28"
        style={{
          position: 'absolute',
          left: x,
          top: y,
          zIndex: z + 1,
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.65))',
        }}
      >
        <path
          d="M 4 2 L 4 22 L 10 17 L 14 25 L 17 23 L 13 16 L 21 16 Z"
          fill="white"
          stroke="black"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
};
