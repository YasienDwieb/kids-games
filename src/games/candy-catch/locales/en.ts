// Every user-facing string this game renders. `meta.name`/`meta.description`
// localize the home tile + header (config.ts keeps the English fallback).
export const en = {
  meta: {
    name: 'Candy Catch',
    description: 'Move the basket — catch the treats, dodge the yucky ones!',
  },
  hud: {
    level: 'Level {{level}}',
    score: 'Score {{score}}',
  },
  start: {
    title: 'Catch the treats!',
    subtitle: 'Good: 🍬 🍭 🍪   Yucky: 🌶️ 💣',
    tap: 'Tap to start',
  },
  win: {
    title: 'Yummy!',
    next: 'Next level',
    done: 'All caught!',
  },
  lose: {
    title: 'Oops!',
    subtitle: 'Out of hearts',
    retry: 'Try again',
  },
  a11y: {
    basket: 'Basket, drag to move',
    hint: 'Playfield',
  },
} as const;

// Structural type: forces ar.ts to have the SAME keys without locking VALUES.
type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
