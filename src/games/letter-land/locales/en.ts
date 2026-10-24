// Every user-facing string this game renders. `meta.name`/`meta.description`
// localize the home tile + header (config.ts keeps the English fallback).
//
// Letter names + example words live in the shared `letters` namespace
// (`@/games/_shared/letters`).
export const en = {
  meta: {
    name: 'Letter Land',
    description: 'Listen and find your letters!',
  },
  loading: 'Getting your letters ready…',
  hearFind: {
    listen: 'LISTEN…',
    tapAgain: 'Tap to hear it again',
    which: 'Which letter is it?',
  },
  a11y: {
    replay: 'Hear the letter again',
    choiceTile: 'Letter {{glyph}}',
  },
  levelSolved: {
    title: 'You got it!',
    next: 'Next Letter',
    finish: 'All Done!',
  },
} as const;

// Structural type: forces ar.ts to have the SAME keys without locking VALUES.
type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
