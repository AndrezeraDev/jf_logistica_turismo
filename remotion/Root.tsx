import { Composition } from 'remotion';
import { Presentation } from './Presentation';

export const Root: React.FC = () => {
  return (
    <Composition
      id="Presentation"
      component={Presentation}
      durationInFrames={780} // 26s @ 30fps
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
