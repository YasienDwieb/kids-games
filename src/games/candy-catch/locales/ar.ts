import type { GameTranslations } from './en';

// Arabic strings — warm and playful for kids, not a literal translation.
// Western digits kept as-is. Emoji not translated.
export const ar: GameTranslations = {
  meta: {
    name: 'التقاط الحلوى',
    description: 'حرّك السلة — التقط الحلويات وتجنّب الأشياء المقززة!',
  },
  hud: {
    level: 'المستوى {{level}}',
  },
  start: {
    title: 'اِلتَقِطِ الحَلوَياتِ!',
    tap: 'المس للبدء',
  },
  a11y: {
    basket: 'السلة، اسحب للتحريك',
    hint: 'ساحة اللعب',
  },
};
