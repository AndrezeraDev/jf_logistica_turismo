import { useCurrentFrame } from 'remotion';
import { colors, fontStack } from '../theme';

/** Réplica do hotel-pin do app. Suporta estado azul (sem) e verde (com hóspedes). */
export const HotelPin: React.FC<{
  guests: number;
  /** 0..1 — interpolação azul→verde (pra animação ao virar verde) */
  greenT?: number;
  size?: number;
  /** anel pulsante quando azul (igual app) */
  pulseRing?: boolean;
  /** giro 3D extra opcional (pra animação ao confirmar) */
  rotateX?: number;
}> = ({ guests, greenT = 0, size = 44, pulseRing = true, rotateX = 0 }) => {
  const frame = useCurrentFrame();
  const isGreen = guests > 0 && greenT > 0.5;
  // pulseScale entre 0.75 e 2.3 (igual @keyframes pulse-ring do app)
  const t = (frame % 54) / 54; // 1.8s @ 30fps
  const pulseScale = 0.75 + t * 1.55;
  const pulseOpacity = 0.8 - t * 0.8;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        transform: `perspective(800px) rotateX(${rotateX}deg)`,
      }}
    >
      {/* Ring pulsante (só quando ainda azul) */}
      {pulseRing && !isGreen && (
        <div
          style={{
            position: 'absolute',
            inset: -size * 0.2,
            borderRadius: '50%',
            border: `2px solid rgba(10,132,255,${pulseOpacity})`,
            transform: `scale(${pulseScale})`,
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: isGreen
            ? `linear-gradient(180deg, ${colors.emerald} 0%, #1F9B44 100%)`
            : `linear-gradient(180deg, ${colors.accent} 0%, ${colors.accentDark} 100%)`,
          border: '2.5px solid rgba(255,255,255,0.9)',
          boxShadow: isGreen
            ? '0 6px 18px rgba(52,199,89,0.45), 0 1px 0 rgba(255,255,255,0.25) inset'
            : '0 6px 18px rgba(10,132,255,0.45), 0 1px 0 rgba(255,255,255,0.25) inset',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 600,
          fontSize: size * 0.4,
          fontFamily: fontStack,
        }}
      >
        {isGreen ? guests : 'H'}
      </div>
    </div>
  );
};
