export const en = {
  meta: {
    name: 'Mouse Maze',
    description: 'Swipe to help the mouse find its cheese!',
  },
  hud: {
    level: 'Level {{level}}',
    hintLabel: 'Show hint',
  },
  win: {
    title: 'You made it!',
    nextMaze: 'Next maze',
  },
} as const;

type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
