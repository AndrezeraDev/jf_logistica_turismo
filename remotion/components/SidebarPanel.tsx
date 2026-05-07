import { interpolate, useCurrentFrame } from 'remotion';
import { colors, fontStack } from '../theme';

/** Sidebar replicando o painel lateral do app (72px nav + 360px painel = 432px). */
export const SidebarPanel: React.FC<{
  hotelsCount: number;
  withGuests: number;
  enterFrom?: number;
}> = ({ hotelsCount, withGuests, enterFrom = 0 }) => {
  const frame = useCurrentFrame();
  // Entra com rotateY (efeito 3D)
  const x = interpolate(frame, [enterFrom, enterFrom + 25], [-460, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rotY = interpolate(frame, [enterFrom, enterFrom + 25], [-25, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 432,
        display: 'flex',
        transform: `translateX(${x}px) perspective(1200px) rotateY(${rotY}deg)`,
        transformOrigin: 'left center',
        fontFamily: fontStack,
      }}
    >
      {/* Nav esquerdo (72px) */}
      <div
        style={{
          width: 72,
          background: 'rgba(0,0,0,0.30)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px 0',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            background: `linear-gradient(180deg, ${colors.accent} 0%, ${colors.accentDark} 100%)`,
            boxShadow: '0 6px 18px rgba(10,132,255,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 8,
          }}
        >
          JE
        </div>
        {['🗺️', '🚌', '⚙️'].map((ic, i) => (
          <div
            key={i}
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: i === 0 ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: i === 0 ? '1px solid rgba(255,255,255,0.10)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              opacity: i === 0 ? 1 : 0.5,
            }}
          >
            {ic}
          </div>
        ))}
      </div>

      {/* Painel principal (360px) */}
      <div
        style={{
          flex: 1,
          background: 'rgba(0,0,0,0.40)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '20px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.18em',
              color: colors.ink400,
              textTransform: 'uppercase',
            }}
          >
            JE Hoffman
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: colors.ink100,
              letterSpacing: '-0.02em',
              marginTop: 4,
            }}
          >
            Logística turística
          </div>
        </div>

        {/* Search city */}
        <div
          style={{
            height: 40,
            padding: '0 12px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: colors.ink300,
            fontSize: 13,
          }}
        >
          🔍 Gramado, RS
        </div>

        {/* Counters */}
        <div style={{ fontSize: 12, color: colors.ink400 }}>
          🏢 {hotelsCount} hotéis ·{' '}
          <span style={{ color: colors.emerald, fontWeight: 600 }}>
            {withGuests} com hóspedes
          </span>
        </div>

        {/* Add manual hint */}
        <div
          style={{
            height: 36,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            border: '1px dashed rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            color: colors.ink400,
          }}
        >
          + Adicionar hotel manualmente
        </div>

        <div style={{ flex: 1 }} />

        {/* Botão Rodar otimização */}
        <div
          style={{
            height: 50,
            borderRadius: 16,
            background:
              withGuests > 0
                ? `linear-gradient(180deg, ${colors.accent} 0%, ${colors.accentDark} 100%)`
                : 'rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: withGuests > 0 ? 'white' : colors.ink400,
            fontWeight: 600,
            fontSize: 15,
            boxShadow: withGuests > 0 ? '0 10px 24px rgba(10,132,255,0.45)' : 'none',
            transition: 'all 0.3s',
          }}
        >
          ▶ Rodar otimização
        </div>
      </div>
    </div>
  );
};
