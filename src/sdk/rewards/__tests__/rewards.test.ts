import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALL_STICKERS, STARS_PER_STICKER, STICKER_SETS, nextSticker, stickerEmoji } from '../stickers';
import { awardStars, markStickersSeen, onStickerUnlocked, rewardsStore } from '../store';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('sticker catalog', () => {
  it('has six stickers in every set and unique ids', () => {
    for (const glyphs of Object.values(STICKER_SETS)) expect(glyphs).toHaveLength(6);
    expect(new Set(ALL_STICKERS).size).toBe(ALL_STICKERS.length);
    expect(stickerEmoji('turbo-road:0')).toBe('🚗');
  });

  it("gives a game's own stickers first, then the general set, then anything", () => {
    expect(nextSticker('mouse-maze', [])).toBe('mouse-maze:0');
    const maze = STICKER_SETS['mouse-maze'].map((_, i) => `mouse-maze:${i}`);
    expect(nextSticker('mouse-maze', maze)).toBe('general:0');
    expect(nextSticker('unknown-game', [])).toBe('general:0');
    expect(nextSticker('mouse-maze', ALL_STICKERS)).toBeNull();
  });
});

describe('awardStars', () => {
  it(`unlocks a sticker every ${STARS_PER_STICKER} stars and marks it unseen`, async () => {
    const heard: string[] = [];
    const off = onStickerUnlocked((id) => heard.push(id));

    for (let i = 0; i < STARS_PER_STICKER - 1; i++) {
      expect(await awardStars('count-and-pop')).toEqual([]);
    }
    expect(await awardStars('count-and-pop')).toEqual(['count-and-pop:0']);
    off();

    const r = await rewardsStore.get();
    expect(r.stars).toBe(STARS_PER_STICKER);
    expect(r.stickers).toEqual(['count-and-pop:0']);
    expect(r.unseen).toEqual(['count-and-pop:0']);
    expect(heard).toEqual(['count-and-pop:0']);

    await markStickersSeen();
    expect((await rewardsStore.get()).unseen).toEqual([]);
  });

  it('never loses stars when awards race', async () => {
    await Promise.all(Array.from({ length: 10 }, () => awardStars('match-up')));
    const r = await rewardsStore.get();
    expect(r.stars).toBe(10);
    expect(r.stickers).toHaveLength(Math.floor(10 / STARS_PER_STICKER));
  });
});
