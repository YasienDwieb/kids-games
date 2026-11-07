import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import { GameExitContext } from '../../layout/ScreenBackContext';
import { overlayClosed, overlayOpened } from '../../layout/overlayGate';
import { useRoundEnd } from '../useRoundEnd';

let finishCelebrating: () => void;
jest.mock('../Celebration', () => ({
  useCelebrate: () => () =>
    new Promise<void>((resolve) => {
      finishCelebrating = resolve;
    }),
}));

let latest: ReturnType<typeof useRoundEnd>;
function Probe() {
  latest = useRoundEnd();
  return <Text>game</Text>;
}

const mount = (exit = jest.fn()) => {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(
      <GameExitContext.Provider value={exit}>
        <Probe />
      </GameExitContext.Provider>,
    );
  });
  return { tree, exit };
};

it('moves on only once the celebration is over', async () => {
  const { tree } = mount();
  const go = jest.fn();
  let done!: Promise<void>;
  act(() => {
    done = latest.next('small', go);
  });
  expect(go).not.toHaveBeenCalled();
  await act(async () => {
    finishCelebrating();
    await done;
  });
  expect(go).toHaveBeenCalledTimes(1);
  act(() => tree.unmount());
});

it('does not move on after the game has left the screen', async () => {
  const { tree } = mount();
  const go = jest.fn();
  let done!: Promise<void>;
  act(() => {
    done = latest.next('big', go);
  });
  act(() => tree.unmount());
  await act(async () => {
    finishCelebrating();
    await done;
  });
  expect(go).not.toHaveBeenCalled();
});

it('after the last round: rewards, lets a card finish, then leaves', async () => {
  const { tree, exit } = mount();
  // A Level Up the reward just earned: the gate is closed before finish() resolves.
  const finish = jest.fn(async () => overlayOpened());
  let done!: Promise<void>;
  act(() => {
    done = latest.end(finish);
  });
  expect(finish).not.toHaveBeenCalled();
  await act(async () => {
    finishCelebrating();
    await done;
  });
  expect(finish).toHaveBeenCalledTimes(1);
  expect(exit).not.toHaveBeenCalled();
  act(() => overlayClosed());
  expect(exit).toHaveBeenCalledTimes(1);
  act(() => tree.unmount());
});
