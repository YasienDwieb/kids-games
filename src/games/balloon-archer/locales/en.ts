export const en = {
  meta: {
    name: 'Balloon Archer',
    description: 'Aim your bow and pop the balloons!',
  },
  hud: {
    level: 'Level {{n}}',
  },
  overlay: {
    wonAll: 'You won them all!',
    niceShooting: 'Nice shooting!',
    outOfArrows: 'Out of arrows!',
    poppedCount: '{{popped}}/{{quota}} popped',
    playAgain: 'Play again',
    nextLevel: 'Next level →',
    tryAgain: 'Try again',
  },
} as const;

type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
