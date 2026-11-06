export const en = {
  meta: {
    name: 'Mouse Maze',
    description: 'Draw a path to help the mouse find its cheese!',
  },
  say: {
    find: 'Help the mouse find the cheese!',
  },
  hud: {
    level: 'Level {{level}}',
    hintLabel: 'Show hint',
  },
} as const;

type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
