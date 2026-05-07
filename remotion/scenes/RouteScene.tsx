import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, fontStack, glassStyle } from '../theme';

// Mesmos 5 hotéis da cena de atribuição.
// Ordem = nearest-neighbor a partir de ME (950, 580):
// → Wood Hotel (32px) → Laghetto Borges (67) → Pousada Viena (99) → Glamour Serra (134) → Fioreze Primo (380)
const ME = { x: 950, y: 580 };
const STOPS = [
  { x: 920, y: 590, name: 'Wood Hotel', guests: 5, order: 1 },
  { x: 950, y: 530, name: 'Hotel Laghetto Stilo Borges', guests: 4, order: 2 },
  { x: 1020, y: 460, name: 'Pousada Viena', guests: 2, order: 3 },
  { x: 1140, y: 400, name: 'Hotel Glamour da Serra', guests: 3, order: 4 },
  { x: 760, y: 400, name: 'Hotel Fioreze Primo', guests: 6, order: 5 },
];

export const RouteScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Linha de coleta desenhando ao longo dos frames
  const pickupProgress = interpolate(frame, [10, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Retorno
  const returnProgress = interpolate(frame, [80, 130], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Stop badges entram em cascata
  const showStop = (i: number) => {
    const delay = 20 + i * 18;
    return spring({
      frame: frame - delay,
      fps,
      config: { damping: 16, stiffness: 200 },
    });
  };

  // Card de economia entra ao final
  const ecoT = spring({
    frame: frame - 130,
    fps,
    config: { damping: 16, stiffness: 130 },
  });

  // Valor do contador R$ animado (calibrado pros 5 hotéis: 20 pax, ~38km)
  const ecoMoney = interpolate(frame, [140, 180], [0, 116.8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: fontStack,
        background: colors.bg,
      }}
    >
      <SimpleMapBg />

      {/* Path de coleta (azul sólido) */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0 }}
      >
        <PathDrawing
          points={[ME, ...STOPS]}
          progress={pickupProgress}
          color={colors.accent}
          strokeWidth={6}
        />
        <PathDrawing
          points={[STOPS[STOPS.length - 1], ...[...STOPS].reverse().slice(1), ME]}
          progress={returnProgress}
          color={colors.emerald}
          strokeWidth={5}
          dashed
        />
      </svg>

      {/* Pin "Meu local" */}
      <div
        style={{
          position: 'absolute',
          left: ME.x - 14,
          top: ME.y - 14,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'white',
          border: `4px solid ${colors.accent}`,
          boxShadow: '0 0 0 8px rgba(10,132,255,0.25), 0 8px 20px rgba(0,0,0,0.5)',
        }}
      />

      {/* Stops numerados */}
      {STOPS.map((s, i) => {
        const t = showStop(i);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: s.x - 18,
              top: s.y - 18,
              width: 36,
              height: 36,
              borderRadius: 18,
              background: '#ededef',
              border: `3px solid ${colors.accent}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 16,
              color: colors.bg,
              transform: `scale(${t})`,
              boxShadow: '0 6px 18px rgba(0,0,0,0.55)',
            }}
          >
            {s.order}
          </div>
        );
      })}

      {/* Title superior */}
      <div
        style={{
          position: 'absolute',
          top: 50,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        <div
          style={{
            fontSize: 14,
            letterSpacing: '0.25em',
            color: colors.ink400,
            textTransform: 'uppercase',
          }}
        >
          Passo 3
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 600,
            color: colors.ink100,
            letterSpacing: '-0.02em',
            marginTop: 4,
          }}
        >
          Otimizando a rota
        </div>
      </div>

      {/* Card Resumo + Economia */}
      <div
        style={{
          position: 'absolute',
          right: 80,
          top: 130,
          width: 460,
          ...glassStyle,
          padding: 22,
          opacity: ecoT,
          transform: `translateY(${(1 - ecoT) * 30}px)`,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600, color: colors.ink100, marginBottom: 14 }}>
          Resumo
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <Stat label="Distância" value="38,7 km" />
          <Stat label="Duração" value="72 min" />
          <Stat label="Pax" value="20" />
        </div>

        {/* Card economia */}
        <div
          style={{
            marginTop: 16,
            border: '1px solid rgba(52,199,89,0.25)',
            background: 'rgba(52,199,89,0.05)',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(52,199,89,0.18)',
              fontSize: 12,
              letterSpacing: '0.15em',
              color: colors.emerald,
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            📉 Economia
          </div>
          <div style={{ padding: '14px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
            <span style={{ color: colors.ink300, fontSize: 14 }}>⛽ Custo da rota</span>
            <span style={{ color: colors.ink100, fontWeight: 600 }}>R$ 25,50</span>
            <span style={{ color: colors.ink400, fontSize: 13 }}>Sem otimização</span>
            <span style={{ color: colors.ink400, fontSize: 13, textDecoration: 'line-through' }}>
              R$ 142,30
            </span>
          </div>
          <div
            style={{
              padding: '12px 14px',
              borderTop: '1px solid rgba(52,199,89,0.18)',
              color: colors.emerald,
            }}
          >
            <div style={{ fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Você poupa
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, marginTop: 2 }}>
              R$ {ecoMoney.toFixed(2).replace('.', ',')}
            </div>
            <div style={{ fontSize: 12, marginTop: 2 }}>153,2 km a menos · −82%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div
    style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12,
      padding: '8px 10px',
    }}
  >
    <div
      style={{
        fontSize: 10,
        letterSpacing: '0.15em',
        color: colors.ink400,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 16, fontWeight: 600, color: colors.ink100, marginTop: 2 }}>{value}</div>
  </div>
);

const PathDrawing: React.FC<{
  points: Array<{ x: number; y: number }>;
  progress: number;
  color: string;
  strokeWidth: number;
  dashed?: boolean;
}> = ({ points, progress, color, strokeWidth, dashed }) => {
  const frame = useCurrentFrame();
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  let totalLen = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    totalLen += Math.sqrt(dx * dx + dy * dy);
  }
  // Pra dashed (retorno): "drawing" via clip — desenha um sub-path a cada frame
  // Pra solid (coleta): stroke-dashoffset pra simular drawing
  if (dashed) {
    return (
      <path
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray="10 12"
        strokeDashoffset={-frame * 2}
        pathLength={totalLen}
        style={{
          opacity: Math.min(1, progress * 1.2),
          filter: `drop-shadow(0 0 12px ${color}80)`,
          // truque: usar clipPath pra revelar o path conforme progress
          clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
        }}
      />
    );
  }
  return (
    <path
      d={d}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      strokeDasharray={`${totalLen} ${totalLen}`}
      strokeDashoffset={totalLen * (1 - progress)}
      style={{
        filter: `drop-shadow(0 0 12px ${color}80)`,
      }}
    />
  );
};

const SimpleMapBg: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, background: '#0a0a0c' }}>
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <pattern id="streets2" x="0" y="0" width="180" height="180" patternUnits="userSpaceOnUse">
          <rect width="180" height="180" fill="#0a0a0c" />
          <path
            d="M 0 90 L 180 90 M 90 0 L 90 180"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1.5"
            fill="none"
          />
        </pattern>
      </defs>
      <rect width="1920" height="1080" fill="url(#streets2)" />
      <path
        d="M 0 540 Q 600 480, 1200 560 T 1920 520"
        stroke="rgba(255,255,255,0.10)"
        strokeWidth="6"
        fill="none"
      />
    </svg>
  </div>
);
