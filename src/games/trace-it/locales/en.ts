// Every user-facing string Trace It renders. Letter names + example words live
// in the shared `letters` namespace (`@/games/_shared/letters`).
export const en = {
  meta: {
    name: 'Trace It',
    description: 'Trace letters and numbers with your finger!',
  },
  tabs: {
    warmup: 'Warm-up',
    letters: 'Letters',
    numbers: 'Numbers',
  },
  picker: {
    next: 'Next',
  },
  round: {
    guided: 'Follow the arrow!',
    solo: 'Now on your own!',
    dots: 'Add the dots!',
    warmup: 'Help them get there!',
  },
  sticker: {
    iCanWrite: 'I can write {{glyph}}!',
  },
  speak: {
    carrier: '{{name}}. {{word}}',
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
    line: 'straight line',
    zigzag: 'zigzag',
    wave: 'wave',
    arch: 'bridges',
    loops: 'loops',
    spiral: 'spiral',
    circle: 'circle',
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
