import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';

// Per-test screen size — set before each render.
let mockDims = { width: 844, height: 390, scale: 2, fontScale: 1 };
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => mockDims,
}));

// Safe-area: fixed zero insets so the screen renders without a provider.
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaView: ({ children }: any) => React.createElement(React.Fragment, null, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// useFocusEffect runs its effect once, immediately (no navigation container in tests).
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void | (() => void)) => {
    const cleanup = cb();
    if (typeof cleanup === 'function') cleanup();
  },
}));

import '@/games'; // register games + translations
import { HomeScreen } from '../HomeScreen';
import { getAllGames } from '@/sdk';

function renderHome() {
  const navigation = { navigate: jest.fn() } as any;
  let tree: any;
  act(() => {
    tree = create(
      <HomeScreen navigation={navigation} route={{ key: 'Home', name: 'Home' } as any} />,
    );
  });
  return tree;
}

const gameCount = getAllGames().length;

it('renders all game names on iPhone landscape', () => {
  mockDims = { width: 844, height: 390, scale: 2, fontScale: 1 };
  const tree = renderHome();
  const texts = tree.root.findAllByType(Text);
  expect(gameCount).toBeGreaterThan(0);
  // At least one Text node per game should be present.
  expect(texts.length).toBeGreaterThanOrEqual(gameCount);
});

it('renders on iPad landscape without throwing', () => {
  mockDims = { width: 1366, height: 1024, scale: 2, fontScale: 1 };
  expect(() => renderHome()).not.toThrow();
});

it('renders on iPad portrait without throwing', () => {
  mockDims = { width: 1024, height: 1366, scale: 2, fontScale: 1 };
  expect(() => renderHome()).not.toThrow();
});

it('renders on an RTL tablet without throwing', () => {
  const RN = require('react-native');
  const original = RN.I18nManager.isRTL;
  RN.I18nManager.isRTL = true;
  mockDims = { width: 1366, height: 1024, scale: 2, fontScale: 1 };
  try {
    expect(() => renderHome()).not.toThrow();
  } finally {
    RN.I18nManager.isRTL = original;
  }
});
