import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createAudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { stopSpeech, useSpeech } from '../useSpeech';
import { clipKey } from '../clipKey';
import { STALL_MS } from '@/sdk/audio/releasePlayer';

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));
jest.mock('../clips.generated', () => ({ CLIPS: { 'ar:كَاف. كُرَة': 1, 'en:Q. Queen': 2 } }));

type Api = ReturnType<typeof useSpeech>;
type Player = {
  play: jest.Mock;
  pause: jest.Mock;
  seekTo: jest.Mock;
  remove: jest.Mock;
  release: jest.Mock;
  addListener: jest.Mock;
};

const mounted: ReactTestRenderer[] = [];

function mount(): { api: Api; tree: ReactTestRenderer } {
  let api!: Api;
  function Probe() {
    api = useSpeech();
    return null;
  }
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(<Probe />);
  });
  mounted.push(tree);
  return { api, tree };
}

// useSpeech caches one player per clip for the app's lifetime, so record each
// player as it is created rather than reading this test's mock calls.
const created = new Map<number, Player>();
const makePlayer = (createAudioPlayer as jest.Mock).getMockImplementation()!;
(createAudioPlayer as jest.Mock).mockImplementation((module: number) => {
  const player = makePlayer(module);
  created.set(module, player);
  return player;
});
const playerFor = (module: number): Player => created.get(module)!;

beforeEach(() => jest.clearAllMocks());

// The clip is module state; unmounting releases it so tests can't share a player.
afterEach(() => {
  act(() => mounted.splice(0).forEach((tree) => tree.unmount()));
});

it('plays the clip and skips TTS when a clip exists', async () => {
  const { api } = mount();
  await act(() => api.speak('Q. Queen', { language: 'en' }));
  expect(playerFor(2).play).toHaveBeenCalled();
  expect(Speech.speak).not.toHaveBeenCalled();
});

it('keys on options.language, not the app language', async () => {
  const { api } = mount();
  await act(() => api.speak('كَاف. كُرَة', { language: 'ar' }));
  expect(playerFor(1).play).toHaveBeenCalled();
});

it('falls back to device TTS without a clip', async () => {
  const { api } = mount();
  await act(() => api.speak('Hello', { language: 'en' }));
  expect(Speech.speak).toHaveBeenCalledWith('Hello', expect.objectContaining({ language: 'en-US' }));
  expect(createAudioPlayer).not.toHaveBeenCalled();
});

it('a new speak stops the previous clip', async () => {
  const { api } = mount();
  await act(() => api.speak('Q. Queen', { language: 'en' }));
  await act(() => api.speak('كَاف. كُرَة', { language: 'ar' }));
  const first = playerFor(2);
  const second = playerFor(1);
  expect(first.pause).toHaveBeenCalled();
  expect(first.pause.mock.invocationCallOrder[0]).toBeLessThan(second.play.mock.invocationCallOrder[0]);
});

it('unmount stops a playing clip', async () => {
  const { api, tree } = mount();
  await act(() => api.speak('Q. Queen', { language: 'en' }));
  act(() => tree.update(<></>));
  expect(playerFor(2).pause).toHaveBeenCalled();
});

it('switching clips releases the previous player', async () => {
  const { api } = mount();
  await act(() => api.speak('Q. Queen', { language: 'en' }));
  const first = playerFor(2);
  await act(() => api.speak('كَاف. كُرَة', { language: 'ar' }));
  expect(first.remove).toHaveBeenCalled();
  expect(first.release).toHaveBeenCalled(); // remove() alone keeps the native track
});

it('replaying the same clip reuses its player from the start', async () => {
  const { api } = mount();
  await act(() => api.speak('Q. Queen', { language: 'en' }));
  const player = playerFor(2);
  await act(() => api.speak('Q. Queen', { language: 'en' }));
  expect(playerFor(2)).toBe(player);
  expect(player.release).not.toHaveBeenCalled();
  expect(player.seekTo).toHaveBeenLastCalledWith(0);
  expect(player.play).toHaveBeenCalledTimes(2);
});

it('unmount releases the clip player', async () => {
  const { api, tree } = mount();
  await act(() => api.speak('كَاف. كُرَة', { language: 'ar' }));
  act(() => tree.update(<></>));
  expect(playerFor(1).release).toHaveBeenCalled();
});

describe('a clip that fails natively (play() does not throw)', () => {
  const fail = (player: Player) => {
    const [, onStatus] = player.addListener.mock.calls[0];
    act(() => onStatus({ error: 'AudioTrack init failed' }));
  };

  it('says the line with the device voice', async () => {
    const { api } = mount();
    await act(() => api.speak('Q. Queen', { language: 'en' }));
    fail(playerFor(2));
    expect(Speech.speak).toHaveBeenCalledWith('Q. Queen', expect.objectContaining({ language: 'en-US' }));
  });

  it('drops the dead player so the next speak builds a fresh one', async () => {
    const { api } = mount();
    await act(() => api.speak('Q. Queen', { language: 'en' }));
    const dead = playerFor(2);
    fail(dead);
    expect(dead.release).toHaveBeenCalled();
    await act(() => api.speak('Q. Queen', { language: 'en' }));
    expect(playerFor(2)).not.toBe(dead);
    expect(playerFor(2).play).toHaveBeenCalled();
  });

  it('gives a clip stuck in buffering to the device voice', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    try {
      const stuck = () => {
        const player = makePlayer(2);
        player.isBuffering = true;
        created.set(2, player);
        return player;
      };
      (createAudioPlayer as jest.Mock).mockImplementationOnce(stuck);
      const { api } = mount();
      await act(() => api.speak('Q. Queen', { language: 'en' }));
      expect(Speech.speak).not.toHaveBeenCalled();
      act(() => {
        jest.advanceTimersByTime(STALL_MS);
      });
      expect(Speech.speak).toHaveBeenCalledWith('Q. Queen', expect.objectContaining({ language: 'en-US' }));
      expect(playerFor(2).release).toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('stays quiet after the screen has gone', async () => {
    const { api, tree } = mount();
    await act(() => api.speak('Q. Queen', { language: 'en' }));
    const dead = playerFor(2);
    act(() => tree.update(<></>));
    fail(dead);
    expect(Speech.speak).not.toHaveBeenCalled();
  });
});

it('falls back to device TTS when the clip cannot play', async () => {
  (createAudioPlayer as jest.Mock).mockImplementationOnce(() => {
    throw new Error('decoder unavailable');
  });
  const { api } = mount();
  await act(() => api.speak('Q. Queen', { language: 'en' }));
  expect(Speech.speak).toHaveBeenCalledWith('Q. Queen', expect.objectContaining({ language: 'en-US' }));
});

it('stopSpeech() stops the playing clip from outside the hook', async () => {
  const { api } = mount();
  await act(() => api.speak('Q. Queen', { language: 'en' }));
  playerFor(2).pause.mockClear();
  stopSpeech();
  expect(playerFor(2).pause).toHaveBeenCalled();
  expect(Speech.stop).toHaveBeenCalled();
});

it('clipKey normalizes to NFC and trims', () => {
  // أ decomposes to ا + hamza under NFD.
  const nfd = ' أَلِف. أَسَد '.normalize('NFD');
  expect(nfd).not.toBe(' أَلِف. أَسَد ');
  expect(clipKey('ar', nfd)).toBe('ar:أَلِف. أَسَد');
});
