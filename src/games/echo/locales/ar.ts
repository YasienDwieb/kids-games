import type { GameTranslations } from './en';

// Arabic — meaningful & kid-friendly, NOT literal machine translation.
// Western digits for numbers; emoji left as-is.
export const ar: GameTranslations = {
  meta: {
    name: 'تذكّر وكرّر',
    description: 'شاهد الأضواء ثم اضغط عليها بالترتيب!',
  },
  hud: {
    round: 'الجولة',
    best: 'أفضل',
    roundValue: 'الجولة {{number}}',
    bestValue: 'أفضل نتيجة {{number}}',
  },
  start: {
    title: 'صدى',
    subtitle: 'شاهد الأضواء ثم اضغط عليها بالترتيب!',
    button: 'ابدأ',
    buttonA11y: 'ابدأ اللعبة',
  },
  playback: {
    watch: 'انظر جيدًا…',
  },
  input: {
    yourTurn: 'دورك الآن!',
  },
  gameover: {
    title: 'أوه لا!',
    score: 'وصلت إلى تسلسل {{count}}!',
    newBest: 'أفضل نتيجة جديدة!',
    newBestA11y: 'مبروك، أفضل نتيجة جديدة!',
    playAgain: 'العب مجددًا',
    playAgainA11y: 'العب اللعبة مجددًا',
  },
  pads: {
    label: 'زر {{number}}',
    labelDisabled: 'زر {{number}}، انتظر دورك',
  },
};
