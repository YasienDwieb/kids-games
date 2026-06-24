// Core (non-game) English strings: screens, shared SDK UI, age bands.
// Each game registers its own namespace via registerTranslations() — do NOT
// add per-game strings here.
export const en = {
  common: {
    back: 'Back',
    pause: 'Pause',
    settings: 'Settings',
    done: 'Done',
    cancel: 'Cancel',
    save: 'Save',
    playAgain: 'Play again',
    tryAgain: 'Try again',
    restart: 'Restart',
  },
  home: {
    greeting: 'Hello there 👋',
    title: "Let's Play!",
    all: 'All',
    empty: 'More games coming soon! 🎈',
  },
  settings: {
    title: 'Settings',
    sound: 'Sound effects',
    haptics: 'Haptics',
    showGamesFor: 'Show games for',
    all: 'All',
    language: 'Language',
    version: 'Kids Games · v1.0',
    switching: 'Switching language…',
    guided: {
      games: 'Games in the journey',
    },
  },
  player: {
    notFound: 'Game not found',
  },
  resume: {
    welcomeBack: 'Welcome back! 👋',
    continueLevel: 'Continue · Level {{level}}',
    startOver: 'Start over',
  },
  ageBands: {
    toddler: 'Toddler',
    preschool: 'Preschool',
    early: 'Early years',
    kids: 'Big kids',
  },
  flow: {
    title: 'Your journey',
    continue: 'Continue your journey',
    allCaughtUp: "You're all caught up 🌟",
    exit: 'Done',
    switchJourney: 'Journey',
    switchGames: 'Games',
    includedGames: 'In this journey:',
    holdToReset: 'Hold to start over',
    empty: 'Add games in Settings',
  },
} as const;

// Structural shape (every leaf is a string) so the Arabic catalog must match
// the same KEYS without being constrained to the literal English VALUES.
type Translations<T> = { [K in keyof T]: T[K] extends string ? string : Translations<T[K]> };
export type CoreTranslations = Translations<typeof en>;
