/**
 * Guards the guided-flow landscape regression where makeN/addition answer
 * buttons were pushed off the bottom of the screen. We can't measure pixels in
 * jest, but we CAN assert the choice buttons are present in the rendered tree
 * in landscape — combined with the flex-pinned layout (choices live below a
 * flex:1, overflow:hidden visual area), they cannot be clipped off-screen.
 */
import { act, create } from 'react-test-renderer';

// Force landscape for useWindowDimensions() (react-native re-exports this module).
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 800, height: 360, scale: 2, fontScale: 1 }),
}));

import '@/games'; // registers count-and-pop translations
import { HowMany } from '../HowMany';
import { NumberChoice } from '../NumberChoice';
import type { MakeNRound } from '../../types';

const makeNRound: MakeNRound = {
  mode: 'makeN',
  have: 7,
  target: 9,
  objectEmoji: '🐟',
  choices: [1, 2, 3],
  correctIndex: 1,
};

it('renders every answer button in landscape (makeN)', () => {
  let tree: ReturnType<typeof create>;
  act(() => {
    tree = create(<HowMany round={makeNRound} selectedIndex={null} onPick={() => {}} />);
  });
  const choices = tree!.root.findAllByType(NumberChoice);
  expect(choices).toHaveLength(makeNRound.choices.length);
  act(() => tree!.unmount());
});
