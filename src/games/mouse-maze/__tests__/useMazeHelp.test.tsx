import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import { tutorialStore } from '@/sdk/tutorial/useFirstRun';
import { BUMPS_FOR_HELP, BUMPS_NOW, useMazeHelp } from '../hooks/useMazeHelp';

const mockSpeak = jest.fn();
jest.mock('@/sdk/speech/useSpeech', () => ({ useSpeech: () => ({ speak: mockSpeak, stop: jest.fn() }) }));

const IDLE = 9000;
let latest: ReturnType<typeof useMazeHelp>;

function Probe({ mazeKey = 1, active = true }: { mazeKey?: number; active?: boolean }) {
  latest = useMazeHelp({ active, mazeKey, idleMs: IDLE });
  return <Text>{String(latest.showDemo)}</Text>;
}

const mount = async (el: React.ReactElement) => {
  let tree!: ReturnType<typeof create>;
  await act(async () => {
    tree = create(el);
  });
  return tree;
};
const wait = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });
const bump = async (n: number) => {
  for (let i = 0; i < n; i++) await act(async () => latest.onBump());
};

beforeEach(async () => {
  jest.useFakeTimers();
  mockSpeak.mockClear();
  await AsyncStorage.clear();
});
afterEach(() => jest.useRealTimers());

it('teaches the first play until the first step', async () => {
  const tree = await mount(<Probe />);
  expect(latest.showDemo).toBe(true);
  await act(async () => latest.onStep());
  expect(latest.showDemo).toBe(false);
  act(() => tree.unmount());
});

describe('after the tutorial', () => {
  beforeEach(() => tutorialStore.set({ seen: ['mouse-maze'] }));

  it('only repeats the prompt when the child just waits', async () => {
    const tree = await mount(<Probe />);
    await wait(IDLE * 3);
    expect(latest.showDemo).toBe(false);
    expect(mockSpeak).toHaveBeenCalledTimes(1);
    act(() => tree.unmount());
  });

  it('shows the hand after wall bumps and a pause, and drops it once followed', async () => {
    const tree = await mount(<Probe />);
    await bump(BUMPS_FOR_HELP);
    expect(latest.showDemo).toBe(false);
    await wait(IDLE);
    expect(latest.showDemo).toBe(true);
    expect(mockSpeak).not.toHaveBeenCalled();

    await act(async () => latest.onStep());
    expect(latest.showDemo).toBe(false);
    await wait(IDLE);
    expect(latest.showDemo).toBe(false);
    act(() => tree.unmount());
  });

  it('shows the hand straight away while the child keeps hitting walls', async () => {
    const tree = await mount(<Probe />);
    await bump(BUMPS_NOW);
    expect(latest.showDemo).toBe(true);
    act(() => tree.unmount());
  });

  it('starts counting again on a new maze', async () => {
    const tree = await mount(<Probe />);
    await bump(BUMPS_FOR_HELP);
    await act(async () => tree.update(<Probe mazeKey={2} />));
    await wait(IDLE);
    expect(latest.showDemo).toBe(false);
    act(() => tree.unmount());
  });
});
