import type { GameTranslations } from './en';

export const ar: GameTranslations = {
  meta: {
    name: 'سباق السيارات',
    shortName: 'السباق',
    description: 'رحلة مشمسة بالسيارة — انعطف وتفادَ العقبات واجمع العملات!',
  },
  // Spoken prompt (docs/VOICE.md).
  say: {
    drive: 'هَيّا! لِنَتَسابَقْ إلى خَطِّ النِّهاية!',
  },
  cars: {
    turbo: 'الصاروخ',
    zippy: 'البرق',
    buggy: 'الجيب',
    taxi: 'التاكسي',
    patrol: 'الشرطة',
    truck: 'الشاحنة',
    tractor: 'الجرّار',
    moto: 'الدرّاجة',
  },
  themes: {
    meadow: 'المرج',
    beach: 'الشاطئ',
    desert: 'الصحراء',
    snow: 'التلال الثلجية',
  },
  // Places, for screen readers; the screen shows medals.
  place: {
    p1: 'المركز الأول',
    p2: 'المركز الثاني',
    p3: 'المركز الثالث',
  },
  a11y: {
    steer: 'قُد السيارة',
    pause: 'توقّف',
    resume: 'تابع القيادة',
    exit: 'عودة إلى الخريطة',
    drive: 'انطلق',
    cars: 'اختر سيارة',
    locked: 'ليس بعد',
  },
};
