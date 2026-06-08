import type { CoreTranslations } from './en';

// Arabic core strings — written to feel warm and natural for kids, not a
// literal translation. Scores/counts stay in Western digits.
export const ar: CoreTranslations = {
  common: {
    back: 'رجوع',
    pause: 'إيقاف مؤقت',
    settings: 'الإعدادات',
    done: 'تمّ',
    cancel: 'إلغاء',
    save: 'حفظ',
    playAgain: 'العب مرّة ثانية',
    tryAgain: 'حاول من جديد',
    restart: 'من البداية',
  },
  home: {
    greeting: 'أهلاً يا بطل 👋',
    title: 'يلّا نلعب!',
    all: 'الكل',
    empty: 'ألعاب جديدة في الطريق! 🎈',
  },
  settings: {
    title: 'الإعدادات',
    sound: 'الأصوات',
    haptics: 'الاهتزاز',
    showGamesFor: 'ألعاب مناسبة لعمر',
    all: 'الكل',
    language: 'اللغة',
    version: 'ألعاب الأطفال · الإصدار 1.0',
    switching: 'جارٍ تغيير اللغة…',
  },
  player: {
    notFound: 'لم نجد هذه اللعبة',
  },
  resume: {
    welcomeBack: 'أهلاً بعودتك! 👋',
    continueLevel: 'تابع · المستوى {{level}}',
    startOver: 'ابدأ من جديد',
  },
  ageBands: {
    toddler: 'الصغار',
    preschool: 'ما قبل المدرسة',
    early: 'السنوات الأولى',
    kids: 'الكبار',
  },
};
