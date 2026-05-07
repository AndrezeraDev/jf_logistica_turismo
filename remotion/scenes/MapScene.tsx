import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, fontStack, glassStyle } from '../theme';
import { HOTELS, ME } from '../data/hotels';
import { MapBackground } from '../components/MapBackground';
import { SidebarPanel } from '../components/SidebarPanel';
import { HotelPin } from '../components/HotelPin';
import { MePin } from '../components/MePin';

/**
 * Cena curta: mapa carregando, sidebar entrando, hotéis aparecendo em cascata.
 * Termina com o cursor pousando sobre o primeiro hotel — a próxima cena
 * (GuestAssignmentScene) continua daí.
 */
export const MapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  // Hotéis em cascata
  const showHotelAt = (idx: number) => {
    const delay = 18 + idx * 4;
    return spring({
      frame: frame - delay,
      fps,
      config: { damping: 14, stiffness: 220 },
    });
  };

  // Title superior
  const titleOpacity = interpolate(frame, [8, 22, 80, 95], [0, 1, 1, 0], {
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
      <MapBackground />
      <SidebarPanel hotelsCount={HOTELS.length} withGuests={0} />

      {/* Pin Meu local */}
      <div
        style={{
          position: 'absolute',
          left: ME.x - 14,
          top: ME.y - 14,
          opacity: interpolate(frame, [10, 22], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        <MePin />
      </div>

      {/* Hotéis */}
      {HOTELS.map((h, idx) => {
        const t = showHotelAt(idx);
        return (
          <div
            key={h.id}
            style={{
              position: 'absolute',
              left: h.x - 22,
              top: h.y - 22,
              transform: `scale(${t}) rotateY(${(1 - t) * 360}deg)`,
              transformStyle: 'preserve-3d',
              perspective: 800,
              opacity: t,
            }}
          >
            <HotelPin guests={0} size={44} />
          </div>
        );
      })}

      {/* Title superior */}
      <div
        style={{
          position: 'absolute',
          top: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: titleOpacity,
          ...glassStyle,
          padding: '14px 28px',
          borderRadius: 999,
        }}
      >
        <div
          style={{
            fontSize: 13,
            letterSpacing: '0.25em',
            color: colors.ink400,
            textTransform: 'uppercase',
          }}
        >
          Passo 1
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: colors.ink100,
            letterSpacing: '-0.01em',
            marginTop: 2,
          }}
        >
          Hotéis encontrados em Gramado
        </div>
      </div>
    </div>
  );
};
