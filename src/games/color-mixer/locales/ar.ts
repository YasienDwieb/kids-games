import type { GameTranslations } from './en';

export const ar: GameTranslations = {
  meta: {
    name: 'خلّاط الألوان',
    shortName: 'الألوان',
    description: 'امزج الألوان واكتشف ألواناً جديدة!',
  },

  title: 'خلّاط الألوان',
  // Spoken prompt for a mystery colour (docs/VOICE.md).
  say: {
    paint: 'لَوِّنْها بِهذا اللَّون!',
  },
  defaultSavedName: 'لوني',

  mode: {
    freeplay: 'اللعب الحر',
    challenges: 'التحديات',
  },

  header: {
    myColors: 'ألواني',
  },

  actions: {
    undo: '↩️ تراجع',
    clear: '🗑️ مسح',
    save: '💾 حفظ',
  },

  mixingZone: {
    dragHint: 'اِسْحَبْ لَوْنًا إِلى الوِعاء!',
  },

  colors: {
    red: 'أحمر',
    yellow: 'أصفر',
    blue: 'أزرق',
    orange: 'برتقالي',
    green: 'أخضر',
    purple: 'بنفسجي',
    brown: 'بني',
    white: 'أبيض',
    black: 'أسود',
    pink: 'وردي',
    lightBlue: 'أزرق فاتح',
  },

  challenge: {
    makeThisColor: 'اِصنعْ هذا اللون:',
  },

  discovery: {
    title: 'لون جديد!',
  },

  collection: {
    done: 'تمّ',
    deleteLabel: 'حذف',
  },
};
