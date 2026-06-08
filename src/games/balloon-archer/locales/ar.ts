import type { GameTranslations } from './en';

// Arabic strings — warm and playful for kids 5–8. Western digits kept as-is.
export const ar: GameTranslations = {
  meta: {
    name: 'رامي البالونات',
    description: 'صوّب قوسك وفقّع البالونات!',
  },
  hud: {
    level: 'المستوى {{n}}',
  },
  overlay: {
    wonAll: 'فزت بكل المستويات!',
    niceShooting: 'رمية رائعة!',
    outOfArrows: 'نفدت السهام!',
    poppedCount: 'فقّعت {{popped}}/{{quota}} بالونة',
    playAgain: 'العب مرّة ثانية',
    nextLevel: '← المستوى التالي',
    tryAgain: 'حاول مجدداً',
  },
};
