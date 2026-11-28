import { Image, View } from 'react-native';
import { act, create } from 'react-test-renderer';
import { AnimalSprite } from '../components/AnimalSprite';
import { ANIMAL_SPRITES } from '../animalSprites';

// The renderer instance type, as other tests here spell it (the named
// `ReactTestRenderer` import resolves to a namespace under this setup).
type Renderer = ReturnType<typeof create>;

it('draws the sprite sheet once the tile has a size', () => {
  let tree!: Renderer;
  act(() => {
    tree = create(<AnimalSprite id="lion" state="default" image={1} />);
  });
  const root = tree.root.findAllByType(View)[0];
  act(() => {
    root.props.onLayout({ nativeEvent: { layout: { width: 120, height: 150, x: 0, y: 0 } } });
  });
  const img = tree.root.findAllByType(Image).find((i: { props: { source?: unknown } }) => i.props.source === ANIMAL_SPRITES.lion);
  expect(img).toBeDefined();
  expect(img!.props.style.width).toBeGreaterThan(0);
});
