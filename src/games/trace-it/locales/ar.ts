import type { GameTranslations } from './en';

export const ar: GameTranslations = {
  meta: {
    name: 'أتتبّع وأكتب',
    description: 'تتبّع الحروف والأرقام بإصبعك!',
  },
  tabs: {
    warmup: 'إحماء',
    latin: 'ABC',
    arabic: 'أ ب ت',
    numbers: 'أرقام',
  },
  picker: {
    next: 'التالي',
  },
  round: {
    guided: 'اتبع السهم!',
    solo: 'والآن وحدك!',
    dots: 'ضع النقاط!',
    warmup: 'ساعده ليصل!',
  },
  sticker: {
    iCanWrite: 'أستطيع كتابة {{glyph}}!',
    iCanDraw: 'أستطيع رسم {{glyph}}!',
  },
  // Same voweled spellings as numbers-land, so both share one clip (docs/VOICE.md).
  digits: {
    d0: 'صِفْر',
    d1: 'وَاحِد',
    d2: 'اِثنان',
    d3: 'ثَلاثة',
    d4: 'أَربَعة',
    d5: 'خَمسة',
    d6: 'سِتّة',
    d7: 'سَبعة',
    d8: 'ثَمانِية',
    d9: 'تِسْعة',
  },
  warmup: {
    line: 'خط مستقيم',
    zigzag: 'خطٌ متعرّج',
    wave: 'مَوْجَةْ',
    arch: 'جسور',
    loops: 'حلقات',
    spiral: 'حلزون',
    circle: 'دائرة',
  },
  a11y: {
    replay: 'اسمعها مرة أخرى',
    tile: '{{label}}',
    board: 'لوحة التتبّع',
  },
};
