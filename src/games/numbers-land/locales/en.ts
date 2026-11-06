// Every user-facing string this game renders. `meta.name`/`meta.description`
// localize the home tile + header (config.ts keeps the English fallback).
//
// `names.*` are the spoken number names, keyed by NumberItem.id ('1'..'10').
// Digit GLYPHS are authored DATA in constants.ts — never translated.
export const en = {
  meta: {
    name: 'Numbers Land',
    shortName: 'Numbers',
    description: 'Listen and find your numbers!',
  },
  loading: 'Getting your numbers ready…',
  speak: {
    carrier: '{{name}}',
  },
  a11y: {
    replay: 'Hear the number again',
    choiceTile: 'Number {{glyph}}',
  },
  // Spoken number name per id ('1'..'10').
  names: {
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
} as const;

// Structural type: forces ar.ts to have the SAME keys without locking VALUES.
type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
