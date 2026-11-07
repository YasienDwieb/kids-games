// Every user-facing string this game renders. `meta.name`/`meta.description`
// localize the home tile + header (config.ts keeps the English fallback).
export const en = {
  meta: {
    name: 'Count & Pop',
    description: 'Count, pop, and learn your numbers!',
  },
  placeholder: 'Count & Pop is coming soon! 🔢',
  loading: 'Getting your numbers ready…',
  // Spoken prompts (docs/VOICE.md).
  say: {
    pop: "Pop {{name}}!",
    howMany: "How many?",
    makeN: "How many more to make {{name}}?",
    addition: "How many altogether?",
  },
  // A number after "to make", where Arabic grammar changes it (إلى اِثنين).
  targets: {
    '2': 'two',
  },
  numbers: {
    '1': 'one',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five',
    '6': 'six',
    '7': 'seven',
    '8': 'eight',
    '9': 'nine',
    '10': 'ten',
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
