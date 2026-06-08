// Every user-facing string this game renders. `meta.name`/`meta.description`
// localize the home tile + header (config.ts keeps the English fallback).
export const en = {
  meta: {
    name: 'Template Game',
    description: 'Copy this folder to start a new game.',
  },
  tapMe: 'Tap me — replace this with your game.',
  showWin: 'Show win overlay',
  win: 'You win! 🎉',
} as const;

// Structural type: forces ar.ts to have the SAME keys without locking VALUES.
type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
