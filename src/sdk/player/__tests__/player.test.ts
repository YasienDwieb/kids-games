import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEmojiImage } from '@/sdk/assets/emoji/images';
import { levelInfo, starsForLevel } from '../levels';
import { BUDDIES } from '@/sdk/buddy';
import { OUTFITS, outfitFor, outfitsFor, unlocksAt } from '../outfits';
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
    expect(unlocksAt(2, 'mariam').length).toBeGreaterThan(0);
  });

  it('gives every buddy one item per level, so both progress the same', () => {
    const levels = (b: (typeof BUDDIES)[number]) => outfitsFor(b).map((o) => o.level);
    for (const b of BUDDIES) expect(new Set(levels(b)).size).toBe(levels(b).length);
    expect(levels('anas')).toEqual(levels('mariam'));
  });

  it('keeps side items to their buddy and swaps a saved one for its twin', () => {
    expect(outfitsFor('anas').map((o) => o.id)).not.toContain('flower');
    expect(outfitsFor('mariam').map((o) => o.id)).not.toContain('medal');
    expect(unlocksAt(10, 'anas').map((o) => o.id)).toEqual(['medal']);
    expect(outfitFor('flower', 'anas')?.id).toBe('parrot');
    expect(outfitFor('medal', 'mariam')?.id).toBe('bow');
    expect(outfitFor('crown', 'anas')?.id).toBe('crown');
    expect(outfitFor(null, 'anas')).toBeUndefined();
  });

  it('bundles every item\'s art, so stickers sit where Mascot places them', () => {
    for (const o of OUTFITS) expect(getEmojiImage(o.emoji)).toBeDefined();
  });

  it('pairs twins both ways at the same level', () => {
    for (const o of OUTFITS.filter((x) => x.twin)) {
      const twin = OUTFITS.find((x) => x.id === o.twin);
      expect(twin?.twin).toBe(o.id);
      expect(twin?.level).toBe(o.level);
      expect(twin?.buddy).not.toBe(o.buddy);
    }
  });
});
