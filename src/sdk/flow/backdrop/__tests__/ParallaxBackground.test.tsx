import { act, create } from 'react-test-renderer';
import { View } from 'react-native';
import ParallaxBackground from '../ParallaxBackground';
import type { BackdropConfig } from '../types';

// A 1x1 inline image source — no real asset files needed.
const px = { uri: 'data:image/png;base64,iVBORw0KGgo=' };

const config: BackdropConfig = {
  paletteRamp: ['#000000', '#ffffff'],
  layers: [
    {
      elements: [{ source: px, width: 10, height: 10, left: 0, bottom: 0 }],
      stripWidth: 100,
      driftDurationMs: 1000,
      opacity: 0.4,
    },
  ],
  motion: 'animated',
};

it('renders without intercepting touches and applies the progress tint', () => {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<ParallaxBackground progress={0.5} config={config} />);
  });
  const root = tree.root;
  // The outermost view must not intercept touches.
  const outer = root.findAllByType(View)[0];
  expect(outer.props.pointerEvents).toBe('none');
  // Base fill carries the interpolated midpoint color (#808080).
  const tinted = root
    .findAllByType(View)
    .some((v: { props: { style?: unknown } }) => {
      const style = v.props.style;
      const bg = Array.isArray(style)
        ? (Object.assign({}, ...(style as object[]).filter(Boolean)) as { backgroundColor?: string }).backgroundColor
        : (style as { backgroundColor?: string } | undefined)?.backgroundColor;
      return bg === '#808080';
    });
  expect(tinted).toBe(true);
  act(() => tree.unmount());
});

it('does not throw in static motion mode', () => {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<ParallaxBackground progress={0} config={{ ...config, motion: 'static' }} />);
  });
  act(() => tree.unmount());
});
