import type { GameTranslations } from './en';

// Arabic strings — warm and playful for kids, not a literal translation.
// Western digits kept as-is. Emoji not translated.
export const ar: GameTranslations = {
  meta: {
    name: 'متاهة الفأر',
    description: 'حرّك الفأر ليجد الجبنة!',
  },
  hud: {
    level: 'المستوى {{level}}',
    hintLabel: 'أرني الطريق',
  },
  win: {
    title: 'وصلت!',
    nextMaze: 'المتاهة التالية',
  },
};
