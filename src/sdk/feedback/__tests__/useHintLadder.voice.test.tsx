import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import { settingsStore, DEFAULT_SETTINGS } from '@/sdk/settings/store';
import { stopSpeech } from '@/sdk/speech/useSpeech';
import { CelebrationProvider, useCelebrate, type Celebrate } from '../Celebration';
import { MISS_SFX_GAP_MS } from '../missVoice';
import { useHintLadder, type UseHintLadderResult } from '../useHintLadder';

const mockSpeak = jest.fn();
let mockPlaying = false;
jest.mock('@/sdk/speech/useSpeech', () => ({
  ...jest.requireActual('@/sdk/speech/useSpeech'),
  useSpeech: () => ({ speak: mockSpeak, stop: jest.fn() }),
  stopSpeech: jest.fn(),
  isSpeaking: () => mockPlaying,
}));

let clock = Date.now();
let ladder: UseHintLadderResult;
let celebrate: Celebrate;
function Game({ voice }: { voice?: boolean }) {
  ladder = useHintLadder('round', { voice });
  celebrate = useCelebrate();
  return <Text>game</Text>;
}

async function mount(voice?: boolean) {
  let tree!: ReturnType<typeof create>;
  await act(async () => {
    tree = create(
      <CelebrationProvider>
        <Game voice={voice} />
      </CelebrationProvider>,
    );
  });
  return tree;
}

const miss = () => act(() => void ladder.miss());
const elapse = (ms: number) => act(() => void jest.advanceTimersByTime(ms));

beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime((clock += 60_000)); // past the voice window the last test booked
  mockSpeak.mockClear();
  (stopSpeech as jest.Mock).mockClear();
  mockPlaying = false;
  await settingsStore.set(DEFAULT_SETTINGS);
});
afterEach(() => jest.useRealTimers());

it('leaves the first miss to the sound', async () => {
  const tree = await mount();
  miss();
  elapse(5000);
  expect(mockSpeak).not.toHaveBeenCalled();
  tree.unmount();
});

it('cues from the second miss, after the sound, every time', async () => {
  const tree = await mount();
  miss();
  miss();
  expect(mockSpeak).not.toHaveBeenCalled();
  elapse(MISS_SFX_GAP_MS);
  expect(mockSpeak).toHaveBeenCalledTimes(1);
  expect(mockSpeak.mock.calls[0][0]).toBe('Try again!');
  for (let i = 0; i < 4; i++) {
    elapse(5000);
    miss();
    elapse(MISS_SFX_GAP_MS);
  }
  expect(mockSpeak).toHaveBeenCalledTimes(5);
  tree.unmount();
});

it('a new miss cuts the cue off instead of stacking on it', async () => {
  const tree = await mount();
  miss();
  miss();
  elapse(MISS_SFX_GAP_MS);
  mockPlaying = true;
  elapse(300);
  miss();
  expect(stopSpeech).toHaveBeenCalledTimes(1);
  elapse(MISS_SFX_GAP_MS);
  expect(mockSpeak).toHaveBeenCalledTimes(2);
  tree.unmount();
});

it('a miss before the cue starts replaces it', async () => {
  const tree = await mount();
  miss();
  miss();
  elapse(MISS_SFX_GAP_MS - 50);
  miss();
  elapse(MISS_SFX_GAP_MS);
  expect(mockSpeak).toHaveBeenCalledTimes(1);
  tree.unmount();
});

it("never cuts off or talks over a game's own prompt", async () => {
  const tree = await mount();
  mockPlaying = true;
  miss();
  miss();
  elapse(MISS_SFX_GAP_MS);
  expect(mockSpeak).not.toHaveBeenCalled();
  expect(stopSpeech).not.toHaveBeenCalled();
  tree.unmount();
});

it('respects the sound setting', async () => {
  await settingsStore.set({ ...DEFAULT_SETTINGS, soundEnabled: false });
  const tree = await mount();
  miss();
  miss();
  elapse(MISS_SFX_GAP_MS);
  expect(mockSpeak).not.toHaveBeenCalled();
  tree.unmount();
});

it('can be turned off where the game repeats its question', async () => {
  const tree = await mount(false);
  miss();
  miss();
  elapse(MISS_SFX_GAP_MS);
  expect(mockSpeak).not.toHaveBeenCalled();
  tree.unmount();
});

it('drops a pending cue when the child gets it right', async () => {
  const tree = await mount();
  miss();
  miss();
  act(() => void celebrate('small', { praise: false }));
  elapse(MISS_SFX_GAP_MS);
  expect(mockSpeak).not.toHaveBeenCalled();
  tree.unmount();
});
