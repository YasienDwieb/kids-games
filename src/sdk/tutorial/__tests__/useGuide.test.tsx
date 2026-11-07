import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import { useGuide } from '../useGuide';

const mockSpeak = jest.fn();
jest.mock('../../speech/useSpeech', () => ({ useSpeech: () => ({ speak: mockSpeak, stop: jest.fn() }) }));

let latest: ReturnType<typeof useGuide>;

function Probe({ roundKey = 1, active = true }: { roundKey?: number; active?: boolean }) {
  latest = useGuide({ id: 'demo-game', phrase: 'How many?', roundKey, active });
  return <Text>{String(latest.showDemo)}</Text>;
}

beforeEach(async () => {
  jest.useFakeTimers();
  mockSpeak.mockClear();
  await AsyncStorage.clear();
});
afterEach(() => jest.useRealTimers());

const mount = async (el: React.ReactElement) => {
  let tree!: ReturnType<typeof create>;
  await act(async () => {
    tree = create(el);
  });
  return tree;
};

it('says the prompt each round, and not while inactive', async () => {
  const tree = await mount(<Probe />);
  expect(mockSpeak).toHaveBeenCalledTimes(1);
  await act(async () => tree.update(<Probe roundKey={2} />));
  expect(mockSpeak).toHaveBeenCalledTimes(2);
  await act(async () => tree.update(<Probe roundKey={3} active={false} />));
  expect(mockSpeak).toHaveBeenCalledTimes(2);
  act(() => tree.unmount());
});

it('shows the demo until the first touch, then only when idle, and repeats the prompt', async () => {
  const tree = await mount(<Probe />);
  expect(latest.showDemo).toBe(true);
  await act(async () => latest.poke());
  expect(latest.showDemo).toBe(false);

  mockSpeak.mockClear();
  await act(async () => {
    jest.advanceTimersByTime(9000);
  });
  expect(latest.showDemo).toBe(true);
  expect(mockSpeak).toHaveBeenCalledTimes(1);
  act(() => tree.unmount());
});

it('never shows the demo while inactive', async () => {
  const tree = await mount(<Probe active={false} />);
  expect(latest.showDemo).toBe(false);
  act(() => tree.unmount());
});
