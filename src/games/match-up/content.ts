/**
 * Match Up — the expandable content catalog.
 *
 * To grow the game: add more `MatchPair`s to a theme's `pairs` array, or drop in
 * a whole new `MatchTheme` object. Nothing else needs to change — `buildLevel`
 * samples from whatever lives here, and the flow adapter / level count follow.
 *
 * Each theme is ONE relationship (animal→food, worker→tool, …) so a round shows
 * a single clear prompt. A theme needs at least `max pairs per round` (4) entries.
 *
 * Pure data: no React, no UI. Color swatches use design-system tokens, never
 * raw hex (see CLAUDE.md design-system rule).
 */
import { ACCENTS, COLORS } from '@/sdk';
import type { MatchItem, MatchPair } from './types';

const e = (emoji: string): MatchItem => ({ kind: 'emoji', emoji });
const c = (color: string): MatchItem => ({ kind: 'color', color });
const pair = (top: MatchItem, bottom: MatchItem): MatchPair => ({ top, bottom });

export type MatchTheme = {
  readonly id: string;
  /** Translation key (relative to the game namespace). */
  readonly promptKey: string;
  readonly pairs: readonly MatchPair[];
};

export const THEMES: readonly MatchTheme[] = [
  {
    id: 'animal-food',
    promptKey: 'prompts.animalFood',
    pairs: [
      pair(e('🐶'), e('🦴')),
      pair(e('🐰'), e('🥕')),
      pair(e('🐭'), e('🧀')),
      pair(e('🐱'), e('🐟')),
      pair(e('🐻'), e('🍯')),
      pair(e('🐵'), e('🍌')),
      pair(e('🐼'), e('🎋')),
      pair(e('🐿️'), e('🌰')),
    ],
  },
  {
    id: 'worker-tool',
    promptKey: 'prompts.workerTool',
    pairs: [
      pair(e('👨‍🍳'), e('🍳')),
      pair(e('👮'), e('🚓')),
      pair(e('👨‍🚒'), e('🚒')),
      pair(e('👨‍⚕️'), e('💉')),
      pair(e('👨‍🌾'), e('🚜')),
      pair(e('👨‍🎨'), e('🖌️')),
      pair(e('👷'), e('🔨')),
      pair(e('🧑‍🚀'), e('🚀')),
    ],
  },
  {
    id: 'animal-home',
    promptKey: 'prompts.animalHome',
    pairs: [
      pair(e('🐦'), e('🪺')),
      pair(e('🐶'), e('🏠')),
      pair(e('🐴'), e('🛖')),
      pair(e('🐟'), e('🐚')),
      pair(e('🐝'), e('🌻')),
      pair(e('🕷️'), e('🕸️')),
      pair(e('🐻'), e('🏔️')),
      pair(e('🐌'), e('🍄')),
    ],
  },
  {
    id: 'color-fruit',
    promptKey: 'prompts.colorFruit',
    pairs: [
      pair(c(ACCENTS.coral.base), e('🍎')),
      pair(c(COLORS.gold), e('🍌')),
      pair(c(ACCENTS.orange.base), e('🍊')),
      pair(c(ACCENTS.purple.base), e('🍇')),
      pair(c(ACCENTS.green.base), e('🍐')),
      pair(c(ACCENTS.blue.base), e('🫐')),
    ],
  },
  {
    id: 'baby-animal',
    promptKey: 'prompts.babyAnimal',
    pairs: [
      pair(e('🐤'), e('🐔')),
      pair(e('🐶'), e('🐕')),
      pair(e('🐱'), e('🐈')),
      pair(e('🐛'), e('🦋')),
      pair(e('🐴'), e('🐎')),
      pair(e('🐰'), e('🐇')),
      pair(e('🐮'), e('🐄')),
    ],
  },
];
