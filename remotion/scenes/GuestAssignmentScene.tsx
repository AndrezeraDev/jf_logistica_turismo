import { interpolate, useCurrentFrame } from 'remotion';
import { colors, fontStack } from '../theme';
import { ASSIGNMENT_ORDER, HOTELS, ME } from '../data/hotels';
import { MapBackground } from '../components/MapBackground';
import { SidebarPanel } from '../components/SidebarPanel';
import { HotelPin } from '../components/HotelPin';
import { MePin } from '../components/MePin';
import { Cursor } from '../components/Cursor';
import { GuestModal } from '../components/GuestModal';

const PER_HOTEL = 70; // frames por hotel — ~2.3s

// Sub-tempos dentro de cada hotel
const T_CURSOR_START = 0;
const T_CLICK = 12;
const T_MODAL_ENTER_START = 12;
const T_MODAL_ENTER_END = 24;
const T_TYPING_START = 26;
const T_TYPING_END = 38;
const T_QUICK_HIGHLIGHT = 32;
const T_CURSOR_TO_SAVE = 40;
const T_SAVE_CLICK = 50;
const T_MODAL_EXIT_START = 50;
const T_MODAL_EXIT_END = 60;
const T_PIN_GREEN = 56;

export const GuestAssignmentScene: React.FC = () => {
  const frame = useCurrentFrame();

  const targets = ASSIGNMENT_ORDER.map((id) => HOTELS.find((h) => h.id === id)!);
  const totalHotelFrames = PER_HOTEL * targets.length;

  // Quem é o hotel "ativo" agora (qual modal aparece)?
  const activeIdx = Math.min(targets.length - 1, Math.floor(frame / PER_HOTEL));
  const localFrame = frame - activeIdx * PER_HOTEL;
  const activeHotel = targets[activeIdx];

  // Hotéis com guests JÁ assignados (apenas os anteriores ao atual)
  // O atual fica verde no fim do localFrame
  const greenIds = new Set<string>();
  targets.forEach((t, i) => {
    if (i < activeIdx) greenIds.add(t.id);
    if (i === activeIdx && localFrame >= T_PIN_GREEN) greenIds.add(t.id);
  });

  // Modal enter/exit progress (do hotel atual)
  const enterT = interpolate(
    localFrame,
    [T_MODAL_ENTER_START, T_MODAL_ENTER_END],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const exitT = interpolate(
    localFrame,
    [T_MODAL_EXIT_START, T_MODAL_EXIT_END],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // Texto sendo "digitado" no input
  const targetValue = String(activeHotel.guests);
  const typedChars = Math.max(
    0,
    Math.min(
      targetValue.length,
      Math.floor(((localFrame - T_TYPING_START) / (T_TYPING_END - T_TYPING_START)) * targetValue.length),
    ),
  );
  const inputValue = localFrame >= T_TYPING_START ? targetValue.slice(0, typedChars) : '';

  // Quick button highlight (mostra cursor pairando sobre +5/+6/+4 etc)
  const quickIdx = (() => {
    if (localFrame < T_TYPING_START || localFrame > T_QUICK_HIGHLIGHT + 4) return undefined;
    // Mapa de hotel.guests pra índice no array [1,2,4,6,10]
    const map: Record<number, number> = { 1: 0, 2: 1, 3: 1, 4: 2, 5: 2, 6: 3, 7: 3, 8: 3, 10: 4 };
    return map[activeHotel.guests];
  })();

  // Save button pressed
  const savePressed =
    localFrame >= T_SAVE_CLICK && localFrame <= T_SAVE_CLICK + 6
      ? 1 - (localFrame - T_SAVE_CLICK) / 6
      : 0;

  // Cursor keyframes (em coords absolutas)
  const cursorKeyframes = (() => {
    const baseX = activeHotel.x;
    const baseY = activeHotel.y;
    const start = activeIdx * PER_HOTEL;
    return [
      { frame: start + T_CURSOR_START, x: baseX + 200, y: baseY + 150 },
      { frame: start + T_CLICK, x: baseX, y: baseY }, // click no pin
      { frame: start + T_TYPING_START - 2, x: 960, y: 480 }, // input do modal
      { frame: start + T_QUICK_HIGHLIGHT, x: 880 + (quickIdx ?? 2) * 50, y: 580 }, // quick buttons
      { frame: start + T_CURSOR_TO_SAVE - 2, x: 1080, y: 640 }, // save btn
      { frame: start + T_SAVE_CLICK, x: 1080, y: 640 },
      { frame: start + T_SAVE_CLICK + 10, x: 1080, y: 640 }, // segura
    ];
  })();

  // Para o cursor saltar entre hotéis sem teleportar feio, sobreponho keyframes do
  // próximo bloco. Pra simplicidade, recomputo só os do hotel atual (Cursor componente
  // interpola entre frames).

  // Map background tilt extra durante transições
  const tiltExtra = Math.sin(frame / 8) * 0.5;

  // Outro / fade in
  const sceneOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [totalHotelFrames - 8, totalHotelFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Title superior — explica o que tá rolando
  const titleOpacity = interpolate(
    frame,
    [10, 25, totalHotelFrames - 30, totalHotelFrames - 10],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // Pin "explosion" quando vira verde
  const greenExplosion = (() => {
    const sinceGreen = localFrame - T_PIN_GREEN;
    if (sinceGreen < 0 || sinceGreen > 18) return 0;
    return 1 - sinceGreen / 18;
  })();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: fontStack,
        opacity: sceneOpacity * fadeOut,
        background: colors.bg,
        transform: `perspective(2400px) rotateX(${tiltExtra * 0.3}deg)`,
      }}
    >
      <MapBackground />
      <SidebarPanel hotelsCount={HOTELS.length} withGuests={greenIds.size} />

      {/* Pins dos hotéis */}
      {HOTELS.map((h) => {
        const isActive = h.id === activeHotel.id;
        const isGreenNow = greenIds.has(h.id);
        const pinX = h.x;
        const pinY = h.y;
        const justTurnedGreen = isActive && greenExplosion > 0;
        // pin afastado-do-modal escurece um pouco quando modal aberto
        const dimmed = enterT > 0.4 && exitT < 0.5;
        const pinOpacity = dimmed && !isActive ? 0.5 : 1;

        // efeito 3D extra no momento do click
        const clickPulse = (() => {
          if (!isActive) return 0;
          const d = Math.abs(localFrame - T_CLICK);
          if (d > 8) return 0;
          return 1 - d / 8;
        })();

        // efeito 3D ao virar verde: rotação + glow
        const rotateX = justTurnedGreen ? greenExplosion * 360 : 0;
        const scale = justTurnedGreen
          ? 1 + greenExplosion * 0.6
          : 1 + clickPulse * 0.18;
        const ringScale = justTurnedGreen ? 1 + greenExplosion * 2.5 : 0;

        return (
          <div
            key={h.id}
            style={{
              position: 'absolute',
              left: pinX - 22,
              top: pinY - 22,
              opacity: pinOpacity,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              transition: 'opacity 0.4s',
            }}
          >
            {/* Anel de explosão verde */}
            {ringScale > 0 && (
              <div
                style={{
                  position: 'absolute',
                  inset: -12,
                  borderRadius: '50%',
                  border: `4px solid rgba(52,199,89,${greenExplosion * 0.8})`,
                  transform: `scale(${ringScale})`,
                  pointerEvents: 'none',
                }}
              />
            )}
            <HotelPin
              guests={h.guests}
              greenT={isGreenNow ? 1 : 0}
              size={44}
              pulseRing={!isGreenNow}
              rotateX={rotateX}
            />
          </div>
        );
      })}

      {/* Pin Meu local */}
      <div style={{ position: 'absolute', left: ME.x - 14, top: ME.y - 14 }}>
        <MePin />
      </div>

      {/* Modal sobre tudo */}
      {(enterT > 0 || exitT < 1) && (
        <GuestModal
          hotel={{ name: activeHotel.name, address: activeHotel.address }}
          enterT={enterT}
          exitT={exitT}
          inputValue={inputValue}
          highlightQuick={quickIdx}
          savePressed={savePressed}
        />
      )}

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: titleOpacity,
          zIndex: 9999,
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
          Passo 2 — Atribuir hóspedes
        </div>
        <div
          style={{
            fontSize: 38,
            fontWeight: 600,
            color: colors.ink100,
            letterSpacing: '-0.02em',
            marginTop: 4,
            textShadow: '0 4px 30px rgba(0,0,0,0.5)',
          }}
        >
          {activeIdx + 1} de {targets.length} · {greenIds.size}/{targets.length} prontos
        </div>
      </div>

      <Cursor
        keyframes={cursorKeyframes}
        clickFrames={[activeIdx * PER_HOTEL + T_CLICK, activeIdx * PER_HOTEL + T_SAVE_CLICK]}
      />
    </div>
  );
};
