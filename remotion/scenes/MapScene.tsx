import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, fontStack, glassStyle } from '../theme';
import { Cursor } from '../components/Cursor';

// Dados fixos pra reprodutibilidade da animação
// Coords convertidas pra coordenadas de tela (já escaladas)
const HOTELS = [
  { id: 'a', name: 'Hotel Laghetto Stilo Borges', x: 950, y: 530, guests: 4 },
  { id: 'b', name: 'Hotel Casa da Montanha', x: 870, y: 470, guests: 0 },
  { id: 'c', name: 'Pousada Viena', x: 1020, y: 460, guests: 2 },
  { id: 'd', name: 'Wood Hotel', x: 920, y: 590, guests: 0 },
  { id: 'e', name: 'Stillo Gramado Prieto', x: 1060, y: 590, guests: 0 },
  { id: 'f', name: 'Hotel Fioreze Primo', x: 760, y: 400, guests: 6 },
  { id: 'g', name: 'Hotel Laghetto Siena', x: 1180, y: 540, guests: 0 },
  { id: 'h', name: 'Hotel Bertoluci', x: 800, y: 660, guests: 0 },
  { id: 'i', name: 'Hotel Glamour da Serra', x: 1140, y: 400, guests: 3 },
  { id: 'j', name: 'Pousada Serra Valle', x: 700, y: 540, guests: 0 },
  { id: 'k', name: 'Hotel Villa Bella', x: 1040, y: 700, guests: 0 },
  { id: 'l', name: 'Hotel Sky Serra', x: 880, y: 720, guests: 0 },
  { id: 'm', name: 'Pousada Florença', x: 1220, y: 640, guests: 0 },
  { id: 'n', name: 'Hotel Triveneto', x: 740, y: 290, guests: 0 },
  { id: 'o', name: 'Hotel Aconchego da Serra', x: 700, y: 320, guests: 0 },
];

const ME = { x: 950, y: 580 };

export const MapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in
  const sceneOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });

  // Pin "Meu local" pulsa
  const mePulse = (Math.sin(frame / 8) + 1) / 2;

  // Hotéis aparecem em cascata (pop-in escalonado)
  const showHotelAt = (idx: number) => {
    const delay = 20 + idx * 4;
    const t = spring({
      frame: frame - delay,
      fps,
      config: { damping: 14, stiffness: 200 },
    });
    return t;
  };

  // Quando os hotéis com guests > 0 viram verdes (frame 130-160)
  const hotelGuestsT = (idx: number) => {
    if (HOTELS[idx].guests === 0) return 0;
    const order = HOTELS.filter((h) => h.guests > 0).findIndex((h) => h.id === HOTELS[idx].id);
    return interpolate(frame, [130 + order * 8, 145 + order * 8], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  };

  // Cursor: vai do canto pra dois hotéis e clica
  const cursorKeyframes = [
    { frame: 0, x: 1700, y: 100 },
    { frame: 30, x: 1500, y: 200 },
    { frame: 50, x: 1100, y: 400 }, // hovering
    { frame: 80, x: 760, y: 400 }, // sobre Fioreze Primo (clica)
    { frame: 105, x: 950, y: 530 }, // Laghetto Borges
    { frame: 125, x: 1140, y: 400 }, // Glamour
    { frame: 150, x: 1020, y: 460 }, // Pousada Viena
    { frame: 170, x: 700, y: 850 }, // sai
  ];

  // Texto "tooltip" em frames específicos
  const tooltipOpacity = interpolate(
    frame,
    [55, 65, 75, 80],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // Texto explicativo que entra
  const explainOpacity = interpolate(frame, [100, 115, 175, 185], [0, 1, 1, 0], {
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
        opacity: sceneOpacity,
        background: colors.bg,
      }}
    >
      <MapBackground frame={frame} />
      <SidebarPanel frame={frame} />

      {/* Pins dos hotéis */}
      {HOTELS.map((h, idx) => {
        const t = showHotelAt(idx);
        const guestsT = hotelGuestsT(idx);
        const size = 40;
        return (
          <div
            key={h.id}
            style={{
              position: 'absolute',
              left: h.x - size / 2,
              top: h.y - size / 2,
              width: size,
              height: size,
              transform: `scale(${t})`,
              opacity: t,
            }}
          >
            <HotelPin guests={h.guests} guestsT={guestsT} size={size} />
          </div>
        );
      })}

      {/* Pin "Meu local" */}
      <div
        style={{
          position: 'absolute',
          left: ME.x - 14,
          top: ME.y - 14,
          width: 28,
          height: 28,
          opacity: interpolate(frame, [10, 22], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: -8 - mePulse * 16,
            border: `3px solid rgba(10,132,255,${0.6 - mePulse * 0.5})`,
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'white',
            border: `4px solid ${colors.accent}`,
            boxShadow: '0 0 0 8px rgba(10,132,255,0.25), 0 8px 20px rgba(0,0,0,0.5)',
          }}
        />
      </div>

      {/* Tooltip "Hotel Fioreze Primo - 6 hóspedes" */}
      {tooltipOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 760 - 110,
            top: 400 - 70,
            ...glassStyle,
            padding: '10px 14px',
            color: colors.ink100,
            fontSize: 14,
            opacity: tooltipOpacity,
            borderRadius: 12,
          }}
        >
          <div style={{ fontWeight: 600 }}>Hotel Fioreze Primo</div>
          <div style={{ color: colors.emerald, fontSize: 12, marginTop: 2 }}>
            6 hóspedes
          </div>
        </div>
      )}

      {/* Texto explicativo no canto */}
      {explainOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 480,
            bottom: 80,
            ...glassStyle,
            padding: '24px 32px',
            opacity: explainOpacity,
            maxWidth: 720,
          }}
        >
          <div
            style={{
              fontSize: 13,
              letterSpacing: '0.2em',
              color: colors.ink400,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Passo 2
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: colors.ink100 }}>
            Atribua hóspedes em cada hotel
          </div>
          <div style={{ fontSize: 16, color: colors.ink300, marginTop: 6 }}>
            Toque em qualquer pin pra definir a quantidade que vai pegar
          </div>
        </div>
      )}

      <Cursor keyframes={cursorKeyframes} clickFrames={[80, 105, 125, 150]} />
    </div>
  );
};

const HotelPin: React.FC<{ guests: number; guestsT: number; size: number }> = ({
  guests,
  guestsT,
  size,
}) => {
  // Interpola entre azul (sem hóspede) e verde (com hóspede)
  const isGreen = guests > 0 && guestsT > 0.5;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: isGreen
          ? `linear-gradient(180deg, ${colors.emerald} 0%, #1F9B44 100%)`
          : `linear-gradient(180deg, ${colors.accent} 0%, ${colors.accentDark} 100%)`,
        border: '3px solid rgba(255,255,255,0.9)',
        boxShadow: isGreen
          ? '0 6px 18px rgba(52,199,89,0.55), 0 1px 0 rgba(255,255,255,0.25) inset'
          : '0 6px 18px rgba(10,132,255,0.55), 0 1px 0 rgba(255,255,255,0.25) inset',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 700,
        fontSize: 14,
        fontFamily: fontStack,
      }}
    >
      {isGreen ? guests : 'H'}
    </div>
  );
};

const MapBackground: React.FC<{ frame: number }> = ({ frame: _frame }) => {
  // Mapa estilizado: padrão de ruas em SVG
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#0a0a0c',
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* Ruas finas (grid leve com curvas) */}
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
            <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
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
        <rect width="1920" height="1080" fill="url(#vignette)" />
      </svg>
    </div>
  );
};

const SidebarPanel: React.FC<{ frame: number }> = ({ frame }) => {
  const x = interpolate(frame, [0, 18], [-460, 0], { extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 460,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        transform: `translateX(${x}px)`,
        padding: '24px 24px',
        fontFamily: fontStack,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.2em',
            color: colors.ink400,
            textTransform: 'uppercase',
          }}
        >
          JE Hoffman
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: colors.ink100,
            letterSpacing: '-0.02em',
            marginTop: 4,
          }}
        >
          Logística turística
        </div>
      </div>

      <div
        style={{
          height: 44,
          padding: '0 14px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: colors.ink300,
          fontSize: 14,
        }}
      >
        🔍 Gramado, RS
      </div>

      <div style={{ fontSize: 13, color: colors.ink400 }}>
        🏢 15 hotéis •{' '}
        <span style={{ color: colors.emerald }}>
          {Math.min(4, Math.max(0, Math.floor((frame - 130) / 8)))} com hóspedes
        </span>
      </div>

      {/* Botão Rodar otimização (placeholder) */}
      <div
        style={{
          height: 56,
          borderRadius: 18,
          background: `linear-gradient(180deg, ${colors.accent} 0%, ${colors.accentDark} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 600,
          fontSize: 17,
          boxShadow: '0 12px 28px rgba(10,132,255,0.45)',
          opacity: interpolate(frame, [60, 80], [0.4, 1], { extrapolateLeft: 'clamp' }),
          marginTop: 'auto',
        }}
      >
        ▶ Rodar otimização
      </div>
    </div>
  );
};
