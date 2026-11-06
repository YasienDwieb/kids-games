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
  // Spoken prompts (docs/VOICE.md).
  say: {
    pop: "اِضغطْ {{name}}!",
    howMany: "كَمْ عَدَدُها؟",
    makeN: "كَمْ يَنْقُصُنا؟",
    addition: "كَمْ عَدَدُها مَعًا؟",
  },
  numbers: {
    '1': 'وَاحِد',
    '2': 'اِثنان',
    '3': 'ثَلاثة',
    '4': 'أَربَعة',
    '5': 'خَمسة',
    '6': 'سِتّة',
    '7': 'سَبعة',
    '8': 'ثَمانِية',
    '9': 'تِسْعة',
    '10': 'عَشَرة',
  },
  // Prompt instructions per mode
  countThisMany: {
    progress: '{{popped}} / {{target}}',
  },
  addition: {
    // LTR isolate (U+2066…U+2069) keeps the math expression left-to-right
    // so Unicode Bidi doesn't reorder it to "؟ = b + a" inside the RTL paragraph.
    instruction: '⁦{{a}} + {{b}} = ؟⁩',
  },
  // Accessibility labels
  a11y: {
    objectTile: '{{emoji}}، اضغط لتعدّه',
    objectPopped: '{{emoji}}، تم عدّه',
    choiceButton: 'الرقم {{value}}',
  },
};
