import { act, create } from 'react-test-renderer';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  // Portrait: the stacked layout always draws the buddy (landscape sizes it from onLayout, which tests never fire).
  default: () => ({ width: 1024, height: 1366, scale: 2, fontScale: 1 }),
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

function render(): { garland: number; companion: number } {
  let tree: any;
  act(() => {
    tree = create(<HomeScreen navigation={{ navigate: jest.fn() } as any} route={{ key: 'Home', name: 'Home' } as any} />);
  });
  mounted.push(tree);
  const count = (id: string) => tree.root.findAll((n: any) => n.props.testID === id && typeof n.type === 'string').length;
  return { garland: count('occasion-garland-piece'), companion: count('occasion-companion') };
}

// protects=a forced Ramadan reaches Home: the light string spans the screen and a fanoos stands beside the buddy, in LTR and RTL; fails_when=Home ignores the occasion, the string is missing, or the companion isn't drawn; no_claim=does not check pixel placement or the gift card (useOccasionWelcome test)
it.each([false, true])('draws the Ramadan light string and companion on Home (RTL=%s)', (rtl) => {
  const RN = require('react-native');
  const original = RN.I18nManager.isRTL;
  RN.I18nManager.isRTL = rtl;
  mockForce = 'ramadan';
  try {
    const { garland, companion } = render();
    expect(garland).toBeGreaterThanOrEqual(OCCASION_THEMES.ramadan.garland.length);
    expect(companion).toBeGreaterThanOrEqual(1);
  } finally {
    RN.I18nManager.isRTL = original;
  }
});

// protects=with no occasion Home looks exactly as before; fails_when=a light string or companion shows on an ordinary day; no_claim=none beyond protects
it('draws nothing extra without an occasion', () => {
  mockForce = 'none';
  expect(render()).toEqual({ garland: 0, companion: 0 });
});
