import { AbsoluteFill, Sequence } from 'remotion';
import { IntroScene } from './scenes/IntroScene';
import { LoginScene } from './scenes/LoginScene';
import { MapScene } from './scenes/MapScene';
import { RouteScene } from './scenes/RouteScene';
import { OutroScene } from './scenes/OutroScene';

export const Presentation: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0b0b0d' }}>
      {/* Intro: 0-90 (3s) */}
      <Sequence from={0} durationInFrames={90}>
        <IntroScene />
      </Sequence>

      {/* Login: 80-205 (4s) — overlap de 10 frames pra crossfade visual */}
      <Sequence from={80} durationInFrames={125}>
        <LoginScene />
      </Sequence>

      {/* Map + selecionar hotéis: 195-395 (~6.5s) */}
      <Sequence from={195} durationInFrames={200}>
        <MapScene />
      </Sequence>

      {/* Rota + economia: 385-595 (7s) */}
      <Sequence from={385} durationInFrames={210}>
        <RouteScene />
      </Sequence>

      {/* Outro: 585-780 (6.5s) */}
      <Sequence from={585} durationInFrames={195}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
