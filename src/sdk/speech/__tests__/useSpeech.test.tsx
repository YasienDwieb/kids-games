import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createAudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useSpeech } from '../useSpeech';
import { clipKey } from '../clipKey';

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));
jest.mock('../clips.generated', () => ({ CLIPS: { 'ar:كَاف. كُرَة': 1, 'en:Q. Queen': 2 } }));

type Api = ReturnType<typeof useSpeech>;
type Player = { play: jest.Mock; pause: jest.Mock; seekTo: jest.Mock };

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
  act(() => tree.unmount());
  expect(playerFor(2).pause).toHaveBeenCalled();
});

it('clipKey normalizes to NFC and trims', () => {
  // أ decomposes to ا + hamza under NFD.
  const nfd = ' أَلِف. أَسَد '.normalize('NFD');
  expect(nfd).not.toBe(' أَلِف. أَسَد ');
  expect(clipKey('ar', nfd)).toBe('ar:أَلِف. أَسَد');
});
