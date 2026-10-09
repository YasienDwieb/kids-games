import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import { useFirstRun, tutorialStore, type FirstRunStatus } from '../useFirstRun';

let latest: { status: FirstRunStatus; complete: () => void };

function Probe({ id }: { id: string }) {
  latest = useFirstRun(id);
  return <Text>{latest.status}</Text>;
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

it('shows once, then stays done after complete()', async () => {
  let tree!: ReturnType<typeof create>;
  await act(async () => {
    tree = create(<Probe id="mouse-maze" />);
  });
  expect(latest.status).toBe('show');

  await act(async () => {
    latest.complete();
  });
  expect(latest.status).toBe('done');
  expect((await tutorialStore.get()).seen).toEqual(['mouse-maze']);
  act(() => tree.unmount());

  // A fresh mount (next app launch) remembers it.
  await act(async () => {
    tree = create(<Probe id="mouse-maze" />);
  });
  expect(latest.status).toBe('done');
  act(() => tree.unmount());
});

it('tracks demos independently', async () => {
  await tutorialStore.set({ seen: ['mouse-maze'] });
  let tree!: ReturnType<typeof create>;
  await act(async () => {
    tree = create(<Probe id="color-mixer:drag" />);
  });
  expect(latest.status).toBe('show');
  act(() => tree.unmount());
});
