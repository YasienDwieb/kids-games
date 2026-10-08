import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_PLAYTIME,
  EXTRA_MINUTES,
  addPlaytime,
  grantExtraTime,
  overLimit,
  playtimeStore,
  secondsThisWeek,
  secondsToday,
} from '../playtime';

beforeEach(async () => {
  await AsyncStorage.clear();
});

const day = (d: string) => new Date(`${d}T12:00:00`);

it('adds time to the day and the game', async () => {
  await addPlaytime('mouse-maze', 60, day('2026-10-08'));
  await addPlaytime('mouse-maze', 30, day('2026-10-08'));
  await addPlaytime('journey', 10, day('2026-10-07'));
  const p = await playtimeStore.get();
  expect(secondsToday(p, day('2026-10-08'))).toBe(90);
  expect(secondsThisWeek(p, day('2026-10-08'))).toBe(100);
  expect(p.games).toEqual({ 'mouse-maze': 90, journey: 10 });
});

it('applies the daily limit plus granted extra time', async () => {
  const now = day('2026-10-08');
  await addPlaytime('match-up', 15 * 60, now);
  let p = await playtimeStore.get();
  expect(overLimit(p, null, now)).toBe(false);
  expect(overLimit(p, 15, now)).toBe(true);
  await grantExtraTime(now);
  p = await playtimeStore.get();
  expect(p.extra['2026-10-08']).toBe(EXTRA_MINUTES);
  expect(overLimit(p, 15, now)).toBe(false);
  expect(overLimit(p, 15, day('2026-10-09'))).toBe(false);
});

it('keeps only the recent days', async () => {
  await playtimeStore.set({
    ...DEFAULT_PLAYTIME,
    days: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`2026-09-${String(i + 1).padStart(2, '0')}`, 1])),
  });
  await addPlaytime('x', 1, day('2026-10-08'));
  expect(Object.keys((await playtimeStore.get()).days)).toHaveLength(14);
});
