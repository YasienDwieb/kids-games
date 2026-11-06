// Every user-facing string Trace It renders. Letter names + example words live
// in the shared `letters` namespace (`@/games/_shared/letters`).
export const en = {
  meta: {
    name: 'Trace It',
    description: 'Trace letters and numbers with your finger!',
  },
  tabs: {
    warmup: 'Warm-up',
    // The letters themselves, so a pre-reader knows the subject.
    latin: 'ABC',
    arabic: 'أ ب ت',
    numbers: '123',
  },
  digits: {
    d0: 'zero',
    d1: 'one',
    d2: 'two',
    d3: 'three',
    d4: 'four',
    d5: 'five',
    d6: 'six',
    d7: 'seven',
    d8: 'eight',
    d9: 'nine',
  },
  warmup: {
    line: 'a straight line',
    zigzag: 'a zigzag',
    wave: 'a wave',
    arch: 'bridges',
    loops: 'loops',
    spiral: 'a spiral',
    circle: 'a circle',
  },
  a11y: {
    replay: 'Hear it again',
    tile: '{{label}}',
    board: 'Tracing board',
  },
} as const;

// Structural type: forces ar.ts to have the SAME keys without locking VALUES.
type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
