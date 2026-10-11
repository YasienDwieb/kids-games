import AsyncStorage from '@react-native-async-storage/async-storage';
import { levelInfo, starsForLevel } from '../levels';
import { OUTFITS, unlocksAt } from '../outfits';
import { awardStars, onLevelUp, rewardsStore } from '@/sdk/rewards/store';

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
