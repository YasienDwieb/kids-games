export const en = {
  meta: {
    name: 'Simple Pairs',
    shortName: 'Pairs',
    description: 'Find matching pairs of cards',
  },
  difficulty: {
    select: {
      subtitle: 'How many pairs can you match?',
    },
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    expert: 'Expert',
    meta: '{{pairs}} pairs · {{cards}} cards',
  },
  header: {
    restart: 'Restart',
    pairs: '{{found}}/{{total}} pairs',
    movesOne: '{{count}} move',
    movesOther: '{{count}} moves',
  },
  win: {
    title: 'You did it!',
    playAgain: 'Play again',
    pickLevel: 'Pick a level',
  },
} as const;

// Structural type: every leaf is a string, so ar must match the same keys
// without being locked to English literal values.
type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
