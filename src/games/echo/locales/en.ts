// Every user-facing string this game renders. `meta.name`/`meta.description`
// localize the home tile + header (config.ts keeps the English fallback).
export const en = {
  meta: {
    name: 'Echo',
    description: 'Watch the pattern, then tap it back!',
  },
  hud: {
    round: 'Round',
    best: 'Best',
    roundValue: 'Round {{number}}',
    bestValue: 'Best score {{number}}',
  },
  start: {
    title: 'Echo',
    subtitle: 'Watch the lights, then tap them back!',
    button: 'Start',
    buttonA11y: 'Start the game',
  },
  playback: {
    watch: 'Watch carefully…',
  },
  input: {
    yourTurn: 'Your turn!',
  },
  gameover: {
    title: 'Oh no!',
    score: 'You reached sequence {{count}}!',
    newBest: 'New best score!',
    newBestA11y: 'Congratulations, new best score!',
    playAgain: 'Play Again',
    playAgainA11y: 'Play the game again',
  },
  pads: {
    label: 'Pad {{number}}',
    labelDisabled: 'Pad {{number}}, wait for your turn',
  },
} as const;

// Structural type: forces ar.ts to have the SAME keys without locking VALUES.
type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
