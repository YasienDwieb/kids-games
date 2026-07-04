// Arabic strings — kid-friendly, warm, natural. Western digits for numbers.
// Typed against GameTranslations so TS enforces matching keys (not values).
import type { GameTranslations } from './en';

export const ar: GameTranslations = {
  meta: {
    name: 'رحلة الحيوانات',
    description: 'اسمع وابحث عن الحيوانات!',
  },
  loading: 'نُجهّز الحيوانات…',
  hearName: {
    listen: 'اسمع…',
    tapAgain: 'اضغط لتسمعه مرة أخرى',
    which: 'أي حيوان هذا؟',
  },
  whichSound: {
    listen: 'اسمع…',
    tapAgain: 'اضغط لتسمعه مرة أخرى',
    which: 'أي حيوان يُصدر هذا الصوت؟',
  },
  a11y: {
    replay: 'انطق اسم الحيوان مرة أخرى',
    replaySound: 'شغّل صوت الحيوان مرة أخرى',
    choiceTile: 'اختر {{name}}',
    choiceTileGeneric: 'اختر هذا الحيوان',
  },
  names: {
    lion: 'أسد',
    elephant: 'فيل',
    cow: 'بقرة',
    dog: 'كلب',
    cat: 'قطة',
    frog: 'ضفدع',
    horse: 'حصان',
    sheep: 'خروف',
    rooster: 'ديك',
    duck: 'بطة',
    bird: 'عصفور',
    bee: 'نحلة',
  },
  levelSolved: {
    title: 'أحسنت!',
    next: 'الحيوان التالي',
    finish: 'أنهيت كل شيء!',
  },
};
