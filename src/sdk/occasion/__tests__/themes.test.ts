import { OCCASION_THEMES } from '../themes';
import { occasionPhrase } from '../phrase';
import { validateBackdropConfig } from '@/sdk/flow/backdrop/validate';
import { OCCASION_IDS } from '@/sdk/content/types';
import { garlandPoints } from '../art/Garland';
import { getEmojiImage } from '@/sdk/assets/emoji/images';

describe('occasion themes', () => {
  // protects=every occasion has a journey backdrop the parallax renderer accepts; fails_when=a theme backdrop breaks validateBackdropConfig; no_claim=does not judge how it looks
  it.each(OCCASION_IDS)('%s backdrop passes validation', (id) => {
    expect(() => validateBackdropConfig(OCCASION_THEMES[id].journeyBackdrop)).not.toThrow();
  });

  // protects=the light string never falls back to device emoji fonts; fails_when=a garland emoji has no bundled image; no_claim=the drawn fanoos is checked by rendering in the Home test
  it.each(OCCASION_IDS)('%s garland uses bundled or drawn art', (id) => {
    const { garland, companion } = OCCASION_THEMES[id];
    expect(garland.length).toBeGreaterThan(0);
    [...garland, companion.art].forEach((a) => {
      if (a.kind === 'emoji') expect(getEmojiImage(a.emoji)).toBeDefined();
    });
  });

  // protects=the greeting exists in both languages; fails_when=a language returns an empty phrase; no_claim=clip coverage is voiceClips.test.ts
  it.each(OCCASION_IDS)('%s greeting is non-empty in en and ar', (id) => {
    expect(occasionPhrase(id, 'en').trim()).not.toBe('');
    expect(occasionPhrase(id, 'ar').trim()).not.toBe('');
  });
});

describe('garlandPoints', () => {
  // protects=the string droops symmetrically from the top corners and never lifts above the top edge; fails_when=points go negative, the curve is lopsided, or the middle doesn't sag the full amount; no_claim=does not check the drawn wire pixels
  it('sags evenly and stays below the top edge', () => {
    const pts = garlandPoints(1000, 40, 9);
    expect(pts).toHaveLength(9);
    pts.forEach((p) => expect(p.y).toBeGreaterThanOrEqual(0));
    expect(pts[0].y).toBeCloseTo(pts[8].y);
    expect(pts[4].y).toBeCloseTo(40);
    expect(pts[0].x).toBeCloseTo(1000 - pts[8].x);
  });
});
