import type { GameTranslations } from './en';

// Arabic — meaningful & kid-friendly, NOT literal machine translation.
// Western digits for numbers; emoji left as-is.
export const ar: GameTranslations = {
  meta: {
    name: 'المحقق الصغير',
    description: 'اكتشف النمط وحل اللغز!',
  },
  loading: 'نجهّز لك اللغز…',
  // Pattern puzzle strings
  pattern: {
    instruction: 'ماذا يأتي بعد ذلك؟',
    choose: '— اختر —',
    optionLabel: 'خيار {{index}}: {{size}} {{kind}}',
  },
  // Level solve overlay
  levelSolved: {
    title: 'أحسنت!',
    next: 'المستوى التالي',
    finish: 'رائع، أنهيت اللعبة!',
  },
  // Odd-one-out puzzle strings
  oddOneOut: {
    instruction: 'أيّ شكل لا ينتمي إلى المجموعة؟',
    itemLabel: 'عنصر {{index}}: {{size}} {{kind}}',
  },
  // Sort puzzle strings
  sort: {
    instruction: 'رتّب كل شكل في مجموعته الصحيحة!',
    dropHere: 'ضعه هنا',
    binLabel: '{{name}} ({{count}} أشكال)',
    itemLabel: 'شكل {{index}}: {{size}} {{kind}}',
  },
  // Shape attribute labels — translated so screen-reader text is in Arabic.
  shapes: {
    kind: {
      circle: 'دائرة',
      square: 'مربع',
      triangle: 'مثلث',
      star: 'نجمة',
      heart: 'قلب',
      diamond: 'معيّن',
    },
    size: {
      small: 'صغير',
      medium: 'متوسط',
      large: 'كبير',
    },
    // Color names — warm, kid-friendly Arabic; Western digits for any numbers.
    color: {
      purple: 'بنفسجي',
      blue: 'أزرق',
      green: 'أخضر',
      coral: 'مرجاني',
      orange: 'برتقالي',
      pink: 'وردي',
    },
  },
};
