import type { GameTranslations } from './en';

// Arabic strings — warm, playful, and simple for young children.
// Western digits are used for numbers. Emoji are not translated.
//
// Naming note: this card-matching game is universally called "لعبة الذاكرة"
// (Memory) in Arabic app stores/toy shops, and the action is "مطابقة" (matching)
// — never "زوج/أزواج" (which primarily means spouse and reads oddly for kids).
// So we drop the literal "pairs" framing entirely in favour of memory + matching.
export const ar: GameTranslations = {
  meta: {
    name: 'الذاكرة الممتعة',
    shortName: 'الذاكرة',
    description: 'اقلب البطاقات وابحث عن المتطابقة',
  },
  difficulty: {
    select: {
      subtitle: 'كم بطاقة متطابقة تستطيع أن تجد؟',
    },
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب',
    expert: 'بطل',
    meta: '{{pairs}} مطابقة · {{cards}} بطاقة',
  },
  header: {
    restart: 'من البداية',
    pairs: '{{found}}/{{total}} مطابقة',
    movesOne: '{{count}} خطوة',
    movesOther: '{{count}} خطوات',
  },
  win: {
    title: 'أحسنت!',
    playAgain: 'العب مرة ثانية',
    pickLevel: 'اختر مستوى',
  },
};
