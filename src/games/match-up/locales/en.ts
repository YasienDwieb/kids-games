export const en = {
  meta: {
    name: 'Match Up',
    description: 'Draw a line from each thing to its match!',
  },
  loading: 'Getting ready…',
  score: 'Score: {{n}}',
  solved: {
    title: 'You matched them all!',
    next: 'Next',
  },
  prompts: {
    animalFood: 'Match each animal to its food',
    workerTool: 'Match each helper to their tool',
    animalHome: 'Match each animal to its home',
    colorFruit: 'Match each color to its fruit',
    babyAnimal: 'Match each baby to its grown-up',
  },
} as const;

// Structural type: forces ar.ts to have the SAME keys without locking VALUES.
type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
