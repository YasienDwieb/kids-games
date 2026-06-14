import type { GameTranslations } from './en';

// Arabic — meaningful & kid-friendly, NOT literal machine translation.
// Western digits for numbers; emoji left as-is.
export const ar: GameTranslations = {
  meta: {
    name: 'اعدد وفرقّع',
    description: 'اعدد وفرقّع وتعلّم الأرقام!',
  },
  placeholder: 'اعدد وفرقّع قريبًا! 🔢',
  loading: 'نجهّز لك الأرقام…',
  // Prompt instructions per mode
  countThisMany: {
    title: 'اضغط هذا العدد',
    instruction: 'فرقّع {{count}} {{emoji}}!',
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
    objectTile: '{{emoji}}، اضغط لتفرقّع',
    objectPopped: '{{emoji}}، انفجر',
    choiceButton: 'الرقم {{value}}',
  },
};
