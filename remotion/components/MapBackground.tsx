import { useCurrentFrame } from 'remotion';

/** Mapa estilizado: grade de ruas + avenidas curvas + vinheta. */
export const MapBackground: React.FC<{ tilt?: boolean }> = ({ tilt = true }) => {
  const frame = useCurrentFrame();
  // Subtle "camera swing" — perspective oscillation pra dar sensação 3D
  const swing = tilt ? Math.sin(frame / 60) * 1.5 : 0;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#0a0a0c',
        transform: `perspective(2400px) rotateX(${swing * 0.5}deg) rotateY(${swing}deg)`,
        transformOrigin: 'center center',
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <pattern id="streets" x="0" y="0" width="180" height="180" patternUnits="userSpaceOnUse">
            <rect width="180" height="180" fill="#0a0a0c" />
            <path
              d="M 0 90 L 180 90 M 90 0 L 90 180 M 30 30 Q 90 0, 150 30 M 30 150 Q 90 180, 150 150"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1.5"
              fill="none"
            />
          </pattern>
          <radialGradient id="vignette" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
          </radialGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#streets)" />
        {/* Avenidas principais */}
        <path
          d="M 0 540 Q 600 480, 1200 560 T 1920 520"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="6"
          fill="none"
        />
        <path
          d="M 960 0 Q 900 400, 950 800 T 1000 1080"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="5"
          fill="none"
        />
        <path
          d="M 200 200 Q 700 400, 1100 350 T 1800 480"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M 500 1000 Q 800 780, 1250 850 T 1900 920"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="3"
          fill="none"
        />
        <rect width="1920" height="1080" fill="url(#vignette)" />
      </svg>
    </div>
  );
};
