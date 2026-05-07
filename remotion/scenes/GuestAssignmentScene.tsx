import { interpolate, useCurrentFrame } from 'remotion';
import { colors, fontStack } from '../theme';
import { ASSIGNMENT_ORDER, HOTELS, ME } from '../data/hotels';
import { MapBackground } from '../components/MapBackground';
import { SidebarPanel } from '../components/SidebarPanel';
import { HotelPin } from '../components/HotelPin';
import { MePin } from '../components/MePin';
import { Cursor } from '../components/Cursor';
import { GuestModal } from '../components/GuestModal';

const PER_HOTEL = 70;

// Sub-tempos dentro de cada hotel
const T_PIN_CLICK = 12;
const T_MODAL_ENTER_START = 12;
const T_MODAL_ENTER_END = 24;
const T_CURSOR_TO_INPUT = 26;
const T_TYPING_START = 28;
const T_TYPING_END = 38;
const T_CURSOR_TO_QUICK = 40;
const T_QUICK_HIGHLIGHT = 44;
const T_CURSOR_TO_SAVE = 48;
const T_SAVE_CLICK = 54;
const T_MODAL_EXIT_START = 54;
const T_MODAL_EXIT_END = 64;
const T_PIN_GREEN = 60;

// Coordenadas REAIS dos elementos do modal (recalculadas pra bater com o layout)
// Modal: 480px x ~328px, centrado em (960, 540)
// → top do modal: 376, bottom: 704; left: 720, right: 1200
const MODAL_INPUT = { x: 960, y: 536 };
const MODAL_SAVE = { x: 1070, y: 656 };
// Quick row centrada em y=592, com botões espaçados ~50px e centro do row em x=960
const quickButtonX = (i: number) => 857 + i * 50;
const QUICK_ROW_Y = 592;

// Mapa hotel.guests → índice no array [+1, +2, +4, +6, +10]
const QUICK_INDEX_FOR_GUESTS = (g: number): number => {
  if (g <= 1) return 0;
  if (g === 2 || g === 3) return 1;
  if (g === 4 || g === 5) return 2;
  if (g >= 6 && g <= 8) return 3;
  return 4; // 9+
};

export const GuestAssignmentScene: React.FC = () => {
  const frame = useCurrentFrame();

  const targets = ASSIGNMENT_ORDER.map((id) => HOTELS.find((h) => h.id === id)!);
  const totalHotelFrames = PER_HOTEL * targets.length;

  const activeIdx = Math.min(targets.length - 1, Math.floor(frame / PER_HOTEL));
  const localFrame = frame - activeIdx * PER_HOTEL;
  const activeHotel = targets[activeIdx];

  // Ids verdes (já assignados ou viraram verde agora)
  const greenIds = new Set<string>();
  targets.forEach((t, i) => {
    if (i < activeIdx) greenIds.add(t.id);
    if (i === activeIdx && localFrame >= T_PIN_GREEN) greenIds.add(t.id);
  });

  // Modal enter/exit progress
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

  // Texto sendo digitado
  const targetValue = String(activeHotel.guests);
  const typedChars = Math.max(
    0,
    Math.min(
      targetValue.length,
      Math.floor(((localFrame - T_TYPING_START) / (T_TYPING_END - T_TYPING_START)) * targetValue.length),
    ),
  );
  const inputValue = localFrame >= T_TYPING_START ? targetValue.slice(0, typedChars) : '';

  // Quick button highlight ativo só durante a janela
  const quickIdx = QUICK_INDEX_FOR_GUESTS(activeHotel.guests);
  const quickActive =
    localFrame >= T_CURSOR_TO_QUICK && localFrame <= T_QUICK_HIGHLIGHT + 4 ? quickIdx : undefined;

  // Save button pressed
  const savePressed =
    localFrame >= T_SAVE_CLICK && localFrame <= T_SAVE_CLICK + 6
      ? 1 - (localFrame - T_SAVE_CLICK) / 6
      : 0;

  // ===== Keyframes do cursor (TODOS os hotéis em sequência) =====
  // Sem teleporte entre hotéis: cursor flui de save click → próximo pin
  const cursorKeyframes = targets.flatMap((hotel, idx) => {
    const start = idx * PER_HOTEL;
    const qIdx = QUICK_INDEX_FOR_GUESTS(hotel.guests);
    const qx = quickButtonX(qIdx);
    return [
      // 1) cursor chegando ao pin (com aproximação curva via offset)
      ...(idx === 0
        ? [{ frame: start - 12, x: 1700, y: 200 }]
        : []),
      { frame: start + T_PIN_CLICK - 8, x: hotel.x + 60, y: hotel.y + 80 }, // approach
      { frame: start + T_PIN_CLICK, x: hotel.x, y: hotel.y }, // click
      { frame: start + T_PIN_CLICK + 5, x: hotel.x, y: hotel.y }, // dwell
      // 2) cursor → input (quando modal já abriu)
      { frame: start + T_CURSOR_TO_INPUT + 4, x: MODAL_INPUT.x, y: MODAL_INPUT.y },
      // permanece no input enquanto digita
      { frame: start + T_TYPING_END, x: MODAL_INPUT.x + 4, y: MODAL_INPUT.y + 2 },
      // 3) → quick button
      { frame: start + T_CURSOR_TO_QUICK + 2, x: qx, y: QUICK_ROW_Y },
      { frame: start + T_QUICK_HIGHLIGHT + 3, x: qx, y: QUICK_ROW_Y },
      // 4) → save
      { frame: start + T_CURSOR_TO_SAVE + 4, x: MODAL_SAVE.x, y: MODAL_SAVE.y },
      { frame: start + T_SAVE_CLICK, x: MODAL_SAVE.x, y: MODAL_SAVE.y }, // click
      { frame: start + T_SAVE_CLICK + 6, x: MODAL_SAVE.x, y: MODAL_SAVE.y }, // dwell
      // 5) durante saída do modal, começa a se afastar (sem entrar no próximo pin ainda)
      ...(idx < targets.length - 1
        ? [{ frame: start + T_MODAL_EXIT_END, x: MODAL_SAVE.x - 30, y: MODAL_SAVE.y - 20 }]
        : []),
    ];
  });

  // Click frames globais
  const clickFrames = targets.flatMap((_, idx) => [
    idx * PER_HOTEL + T_PIN_CLICK,
    idx * PER_HOTEL + T_SAVE_CLICK,
  ]);

  // Tilt da câmera (sutil)
  const tiltExtra = Math.sin(frame / 20) * 0.4;

  const sceneOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [totalHotelFrames - 8, totalHotelFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const titleOpacity = interpolate(
    frame,
    [10, 25, totalHotelFrames - 30, totalHotelFrames - 10],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

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
        transform: `perspective(2400px) rotateX(${tiltExtra * 0.2}deg)`,
      }}
    >
      <MapBackground />
      <SidebarPanel hotelsCount={HOTELS.length} withGuests={greenIds.size} />

      {/* Pins */}
      {HOTELS.map((h) => {
        const isActive = h.id === activeHotel.id;
        const isGreenNow = greenIds.has(h.id);
        const justTurnedGreen = isActive && greenExplosion > 0;
        const dimmed = enterT > 0.4 && exitT < 0.5;
        const pinOpacity = dimmed && !isActive ? 0.4 : 1;

        const clickPulse = (() => {
          if (!isActive) return 0;
          const d = Math.abs(localFrame - T_PIN_CLICK);
          if (d > 8) return 0;
          return 1 - d / 8;
        })();

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
              left: h.x - 22,
              top: h.y - 22,
              opacity: pinOpacity,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              transition: 'opacity 0.4s',
            }}
          >
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

      <div style={{ position: 'absolute', left: ME.x - 14, top: ME.y - 14 }}>
        <MePin />
      </div>

      {(enterT > 0 || exitT < 1) && (
        <GuestModal
          hotel={{ name: activeHotel.name, address: activeHotel.address }}
          enterT={enterT}
          exitT={exitT}
          inputValue={inputValue}
          highlightQuick={quickActive}
          savePressed={savePressed}
        />
      )}

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

      <Cursor keyframes={cursorKeyframes} clickFrames={clickFrames} />
    </div>
  );
};
