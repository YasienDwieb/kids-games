import type { ImageSourcePropType } from 'react-native';
import type { OccasionId } from '@/sdk/content/types';
import { getEmojiImage } from '@/sdk/assets/emoji/images';
import { BACKDROP } from '@/sdk/flow/backdrop/config';
import type { OccasionArt } from './art/ArtPiece';
import type { BackdropConfig } from '@/sdk/flow/backdrop/types';

export type { OccasionArt } from './art/ArtPiece';

/**
 * An occasion's skin: a string of lights across the top of Home and the
 * journey, the journey's backdrop, and a companion that stands beside the big
 * buddy (given once per occasion each year, shown on the gift card). Stand-in
 * art today (a drawn fanoos and bundled Noto emoji); an illustrated set swaps
 * in as `image` pieces.
 */
export type OccasionTheme = {
  id: OccasionId;
  /** Pieces hung along the light string, cycled across the screen width. */
  garland: readonly OccasionArt[];
  /** Must pass `validateBackdropConfig`. */
  journeyBackdrop: BackdropConfig;
  /** Stands beside the big buddy during the occasion. `id` names it (i18n `occasion.companions.<id>`). */
  companion: { id: string; art: OccasionArt };
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

const fanoos: OccasionArt = { kind: 'fanoos' };
const emoji = (e: string): OccasionArt => ({ kind: 'emoji', emoji: e });

export const OCCASION_THEMES: Record<OccasionId, OccasionTheme> = {
  // Dusk violet into lantern gold: the evenings of Ramadan.
  ramadan: {
    id: 'ramadan',
    garland: [fanoos, emoji('🌙'), emoji('⭐'), emoji('🌙')],
    journeyBackdrop: backdrop(['#E9E4F7', '#EDE3F2', '#FBEFD6'], ['🌙', '⭐', '⭐', '⭐']),
    companion: { id: 'fanoos', art: fanoos },
  },
  // Bright morning of Eid: balloons and sweets.
  'eid-al-fitr': {
    id: 'eid-al-fitr',
    garland: [emoji('🎈'), emoji('⭐'), emoji('🍬'), emoji('⭐')],
    journeyBackdrop: backdrop(['#FDF1F6', '#F3F0FB', '#FFF4D9'], ['🎈', '⭐', '🎈', '⭐']),
    companion: { id: 'eid-balloons', art: emoji('🎈') },
  },
  'eid-al-adha': {
    id: 'eid-al-adha',
    garland: [emoji('🌙'), emoji('⭐'), fanoos, emoji('⭐')],
    journeyBackdrop: backdrop(['#EEF6EA', '#F1F3E6', '#FCEFD8'], ['🌙', '⭐', '⭐']),
    companion: { id: 'eid-sheep', art: emoji('🐑') },
  },
};
