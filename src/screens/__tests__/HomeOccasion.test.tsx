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

let mockForce: string | null = null;
jest.mock('@/sdk/content/load', () => {
  const { SAFE_DEFAULT } = jest.requireActual('@/sdk/content/validate');
  const get = () => ({ ...SAFE_DEFAULT, themes: { force: mockForce, dates: {} } });
  return { getContentConfig: get, useContentConfig: get, loadContentConfig: get };
});

import '@/games';
import { HomeScreen } from '../HomeScreen';
import { OCCASION_THEMES } from '@/sdk';

const mounted: any[] = [];
afterEach(() => {
  act(() => {
    mounted.splice(0).forEach((t) => t.unmount());
  });
});

function decorCount(): number {
  let tree: any;
  act(() => {
    tree = create(<HomeScreen navigation={{ navigate: jest.fn() } as any} route={{ key: 'Home', name: 'Home' } as any} />);
  });
  mounted.push(tree);
  return tree.root.findAll((n: any) => n.props.testID === 'occasion-decor' && typeof n.type === 'string').length;
}

// protects=a forced Ramadan reaches Home and draws its decor in LTR and RTL; fails_when=Home ignores the occasion or decor breaks under RTL; no_claim=does not check pixel placement or the gift card (useOccasionWelcome test)
it.each([false, true])('draws Ramadan decor on Home (RTL=%s)', (rtl) => {
  const RN = require('react-native');
  const original = RN.I18nManager.isRTL;
  RN.I18nManager.isRTL = rtl;
  mockForce = 'ramadan';
  try {
    expect(decorCount()).toBe(OCCASION_THEMES.ramadan.homeDecor.length);
  } finally {
    RN.I18nManager.isRTL = original;
  }
});

// protects=with no occasion Home looks exactly as before; fails_when=decor shows on an ordinary day; no_claim=none beyond protects
it('draws no decor without an occasion', () => {
  mockForce = 'none';
  expect(decorCount()).toBe(0);
});
