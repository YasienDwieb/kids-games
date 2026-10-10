import AsyncStorage from '@react-native-async-storage/async-storage';
import { levelInfo, starsForLevel } from '../levels';
import { OUTFITS, unlocksAt } from '../outfits';
import {
  applyStars,
  buildQuests,
  chestReady,
  claimQuest,
  ensureQuests,
  openChest,
  questStore,
  type QuestDay,
} from '../quests';
import { awardStars, onLevelUp, rewardsStore } from '@/sdk/rewards/store';

const GAMES = ['a', 'b', 'c', 'd', 'e'];

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('levels', () => {
  it('starts at level 1 and gets a little steeper each level', () => {
    expect(levelInfo(0)).toEqual({ level: 1, into: 0, span: 5, progress: 0 });
    expect(starsForLevel(2)).toBe(5);
    expect(starsForLevel(3)).toBe(11);
    expect(levelInfo(5).level).toBe(2);
    expect(levelInfo(10)).toMatchObject({ level: 2, into: 5, span: 6 });
  });

  it('fires a level-up when an award crosses a threshold', async () => {
    const heard: number[] = [];
    const off = onLevelUp((l) => heard.push(l));
    await rewardsStore.set({ ...(await rewardsStore.get()), stars: 4 });
    await awardStars('a');
    off();
    expect(heard).toEqual([2]);
  });
});

describe('outfits', () => {
  it('has unique ids and something to unlock from level 2', () => {
    expect(new Set(OUTFITS.map((o) => o.id)).size).toBe(OUTFITS.length);
    expect(unlocksAt(2).length).toBeGreaterThan(0);
  });
});

describe('daily quests', () => {
  it('builds the same three quests for the same day', () => {
    const a = buildQuests('2026-10-09', GAMES);
    expect(a).toHaveLength(3);
    expect(buildQuests('2026-10-09', GAMES)).toEqual(a);
    const games = a.filter((q) => q.kind === 'game-stars').map((q) => q.gameId);
    expect(new Set(games).size).toBe(2);
  });

  it('counts stars toward matching quests and caps at the target', () => {
    const day: QuestDay = {
      date: 'd',
      played: [],
      chestOpened: false,
      quests: [
        { id: 'g0', kind: 'game-stars', gameId: 'a', target: 3, progress: 0, claimed: false },
        { id: 'v', kind: 'variety', target: 3, progress: 0, claimed: false },
        { id: 's', kind: 'stars', target: 5, progress: 4, claimed: false },
      ],
    };
    const next = applyStars(applyStars(day, 'a', 2), 'b', 2);
    expect(next.quests.map((q) => q.progress)).toEqual([2, 2, 5]);
  });

  it('records wins, then claims, then opens the chest once', async () => {
    const day = await ensureQuests();
    const finished = day.quests.map((q) => ({ ...q, progress: q.target }));
    await questStore.set({ ...day, quests: finished });

    expect(await claimQuest('missing')).toBe(false);
    for (const q of finished) expect(await claimQuest(q.id)).toBe(true);
    expect(await claimQuest(finished[0].id)).toBe(false);
    expect(chestReady(await questStore.get())).toBe(true);
    expect(await openChest()).toBe(true);
    expect(await openChest()).toBe(false);
    // Let the bonus awards land.
    await awardStars('quests', 0);
    expect((await rewardsStore.get()).stars).toBe(finished.length + 3);
  });
});
