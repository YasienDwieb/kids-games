// Every user-facing string this game renders. `meta.name`/`meta.description`
// localize the home tile + header (config.ts keeps the English fallback).
// Shape Detective is language-light by design: only instructions & labels
// are translated — the puzzles themselves are shapes + numerals.
export const en = {
  meta: {
    name: 'Shape Detective',
    description: 'Spot the pattern and crack the case!',
  },
  loading: 'Getting your case ready…',
  // Pattern puzzle strings
  pattern: {
    instruction: 'What comes next?',
    choose: '— choose —',
    optionLabel: 'Option {{index}}: {{size}} {{kind}}',
  },
  // Level solve overlay
  levelSolved: {
    title: 'Great job!',
    next: 'Next level',
    finish: 'You did it!',
  },
  // Odd-one-out puzzle strings
  oddOneOut: {
    instruction: 'Which one does not belong?',
    itemLabel: 'Item {{index}}: {{size}} {{kind}}',
  },
  // Sort puzzle strings
  sort: {
    instruction: 'Drag each shape into the right group!',
    dropHere: 'Drop here',
    binLabel: '{{name}} ({{count}} shapes)',
    itemLabel: 'Shape {{index}}: {{size}} {{kind}}',
  },
  // Shape attribute labels — used in accessibilityLabel and optionLabel interpolation.
  // Raw enum values (circle, large) must be translated so screen readers
  // speak the correct language.
  shapes: {
    kind: {
      circle: 'circle',
      square: 'square',
      triangle: 'triangle',
      star: 'star',
      heart: 'heart',
      diamond: 'diamond',
    },
    size: {
      small: 'small',
      medium: 'medium',
      large: 'large',
    },
    // Color names mapped from the design-system accent palette.
    // Used when a sort bin groups shapes by color (never exposes raw hex).
    color: {
      purple: 'purple',
      blue: 'blue',
      green: 'green',
      coral: 'coral',
      orange: 'orange',
      pink: 'pink',
    },
  },
} as const;

// Structural type: forces ar.ts to have the SAME keys without locking VALUES.
type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
