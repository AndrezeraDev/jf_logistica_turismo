import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, fontStack, glassStyle } from '../theme';
import { Logo } from '../components/Logo';
import { Cursor } from '../components/Cursor';

export const LoginScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Card entra
  const cardScale = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 140 },
  });
  const cardOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });

  // Texto sendo "digitado" no campo de username
  const usernameText = 'admin'.slice(0, Math.max(0, Math.min(5, Math.floor((frame - 24) / 4))));
  const passwordText = '••••••••••••••'.slice(
    0,
    Math.max(0, Math.min(14, Math.floor((frame - 50) / 3))),
  );
  const captchaText = '12'.slice(0, Math.max(0, Math.min(2, Math.floor((frame - 80) / 5))));

  // Click no botão Entrar @ frame 95
  const btnScale = interpolate(frame, [95, 100, 105], [1, 0.94, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Fade-out final
  const sceneOpacity = interpolate(frame, [105, 120], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: colors.bg,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: fontStack,
        opacity: sceneOpacity,
      }}
    >
      {/* Aurora animada */}
      <div
        style={{
          position: 'absolute',
          top: '-30%',
          left: '-20%',
          width: 1200,
          height: 1200,
          borderRadius: '50%',
          background:
            'radial-gradient(closest-side, rgba(10,132,255,0.45), transparent 70%)',
          transform: `translate(${Math.sin(frame / 30) * 80}px, ${Math.cos(frame / 30) * 50}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-30%',
          right: '-20%',
          width: 1100,
          height: 1100,
          borderRadius: '50%',
          background:
            'radial-gradient(closest-side, rgba(52,199,89,0.28), transparent 70%)',
          transform: `translate(${-Math.sin(frame / 35) * 60}px, ${-Math.cos(frame / 35) * 40}px)`,
        }}
      />

      {/* Grid sutil */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          opacity: 0.06,
        }}
      />

      {/* Card de login */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 520,
          padding: 40,
          ...glassStyle,
          transform: `translate(-50%, -50%) scale(${cardScale})`,
          opacity: cardOpacity,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Logo size={84} />
        </div>
        <div
          style={{
            textAlign: 'center',
            fontSize: 14,
            letterSpacing: '0.25em',
            color: colors.ink400,
            textTransform: 'uppercase',
          }}
        >
          JE Hoffman Turismo
        </div>
        <div
          style={{
            textAlign: 'center',
            fontSize: 38,
            fontWeight: 600,
            color: colors.ink100,
            letterSpacing: '-0.02em',
            margin: '6px 0 6px',
          }}
        >
          Entrar
        </div>
        <div style={{ textAlign: 'center', fontSize: 16, color: colors.ink400, marginBottom: 28 }}>
          Use suas credenciais pra acessar o painel
        </div>

        {/* Campo username */}
        <Field icon="👤" value={usernameText} placeholder="Usuário" />
        <div style={{ height: 14 }} />
        <Field icon="🔒" value={passwordText} placeholder="Senha" />
        <div style={{ height: 14 }} />

        {/* Captcha */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.15em',
              color: colors.ink400,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Verificação anti-bot
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 22,
                color: colors.ink100,
              }}
            >
              7 + 5 =
            </span>
            <div
              style={{
                flex: 1,
                height: 38,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 22,
                color: colors.ink100,
              }}
            >
              {captchaText}
            </div>
          </div>
        </div>

        {/* Botão Entrar */}
        <div
          style={{
            marginTop: 24,
            height: 56,
            borderRadius: 22,
            background: `linear-gradient(180deg, ${colors.accent} 0%, ${colors.accentDark} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: 18,
            letterSpacing: '-0.01em',
            boxShadow: '0 12px 30px rgba(10,132,255,0.55)',
            transform: `scale(${btnScale})`,
          }}
        >
          ▶ Entrar
        </div>
      </div>

      {/* Cursor que vai pra cada campo e clica em Entrar */}
      <Cursor
        keyframes={[
          { frame: 0, x: 1700, y: 200 },
          { frame: 22, x: 850, y: 540 }, // username
          { frame: 48, x: 850, y: 615 }, // senha
          { frame: 78, x: 920, y: 765 }, // captcha
          { frame: 95, x: 850, y: 880 }, // botão
        ]}
        clickFrames={[95]}
      />
    </div>
  );
};

const Field: React.FC<{ icon: string; value: string; placeholder: string }> = ({
  icon,
  value,
  placeholder,
}) => (
  <div
    style={{
      height: 52,
      borderRadius: 14,
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.10)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 14px',
      gap: 10,
    }}
  >
    <span style={{ fontSize: 18, opacity: 0.6 }}>{icon}</span>
    <div
      style={{
        color: value ? colors.ink100 : colors.ink400,
        fontSize: 17,
        fontFamily: value.includes('•') ? 'ui-monospace, monospace' : fontStack,
      }}
    >
      {value || placeholder}
    </div>
  </div>
);
