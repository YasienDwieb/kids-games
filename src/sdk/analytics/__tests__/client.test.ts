import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { DEFAULT_SETTINGS, settingsStore } from '@/sdk/settings/store';
import { awardStars } from '@/sdk/rewards/store';
import {
  markSessionEnd,
  noteHintLadder,
  noteMiss,
  noteRoundStart,
  resetAnalytics,
  setupAnalytics,
  startPlaySession,
  track,
  trackRound,
} from '../client';
import type { AnalyticsSink, EventProps } from '../types';

function memorySink() {
  const events: Array<[string, EventProps]> = [];
  const enabled: boolean[] = [];
  const sink: AnalyticsSink = {
    name: 'memory',
    track: (e, p) => events.push([e, p]),
    setEnabled: (on) => enabled.push(on),
    flush: async () => undefined,
  };
  return { sink, events, enabled, names: () => events.map(([e]) => e) };
}

beforeEach(async () => {
  resetAnalytics();
  await AsyncStorage.clear();
});

it('queues events tracked before setup and sends them once ready', async () => {
  const m = memorySink();
  track('app_open', {});
  expect(m.events).toHaveLength(0);
  await setupAnalytics([m.sink], { appVersion: '1.2.3' });
  expect(m.names()).toEqual(['app_open']);
  expect(m.enabled).toEqual([true]);
});

it('adds the boot context and settings to every event', async () => {
  await settingsStore.set({ ...DEFAULT_SETTINGS, language: 'ar', ageBand: 'early' });
  const m = memorySink();
  await setupAnalytics([m.sink], { appVersion: '1.2.3', platform: 'android' });
  track('journey_done', { total: 12 });
  expect(m.events[0][1]).toEqual({
    appVersion: '1.2.3',
    platform: 'android',
    language: 'ar',
    ageBand: 'early',
    appMode: 'free',
    total: 12,
  });
});

it('fans out to every sink, and one failing sink does not stop the others', async () => {
  const a = memorySink();
  const broken: AnalyticsSink = {
    ...memorySink().sink,
    track: () => {
      throw new Error('boom');
    },
  };
  const b = memorySink();
  await setupAnalytics([a.sink, broken, b.sink]);
  track('app_open', {});
  expect(a.names()).toEqual(['app_open']);
  expect(b.names()).toEqual(['app_open']);
});

it('sends nothing while the parent has turned sharing off, and tells the sinks', async () => {
  await settingsStore.set({ ...DEFAULT_SETTINGS, analyticsEnabled: false });
  const m = memorySink();
  track('app_open', {});
  await setupAnalytics([m.sink]);
  track('journey_done', { total: 1 });
  expect(m.events).toHaveLength(0);
  expect(m.enabled).toEqual([false]);

  await settingsStore.set({ ...DEFAULT_SETTINGS, analyticsEnabled: true });
  track('journey_done', { total: 2 });
  expect(m.names()).toEqual(['journey_done']);
  expect(m.enabled).toEqual([false, true]);
});

it('reports a play session with its rounds and mode', async () => {
  const m = memorySink();
  await setupAnalytics([m.sink]);
  const end = startPlaySession('simple-pairs', 'free');
  trackRound('simple-pairs', 1);
  trackRound('simple-pairs', 2);
  end();
  expect(m.names()).toEqual(['game_start', 'round_complete', 'round_complete', 'game_end']);
  expect(m.events[2][1]).toMatchObject({ gameId: 'simple-pairs', mode: 'free', stars: 2 });
  expect(m.events[3][1]).toMatchObject({ gameId: 'simple-pairs', mode: 'free', rounds: 2 });
  expect(typeof m.events[3][1].durationSec).toBe('number');
});

it('counts every star award as a finished round', async () => {
  const m = memorySink();
  await setupAnalytics([m.sink]);
  const end = startPlaySession('journey', 'journey');
  await awardStars('count-and-pop');
  end();
  expect(m.events[1]).toEqual(['round_complete', expect.objectContaining({
    gameId: 'count-and-pop',
    mode: 'journey',
    stars: 1,
  })]);
});

it('says why a session ended: back by default, otherwise the first mark wins', async () => {
  const m = memorySink();
  await setupAnalytics([m.sink]);
  startPlaySession('match-up', 'free')();
  const end = startPlaySession('match-up', 'free');
  markSessionEnd('complete');
  markSessionEnd('error');
  end();
  const ends = m.events.filter(([e]) => e === 'game_end').map(([, p]) => p);
  expect(ends[0]).toMatchObject({ endedBy: 'back', secondsToFirstRound: null, backgrounded: false });
  expect(ends[1]).toMatchObject({ endedBy: 'complete' });
});

it('marks nothing once the session has ended', async () => {
  const m = memorySink();
  await setupAnalytics([m.sink]);
  startPlaySession('match-up', 'free')();
  markSessionEnd('complete');
  startPlaySession('match-up', 'free')();
  expect(m.events.filter(([e]) => e === 'game_end').map(([, p]) => p.endedBy)).toEqual(['back', 'back']);
});

it('times the first finished round', async () => {
  const m = memorySink();
  await setupAnalytics([m.sink]);
  jest.useFakeTimers({ now: 1_000_000 });
  const original = Object.getOwnPropertyDescriptor(AppState, 'currentState');
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
  try {
    const end = startPlaySession('trace-it', 'free');
    jest.setSystemTime(1_012_400);
    trackRound('trace-it', 3);
    jest.setSystemTime(1_030_000);
    trackRound('trace-it', 3);
    end();
  } finally {
    if (original) Object.defineProperty(AppState, 'currentState', original);
    jest.useRealTimers();
  }
  expect(m.events.at(-1)![1]).toMatchObject({ secondsToFirstRound: 12, durationSec: 30 });
});

it('reports misses and the hint reached only while a hint ladder is mounted', async () => {
  const m = memorySink();
  await setupAnalytics([m.sink]);
  trackRound('turbo-road', 1);
  const off = noteHintLadder();
  noteRoundStart();
  trackRound('shape-detective', 3);
  noteMiss();
  noteMiss();
  trackRound('shape-detective', 1);
  noteMiss();
  noteRoundStart();
  noteMiss();
  noteMiss();
  noteMiss();
  trackRound('shape-detective', 1);
  off();
  trackRound('turbo-road', 1);
  expect(m.events.map(([, p]) => [p.misses, p.hint])).toEqual([
    [null, null],
    [0, 'none'],
    [2, 'highlight'],
    [3, 'reveal'],
    [null, null],
  ]);
});
