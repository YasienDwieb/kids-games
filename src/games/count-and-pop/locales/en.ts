// Every user-facing string this game renders. `meta.name`/`meta.description`
// localize the home tile + header (config.ts keeps the English fallback).
export const en = {
  meta: {
    name: 'Count & Pop',
    description: 'Count, pop, and learn your numbers!',
  },
  placeholder: 'Count & Pop is coming soon! 🔢',
  loading: 'Getting your numbers ready…',
  // Prompt instructions per mode
  countThisMany: {
    title: 'TAP THIS MANY',
    instruction: 'Pop {{count}} {{emoji}}!',
    progress: '{{popped}} / {{target}}',
  },
  howMany: {
    title: 'HOW MANY?',
    instruction: 'How many {{emoji}}?',
  },
  makeN: {
    title: 'MAKE IT',
    instruction: 'Add {{needed}} more to make {{target}} {{emoji}}!',
  },
  addition: {
    title: 'ADD THEM UP',
    instruction: '{{a}} + {{b}} = ?',
  },
  // Level solved overlay
  levelSolved: {
    title: 'Great job!',
    next: 'Next level',
    finish: 'You did it!',
  },
  // Accessibility labels
  a11y: {
    objectTile: '{{emoji}}, tap to pop',
    objectPopped: '{{emoji}}, popped',
    choiceButton: 'Number {{value}}',
  },
} as const;

// Structural type: forces ar.ts to have the SAME keys without locking VALUES.
type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
