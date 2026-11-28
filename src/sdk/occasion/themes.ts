import type { ImageSourcePropType } from 'react-native';
import type { OccasionId } from '@/sdk/content/types';
import { getEmojiImage } from '@/sdk/assets/emoji/images';
import { BACKDROP } from '@/sdk/flow/backdrop/config';
import type { BackdropConfig } from '@/sdk/flow/backdrop/types';

export type DecorSpot = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

/** One picture laid over the Home backdrop. `size` is a fraction of the short screen side. */
export type HomeDecor = { emoji: string; spot: DecorSpot; size: number };

/**
 * An occasion's skin: pictures over Home, the journey's backdrop, the wardrobe
 * gift and the greeting. Placeholder art uses bundled Noto emoji until
 * illustrated sets land (swap `homeDecor` / `journeyBackdrop` sources only).
 */
export type OccasionTheme = {
  id: OccasionId;
  homeDecor: readonly HomeDecor[];
  /** Must pass `validateBackdropConfig`. */
  journeyBackdrop: BackdropConfig;
  /** Wardrobe item id (an `Outfit` with `occasion: id`). */
  outfit: string;
};

const img = (emoji: string): ImageSourcePropType => {
  const source = getEmojiImage(emoji);
  if (!source) throw new Error(`occasion: no bundled image for ${emoji}`);
  return source;
};

/** The default backdrop's hills and clouds, re-tinted, with a sparse sky layer on top. */
function backdrop(paletteRamp: readonly string[], sky: string[]): BackdropConfig {
  const [clouds, ...hills] = BACKDROP.layers;
  return {
    ...BACKDROP,
    paletteRamp,
    layers: [
      {
        ...clouds,
        elements: sky.map((emoji, i) => ({
          source: img(emoji),
          width: i === 0 ? 72 : 36,
          height: i === 0 ? 72 : 36,
          left: 120 + i * 230,
          bottom: i === 0 ? 220 : 250 - (i % 2) * 40,
        })),
      },
      ...hills,
    ],
  };
}

export const OCCASION_THEMES: Record<OccasionId, OccasionTheme> = {
  // Dusk violet into lantern gold: the evenings of Ramadan.
  ramadan: {
    id: 'ramadan',
    homeDecor: [
      { emoji: '🌙', spot: 'top-end', size: 0.2 },
      { emoji: '⭐', spot: 'top-start', size: 0.08 },
      { emoji: '⭐', spot: 'bottom-end', size: 0.06 },
    ],
    journeyBackdrop: backdrop(['#E9E4F7', '#EDE3F2', '#FBEFD6'], ['🌙', '⭐', '⭐', '⭐']),
    outfit: 'crescent-moon',
  },
  // Bright morning of Eid: balloons and sweets.
  'eid-al-fitr': {
    id: 'eid-al-fitr',
    homeDecor: [
      { emoji: '🎈', spot: 'top-end', size: 0.16 },
      { emoji: '🍬', spot: 'bottom-end', size: 0.08 },
      { emoji: '⭐', spot: 'top-start', size: 0.08 },
    ],
    journeyBackdrop: backdrop(['#FDF1F6', '#F3F0FB', '#FFF4D9'], ['🎈', '⭐', '🎈', '⭐']),
    outfit: 'eid-balloon',
  },
  'eid-al-adha': {
    id: 'eid-al-adha',
    homeDecor: [
      { emoji: '🐑', spot: 'bottom-end', size: 0.16 },
      { emoji: '🌙', spot: 'top-end', size: 0.12 },
      { emoji: '⭐', spot: 'top-start', size: 0.08 },
    ],
    journeyBackdrop: backdrop(['#EEF6EA', '#F1F3E6', '#FCEFD8'], ['🌙', '⭐', '⭐']),
    outfit: 'eid-sheep',
  },
};
