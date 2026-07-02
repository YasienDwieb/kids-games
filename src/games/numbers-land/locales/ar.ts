import type { GameTranslations } from './en';

// Arabic — meaningful & kid-friendly. "أرض الأرقام" = "Numbers Land".
// Number names carry tashkeel so device TTS reads them clearly. Digit GLYPHS
// are authored DATA in constants.ts — never translated here.
export const ar: GameTranslations = {
  meta: {
    name: 'أرض الأرقام',
    description: 'اسمع الرقم واعثر عليه!',
  },
  loading: 'نحضّر أرقامك…',
  hearFind: {
    which: 'أي رقم هذا؟',
  },
  speak: {
    carrier: '{{name}}',
  },
  a11y: {
    replay: 'اسمع الرقم مرة أخرى',
    choiceTile: 'رقم {{glyph}}',
  },
  levelSolved: {
    title: 'أحسنت!',
    next: 'الرقم التالي',
    finish: 'أكملت كل الأرقام!',
  },
  names: {
    '1': 'وَاحِد',
    '2': 'اِثنان',
    '3': 'ثَلاثة',
    '4': 'أَربَعة',
    '5': 'خَمسة',
    '6': 'سِتّة',
    '7': 'سَبعة',
    '8': 'ثَمانِية',
    '9': 'تِسعة',
    '10': 'عَشَرة',
  },
};
