import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS, settingsStore } from '@/sdk/settings/store';
import { awardStars } from '@/sdk/rewards/store';
import {
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
