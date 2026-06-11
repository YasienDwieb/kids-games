import type { GameTranslations } from './en';

export const ar: GameTranslations = {
  meta: {
    name: 'سباق السيارات',
    description: 'سباق رحلة مشمسة — انعطف وتفادَ العقبات واجمع العملات!',
  },
  start: {
    title: 'سباق السيارات',
    level: 'المستوى {{n}}',
    race: 'انطلق!',
    garage: 'المرآب',
    mapLabel: 'رحلة الطريق',
  },
  controls: {
    label: 'التحكم',
    drag: 'بالإصبع',
    tilt: 'بالإمالة',
  },
  pause: {
    title: 'استراحة',
    resume: 'أكمل السباق',
    exit: 'إنهاء السباق',
  },
  missions: {
    title: 'المهام',
    claim: 'استلم',
    types: {
      coins: 'اجمع {{n}} عملة',
      first: 'افز بـ {{n}} سباقات',
      races: 'أكمل {{n}} سباقات',
      boost: 'خذ {{n}} منصات تسارع',
      clean: 'أكمل {{n}} سباقات دون اصطدام',
    },
  },
  cups: {
    meadow: 'كأس المرج',
    beach: 'كأس الشاطئ',
    desert: 'كأس الصحراء',
    snow: 'كأس الثلج',
    earned: 'فزت بـ{{name}}!',
  },
  countdown: {
    go: 'انطلق!',
  },
  hud: {
    level: 'المستوى {{n}}',
  },
  place: {
    p1: 'الأول',
    p2: 'الثاني',
    p3: 'الثالث',
  },
  win: {
    title: {
      p1: 'المركز الأول!',
      p2: 'المركز الثاني!',
      p3: 'المركز الثالث!',
    },
    coins: '+{{n}} عملة',
    next: 'السباق التالي',
    garage: 'المرآب',
  },
  garage: {
    title: 'مرآبي',
    trim: 'اللون',
    selected: 'مختارة',
    select: 'اختر',
    unlock: 'افتح',
    done: 'تم',
    trophies: 'الكؤوس',
    noTrophies: 'تسابق لتفوز بالكؤوس!',
    stats: {
      speed: 'السرعة',
      grip: 'التحكم',
    },
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
  trims: {
    coral: 'مرجاني',
    green: 'أخضر',
    blue: 'أزرق',
    orange: 'برتقالي',
  },
  themes: {
    meadow: 'المرج',
    beach: 'الشاطئ',
    desert: 'الصحراء',
    snow: 'التلال الثلجية',
  },
  a11y: {
    steer: 'قُد السيارة',
    coins: 'العملات',
    stars: 'النجوم',
    pause: 'أوقف السباق مؤقتًا',
  },
};
