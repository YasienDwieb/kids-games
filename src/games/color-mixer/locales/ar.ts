import type { GameTranslations } from './en';

export const ar: GameTranslations = {
  meta: {
    name: 'خلّاط الألوان',
    description: 'امزج الألوان واكتشف ألواناً جديدة!',
  },

  title: 'خلّاط الألوان',

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
    dropHere: 'ضع الألوان هنا!',
  },

  palette: {
    colorsTitle: 'الألوان',
    savedTitle: 'محفوظة · اضغط أو اسحب للأعلى',
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

  discoveryHints: {
    orange: 'امزج لونَين دافئَين',
    green: 'امزج لوناً دافئاً مع لون بارد',
    purple: 'امزج لونَين قويَّين',
    brown: 'امزج الألوان الثلاثة الأساسية',
    pink: 'أضف الأبيض إلى لون دافئ',
    lightBlue: 'أضف الأبيض إلى الأزرق',
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
    makeThisColor: 'اصنع هذا اللون:',
    needHint: '💡 تريد تلميحاً؟',
    backLabel: 'رجوع للتحديات',
    meter: {
      perfect: 'ممتاز!',
      soClose: 'قريب جداً!',
      gettingWarmer: 'تقترب أكثر…',
      keepMixing: 'استمر في المزج!',
    },
    success: 'أحسنت!',
  },

  discovery: {
    title: 'لون جديد!',
    yay: 'رائع!',
  },

  namingDialog: {
    title: 'احفظ لونك! 🎨',
    label: 'سمِّ لونك:',
    placeholder: 'مثلاً: غروب الشمس',
    defaultName: 'لوني',
    cancel: 'إلغاء',
    save: 'حفظ',
  },

  collection: {
    title: 'ألواني',
    done: 'تمّ',
    famousShelf: 'الألوان المشهورة',
    found: 'مكتشَفة',
    creationsShelf: 'إبداعاتي',
    emptyCreations: 'امزج لوناً واضغط حفظ!',
    lockedName: '???',
    deleteLabel: 'حذف',
  },
};
