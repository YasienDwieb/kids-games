import { OCCASION_THEMES } from '../themes';
import { occasionPhrase } from '../phrase';
import { validateBackdropConfig } from '@/sdk/flow/backdrop/validate';
import { OCCASION_IDS } from '@/sdk/content/types';
import { OUTFITS, isUnlocked, unlocksAt, outfitById } from '@/sdk/player/outfits';
import { getEmojiImage } from '@/sdk/assets/emoji/images';

describe('occasion themes', () => {
  // protects=every occasion has a journey backdrop the parallax renderer accepts; fails_when=a theme backdrop breaks validateBackdropConfig; no_claim=does not judge how it looks
  it.each(OCCASION_IDS)('%s backdrop passes validation', (id) => {
    expect(() => validateBackdropConfig(OCCASION_THEMES[id].journeyBackdrop)).not.toThrow();
  });

  // protects=Home decor never falls back to device emoji fonts; fails_when=a decor emoji has no bundled image; no_claim=none beyond protects
  it.each(OCCASION_IDS)('%s decor uses bundled emoji images', (id) => {
    OCCASION_THEMES[id].homeDecor.forEach((d) => expect(getEmojiImage(d.emoji)).toBeDefined());
  });

  // protects=each occasion's gift is a real wardrobe item tagged with that occasion; fails_when=the theme names a missing or mis-tagged outfit; no_claim=none beyond protects
  it.each(OCCASION_IDS)('%s gift is an outfit for that occasion', (id) => {
    const item = outfitById(OCCASION_THEMES[id].outfit);
    expect(item?.occasion).toBe(id);
    expect(getEmojiImage(item!.emoji)).toBeDefined();
  });

  // protects=the greeting exists in both languages; fails_when=a language returns an empty phrase; no_claim=clip coverage is voiceClips.test.ts
  it.each(OCCASION_IDS)('%s greeting is non-empty in en and ar', (id) => {
    expect(occasionPhrase(id, 'en').trim()).not.toBe('');
    expect(occasionPhrase(id, 'ar').trim()).not.toBe('');
  });
});

describe('occasion gifts in the wardrobe', () => {
  const gifts = OUTFITS.filter((o) => o.occasion);

  // protects=gifts open only once given, whatever the level; fails_when=a high level unlocks an ungiven gift or a given one stays locked; no_claim=none beyond protects
  it('unlocks a gift only when given', () => {
    gifts.forEach((g) => {
      expect(isUnlocked(g, 99)).toBe(false);
      expect(isUnlocked(g, 1, [g.id])).toBe(true);
    });
  });

  // protects=the level-up card never shows an occasion gift; fails_when=unlocksAt(0) or any level returns a gift; no_claim=none beyond protects
  it('never appears on the level-up card', () => {
    for (let level = 0; level <= 20; level++) {
      expect(unlocksAt(level, 'mariam').some((o) => o.occasion)).toBe(false);
      expect(unlocksAt(level, 'anas').some((o) => o.occasion)).toBe(false);
    }
  });

  // protects=level items behave as before; fails_when=passing gifts changes level unlocking; no_claim=none beyond protects
  it('leaves level items unchanged', () => {
    const crown = outfitById('crown')!;
    expect(isUnlocked(crown, crown.level - 1, ['crown'])).toBe(false);
    expect(isUnlocked(crown, crown.level)).toBe(true);
  });
});
