import { AbsoluteFill, Sequence } from 'remotion';
import { IntroScene } from './scenes/IntroScene';
import { LoginScene } from './scenes/LoginScene';
import { MapScene } from './scenes/MapScene';
import { GuestAssignmentScene } from './scenes/GuestAssignmentScene';
import { RouteScene } from './scenes/RouteScene';
import { OutroScene } from './scenes/OutroScene';

export const Presentation: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0b0b0d' }}>
      {/* Intro: 0-90 (3s) */}
      <Sequence from={0} durationInFrames={90}>
        <IntroScene />
      </Sequence>

      {/* Login: 80-205 (4.2s) */}
      <Sequence from={80} durationInFrames={125}>
        <LoginScene />
      </Sequence>

      {/* Map intro: 195-300 (3.5s) — hotéis aparecendo */}
      <Sequence from={195} durationInFrames={105}>
        <MapScene />
      </Sequence>

      {/* Atribuir hóspedes: 290-650 (12s) — 5 modais sequenciais (5x70 = 350 + buffer) */}
      <Sequence from={290} durationInFrames={360}>
        <GuestAssignmentScene />
      </Sequence>

      {/* Rota + economia: 640-820 (6s) */}
      <Sequence from={640} durationInFrames={180}>
        <RouteScene />
      </Sequence>

      {/* Outro: 810-990 (6s) */}
      <Sequence from={810} durationInFrames={180}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
