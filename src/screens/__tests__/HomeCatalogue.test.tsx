import { act, create } from 'react-test-renderer';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 1366, height: 1024, scale: 2, fontScale: 1 }),
}));
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaView: ({ children }: any) => React.createElement(React.Fragment, null, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});
jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true,
  useFocusEffect: (cb: () => void | (() => void)) => {
    const cleanup = cb();
    if (typeof cleanup === 'function') cleanup();
  },
}));

// The catalogue each test renders with.
let mockCatalogue = { order: [] as string[], hidden: [] as string[], enabled: [] as string[] };
jest.mock('@/sdk/content/load', () => {
  const { SAFE_DEFAULT } = jest.requireActual('@/sdk/content/validate');
  const get = () => ({ ...SAFE_DEFAULT, catalogue: mockCatalogue });
  return { getContentConfig: get, useContentConfig: get, loadContentConfig: get };
});

import '@/games';
import { HomeScreen } from '../HomeScreen';
import { GameCard } from '../../components/common';
import { getAllGames, gameName } from '@/sdk';

const mounted: any[] = [];
afterEach(() => {
  act(() => {
    mounted.splice(0).forEach((t) => t.unmount());
  });
});

function tileNames(): string[] {
  let tree: any;
  act(() => {
    tree = create(<HomeScreen navigation={{ navigate: jest.fn() } as any} route={{ key: 'Home', name: 'Home' } as any} />);
  });
  mounted.push(tree);
  return tree.root.findAllByType(GameCard).map((n: any) => n.props.name);
}

// protects=the catalogue config reaches the real Home rail: hidden games have no tile and pinned games lead; fails_when=Home still reads getAllGames or ignores catalogue.order; no_claim=device-size filters (3D off) and age bands are not varied here
it('hides and reorders Home tiles from the catalogue', () => {
  const all = getAllGames().filter((g) => !g.dark && !g.needs3D);
  const [first, second, third] = all;
  mockCatalogue = { order: [third.id], hidden: [first.id], enabled: [] };
  const names = tileNames();
  expect(names).not.toContain(gameName(first));
  expect(names[0]).toBe(gameName(third));
  expect(names).toContain(gameName(second));
});
