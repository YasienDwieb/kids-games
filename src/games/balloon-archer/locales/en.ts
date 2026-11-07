export const en = {
  meta: {
    name: 'Balloon Archer',
    shortName: 'Archer',
    description: 'Aim your bow and pop the balloons!',
  },
  // Spoken prompt (docs/VOICE.md).
  say: {
    pop: 'Pop the balloons!',
  },
} as const;

type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
