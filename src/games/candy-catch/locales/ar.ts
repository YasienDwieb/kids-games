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
    score: 'النقاط {{score}}',
  },
  start: {
    title: 'التقط الحلويات!',
    subtitle: 'جيد: 🍬 🍭 🍪   مقزز: 🌶️ 💣',
    tap: 'المس للبدء',
  },
  win: {
    title: 'لذيذ!',
    next: 'المستوى التالي',
    done: 'أحسنت!',
  },
  lose: {
    title: 'أوبس!',
    subtitle: 'انتهت القلوب',
    retry: 'حاول مرة أخرى',
  },
  a11y: {
    basket: 'السلة، اسحب للتحريك',
    hint: 'ساحة اللعب',
  },
};
