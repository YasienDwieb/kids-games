import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import { SceneCanvas } from '../SceneCanvas';
import ParallaxBackground from '../backdrop/ParallaxBackground';

it('mounts the parallax backdrop and forwards progress', () => {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(
      <SceneCanvas progress={0.5}>
        <Text>unit</Text>
      </SceneCanvas>,
    );
  });
  const bg = tree.root.findByType(ParallaxBackground);
  expect(bg.props.progress).toBe(0.5);
  act(() => tree.unmount());
});

it('defaults progress to 0 when omitted', () => {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<SceneCanvas />);
  });
  expect(tree.root.findByType(ParallaxBackground).props.progress).toBe(0);
  act(() => tree.unmount());
});
