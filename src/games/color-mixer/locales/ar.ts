import type { GameTranslations } from './en';

export const ar: GameTranslations = {
  meta: {
    name: 'خلّاط الألوان',
    shortName: 'الألوان',
    description: 'امزج الألوان واكتشف ألواناً جديدة!',
  },

  title: 'خلّاط الألوان',
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
    done: 'تم!',
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


  challengeHints: {
    c1: 'امزج لوناً ساخناً مع لون مشمس',
    c2: 'امزج لون السماء مع ضوء الشمس',
    c3: 'امزج النار مع الماء',
    c4: 'اجعل الأحمر أفتح',
    c5: 'اجعل الأزرق أفتح',
    c6: 'امزج كل الألوان الأساسية',
  },

  picker: {
    title: 'التحديات',
    complete: 'مكتملة',
    endless: 'ألوان غامضة أكثر',
    endlessSolved: 'حللت {{n}}',
    allDone: 'أتممت كل التحديات! 🏆',
    backButton: 'المزج ›',
    difficulty: {
      easy: 'مبتدئ',
      medium: 'متوسط',
      hard: 'متقدم',
    },
  },

  card: {
    mysteryColor: 'لون غامض',
  },

  challenge: {
    makeThisColor: 'اِصنعْ هذا اللون:',
    needHint: 'تريد تلميحاً؟',
    backLabel: 'رجوع للتحديات',
    meter: {
      perfect: 'ممتاز!',
      soClose: 'قريب جداً!',
      gettingWarmer: 'تقترب أكثر…',
      keepMixing: 'استمر في المزج!',
    },
    success: 'أحسنت!',
    next: 'التحدي التالي',
  },

  discovery: {
    title: 'لون جديد!',
  },


  collection: {
    done: 'تمّ',
    deleteLabel: 'حذف',
  },
};
