// Every user-facing string this game renders. `meta.name`/`meta.description`
// localize the home tile + header (config.ts keeps the English fallback).
//
// Two round modes:
//   • hearName   — the animal NAME is spoken (via useSpeech); strings under
//                  `hearName.*` and the per-animal `names.<id>` strings.
//   • whichSound — the animal SOUND is played (via useSound); strings under
//                  `whichSound.*`.
// Animal EMOJI are authored DATA in constants.ts — never translated.
export const en = {
  meta: {
    name: 'Animal Safari',
    description: 'Listen and find the animals!',
  },
  loading: 'Getting the animals ready…',
  hearName: {
    listen: 'LISTEN…',
    tapAgain: 'Tap to hear it again',
    which: 'Which animal is it?',
  },
  whichSound: {
    listen: 'LISTEN…',
    tapAgain: 'Tap to hear it again',
    which: 'Which animal makes this sound?',
  },
  a11y: {
    replay: 'Say the animal name again',
    replaySound: 'Play the animal sound again',
    choiceTile: 'Pick the {{name}}',
    choiceTileGeneric: 'Pick this animal',
  },
  // Animal names spoken in "hearName" rounds + used as a11y labels. Keyed by
  // animal id (see constants.ts ANIMALS); kept in inventory order.
  names: {
    lion: 'Lion',
    elephant: 'Elephant',
    cow: 'Cow',
    dog: 'Dog',
    cat: 'Cat',
    frog: 'Frog',
    horse: 'Horse',
    sheep: 'Sheep',
    rooster: 'Rooster',
    duck: 'Duck',
    bird: 'Bird',
    bee: 'Bee',
  },
  levelSolved: {
    title: 'Great job!',
    next: 'Next Animal',
    finish: 'All Done!',
  },
} as const;

// Structural type: forces ar.ts to have the SAME keys without locking VALUES.
type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
