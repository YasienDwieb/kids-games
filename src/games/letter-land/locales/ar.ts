import type { GameTranslations } from './en';

// Arabic — meaningful & kid-friendly, NOT literal machine translation.
// "أرض الحروف" = "Letter Land" (the natural, warm name for a letters world).
// Letter names + example words live in the shared `letters` namespace.
export const ar: GameTranslations = {
  meta: {
    name: 'أرض الحروف',
    description: 'اسمع الحرف واعثر عليه!',
  },
  loading: 'نحضّر حروفك…',
  hearFind: {
    listen: 'استمع…',
    tapAgain: 'اضغط لتسمعه مرة أخرى',
    which: 'أي حرف هذا؟',
  },
  // The letter NAME (names.*) is already a full spoken word (e.g. «لاَم»), so we
  // say just the name then the example word — «لاَم. ليمون» — with no extra
  // «حرف» prefix, matching the English "name. word" prompt.
  speak: {
    carrier: '{{name}}. {{word}}',
  },
  a11y: {
    replay: 'اسمع الحرف مرة أخرى',
    choiceTile: 'حرف {{glyph}}',
  },
  levelSolved: {
    title: 'أحسنت!',
    next: 'الحرف التالي',
    finish: 'أكملت كل الحروف!',
  },
};
