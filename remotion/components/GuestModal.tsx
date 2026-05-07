import { interpolate } from 'remotion';
import { colors, fontStack } from '../theme';

interface Props {
  hotel: { name: string; address: string };
  /** 0..1 — progresso da entrada (modal aparece) */
  enterT: number;
  /** 0..1 — progresso da saída (modal some) */
  exitT: number;
  /** valor a digitar no input (string vazia ou número) */
  inputValue: string;
  /** 0..1 — qual quick-button [+1,+2,+4,+6,+10] está em hover/pressed */
  highlightQuick?: number;
  /** 0..1 — quanto o botão "Salvar" está pressionado */
  savePressed?: number;
}

const QUICK_VALUES = [1, 2, 4, 6, 10];

export const GuestModal: React.FC<Props> = ({
  hotel,
  enterT,
  exitT,
  inputValue,
  highlightQuick,
  savePressed = 0,
}) => {
  // Entrada: rotateX -90 → 0, scale 0.94 → 1, opacity 0 → 1
  // Saída: rotateY 0 → 90 (flip), opacity 1 → 0
  const enterOpacity = enterT;
  const enterRotX = interpolate(enterT, [0, 1], [-60, 0]);
  const enterScale = interpolate(enterT, [0, 1], [0.7, 1]);
  const enterY = interpolate(enterT, [0, 1], [40, 0]);

  const exitOpacity = 1 - exitT;
  const exitRotY = interpolate(exitT, [0, 1], [0, 90]);
  const exitScale = interpolate(exitT, [0, 1], [1, 0.92]);

  const opacity = enterOpacity * exitOpacity;
  const transform = `
    perspective(1500px)
    translateY(${enterY}px)
    rotateX(${enterRotX}deg)
    rotateY(${exitRotY}deg)
    scale(${enterScale * exitScale})
  `;

  // Backdrop fade
  const backdropOpacity = Math.min(enterOpacity, exitOpacity);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 9990,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `rgba(0,0,0,${backdropOpacity * 0.45})`,
        backdropFilter: backdropOpacity > 0.1 ? 'blur(6px)' : 'none',
      }}
    >
      <div
        style={{
          width: 480,
          padding: 24,
          borderRadius: 28,
          background:
            'linear-gradient(180deg, rgba(28,28,32,0.88) 0%, rgba(22,22,26,0.78) 100%)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.06) inset, 0 40px 100px rgba(0,0,0,0.7), 0 0 60px rgba(10,132,255,0.15)',
          transform,
          transformOrigin: 'center center',
          opacity,
          fontFamily: fontStack,
          color: colors.ink100,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                letterSpacing: '0.15em',
                color: colors.ink400,
                textTransform: 'uppercase',
              }}
            >
              <UsersIcon size={13} /> Hóspedes neste hotel
            </div>
            <div
              style={{
                fontSize: 19,
                fontWeight: 600,
                marginTop: 6,
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
              }}
            >
              {hotel.name}
            </div>
            {hotel.address && (
              <div style={{ fontSize: 12, color: colors.ink400, marginTop: 3 }}>
                {hotel.address}
              </div>
            )}
          </div>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.ink300,
            }}
          >
            <XIcon size={15} />
          </div>
        </div>

        {/* Input */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12, color: colors.ink400, marginBottom: 6 }}>
            Quantidade de pessoas
          </div>
          <div
            style={{
              height: 56,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${inputValue ? 'rgba(10,132,255,0.6)' : 'rgba(255,255,255,0.10)'}`,
              boxShadow: inputValue ? '0 0 0 4px rgba(10,132,255,0.10)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 600,
              color: inputValue ? colors.ink100 : colors.ink400,
              transition: 'all 0.2s',
            }}
          >
            {inputValue || '0'}
          </div>

          {/* Quick buttons */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 12,
              justifyContent: 'center',
            }}
          >
            {QUICK_VALUES.map((n, i) => {
              const isHi = highlightQuick === i;
              return (
                <div
                  key={n}
                  style={{
                    height: 32,
                    padding: '0 12px',
                    borderRadius: 10,
                    background: isHi ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    color: colors.ink200,
                    transform: isHi ? 'scale(1.08)' : 'scale(1)',
                    transition: 'all 0.15s',
                  }}
                >
                  +{n}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
          <div
            style={{
              flex: 1,
              height: 48,
              borderRadius: 16,
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.ink300,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Cancelar
          </div>
          <div
            style={{
              flex: 1,
              height: 48,
              borderRadius: 16,
              background: `linear-gradient(180deg, ${colors.accent} 0%, ${colors.accentDark} 100%)`,
              boxShadow: `0 8px 20px rgba(10,132,255,${0.35 + savePressed * 0.3})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              transform: `scale(${1 - savePressed * 0.05})`,
            }}
          >
            Salvar
          </div>
        </div>
      </div>
    </div>
  );
};

const UsersIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const XIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </svg>
);
