import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import { useChoiceHints } from '../useChoiceHints';

let latest: ReturnType<typeof useChoiceHints>;

function Probe({ round }: { round: number }) {
  latest = useChoiceHints(round);
  return <Text>{latest.misses}</Text>;
}

const wrongPick = () => {
  let after!: () => void;
  act(() => {
    after = latest.miss(2);
  });
  act(() => after());
};

it('steps up: retry, then point at the answer, then reveal it', () => {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<Probe round={1} />);
  });

  wrongPick();
  expect(latest.hintIndex).toBeNull();
  expect(latest.revealCorrect).toBe(false);

  wrongPick();
  expect(latest.hintIndex).toBe(2);
  expect(latest.revealCorrect).toBe(false);

  wrongPick();
  expect(latest.revealCorrect).toBe(true);

  act(() => tree.update(<Probe round={2} />));
  expect(latest.hintIndex).toBeNull();
  expect(latest.revealCorrect).toBe(false);
  expect(latest.misses).toBe(0);
  act(() => tree.unmount());
});
