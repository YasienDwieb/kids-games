export const en = {
  meta: {
    name: 'Simple Pairs',
    shortName: 'Pairs',
    description: 'Find matching pairs of cards',
  },
  say: {
    find: 'Find the matching pairs!',
  },
  difficulty: {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    expert: 'Expert',
    meta: '{{pairs}} pairs · {{cards}} cards',
  },
  header: {
    restart: 'Restart',
    pairs: '{{found}}/{{total}} pairs',
  },
} as const;

// Structural type: every leaf is a string, so ar must match the same keys
// without being locked to English literal values.
type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
