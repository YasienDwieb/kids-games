import type { GameTranslations } from './en';

// Arabic — meaningful & kid-friendly, NOT literal machine translation.
// Western digits for numbers; emoji left as-is.
export const ar: GameTranslations = {
  meta: {
    name: 'عُدّ والعب',
    description: 'عُدّ والعب وتعلّم الأرقام!',
  },
  placeholder: 'عُدّ والعب قريبًا! 🔢',
  loading: 'نجهّز لك الأرقام…',
  // Prompt instructions per mode
  countThisMany: {
    title: 'اضغط هذا العدد',
    instruction: 'اضغط {{count}} {{emoji}}!',
    progress: '{{popped}} / {{target}}',
  },
  howMany: {
    title: 'كم عددها؟',
    instruction: 'كم {{emoji}} هنا؟',
  },
  makeN: {
    title: 'اجعلها',
    instruction: 'أضف {{needed}} كي تصل إلى {{target}} {{emoji}}!',
  },
  addition: {
    title: 'اجمعها',
    // LTR isolate (U+2066…U+2069) keeps the math expression left-to-right
    // so Unicode Bidi doesn't reorder it to "؟ = b + a" inside the RTL paragraph.
    instruction: '⁦{{a}} + {{b}} = ؟⁩',
  },
  // Level solved overlay
  levelSolved: {
    title: 'أحسنت!',
    next: 'المستوى التالي',
    finish: 'رائع، أنهيت اللعبة!',
  },
  // Accessibility labels
  a11y: {
    objectTile: '{{emoji}}، اضغط لتعدّه',
    objectPopped: '{{emoji}}، تم عدّه',
    choiceButton: 'الرقم {{value}}',
  },
};
